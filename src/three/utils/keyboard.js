import * as THREE from 'three'
import {useKeyboardStore} from '@/store/modules/keyboard'

const WORLD_UP = new THREE.Vector3(0, 1, 0)

/**
 * KeyboardControls —— 通用键盘相机控制器
 * （已从原 controls/keyboard/KeyboardControls.js 迁移至本文件，统一维护）
 *
 * 控制逻辑：
 *  ── 方向键（不按 Shift）：在相机「本地坐标系」下平移
 *       ↑ / ↓  ：沿相机本地上下轴移动（上升 / 下降）
 *       ← / →  ：沿相机本地左右轴平移（左移 / 右移）
 *  ── Shift + 方向键：
 *       Shift + ↑ / ↓ ：沿「视线在 XZ 水平面的投影」平行前后走（前进 / 后退，高度与朝向不变）
 *       Shift + ← / → ：偏航（左右）转动 —— 左转 / 右转
 *
 * 设计要点：
 *  1. 纯增量驱动 —— 只「推动」相机当前姿态，不读取也不覆盖其它控制器（pan / angle /
 *     orbitControls）的状态，因此可与鼠标漫游、OrbitControls 共存，互不打架。
 *  2. 帧率无关 —— update(delta) 按「秒」推进，切后台回来也不会瞬移。
 *  3. 水平平行移动 —— Shift + ↑/↓ 将视线方向投影到 XZ 平面后移动，相机高度与朝向保持不变。
 *  4. 失焦保护 —— 窗口 blur 时清空按键，防止按键「卡住」持续移动。
 *  5. 外部同步 —— 通过 onPositionChange(delta) 回调把每帧「世界位移量」告知外部，
 *     便于与其它控制器（如 OrbitControls）共享同一份轨道中心，避免鼠标接管时把相机拉回原点。
 *
 * 用法 A（手动接入渲染循环，推荐与项目的 time.on('tick') 配合）：
 *   const controls = new KeyboardControls(camera, { moveSpeed: 30, rotateSpeed: Math.PI/2 })
 *   controls.enable()
 *   time.on('tick', () => controls.update(1 / 60))
 *
 * 用法 B（内置自循环，无需外部渲染循环）：
 *   new KeyboardControls(camera, { autoUpdate: true }).enable()
 */
class KeyboardControls {
  constructor(camera, options = {}) {
    if (!camera) throw new Error('KeyboardControls: 必须传入一个 THREE.Camera 实例')
    this.camera = camera

    this.moveSpeed = options.moveSpeed ?? 30              // 移动速度（单位 / 秒）
    this.rotateSpeed = options.rotateSpeed ?? Math.PI / 2 // 旋转速度（弧度 / 秒）
    this.enableShiftRotation = options.enableShiftRotation ?? true
    this.autoUpdate = options.autoUpdate ?? false
    // 位置变更回调：每次键盘平移相机后，把「本帧世界位移量(Vector3)」回传给外部，
    // 供其同步其它控制器（如 OrbitControls.target）。不传则不同步。
    this.onPositionChange = options.onPositionChange ?? null
    // 旋转回调：每次键盘偏航后把本帧旋转量(弧度，绕世界 Y)告知外部，
    // 供其同步 OrbitControls 等会「lookAt 锁定朝向」的控制器的轨道中心，
    // 避免外部每帧把键盘转向抵消掉。
    this.onRotateChange = options.onRotateChange ?? null
    // 方向键集合：优先用外部传入（适配层会从 store 注入），否则用内置默认，避免依赖 Pinia
    this.arrowKeys = options.arrowKeys ?? new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
    this.setArrow = options.setArrow ?? null
    this.enabled = false
    this.keys = new Set()   // 当前按下的物理按键（event.code）
    this._raf = null
    this._lastTime = 0

    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._onBlur = this._onBlur.bind(this)
    this._tick = this._tick.bind(this)
  }

  /**
   * 启用键盘监听
   * @returns {KeyboardControls}
   */
  enable() {
    if (this.enabled) return this
    this.enabled = true
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    window.addEventListener('blur', this._onBlur)
    if (this.autoUpdate) this.start()
    return this
  }

  /**
   * 停用键盘监听并清空按键状态
   * @returns {KeyboardControls}
   */
  disable() {
    if (!this.enabled) return this
    this.enabled = false
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    window.removeEventListener('blur', this._onBlur)
    this.keys.clear()
    if (this.autoUpdate) this.stop()
    return this
  }

  /** 彻底销毁（停用 + 解绑） */
  destroy() {
    this.disable()
  }

  /** 启动内置渲染循环（autoUpdate 时调用，也可单独使用） */
  start() {
    if (this._raf) return
    this._lastTime = performance.now()
    this._raf = requestAnimationFrame(this._tick)
  }

  /** 停止内置渲染循环 */
  stop() {
    if (this._raf) {
      cancelAnimationFrame(this._raf)
      this._raf = null
    }
  }

  /**
   * 每帧推进相机姿态。请在渲染循环 / time tick 中调用。
   * @param {number} delta 上一帧到现在的秒数（默认 0.016 ≈ 60fps）
   */
  update(delta = 0.016) {
    if (!this.enabled) return

    const dt = Math.min(delta, 0.1) // 限制最大步长，避免切后台回来瞬移
    const shift = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
    const useRotate = shift && this.enableShiftRotation

    const move = this.moveSpeed * dt
    const rot = this.rotateSpeed * dt
    let mx = 0, my = 0, mForward = 0, yaw = 0

    for (const code of this.keys) {
      if (!this.arrowKeys.has(code)) continue
      if (useRotate) {
        // Shift 模式：↑↓ 沿视线水平投影平行前后走，←→ 左右转动（偏航）
        if (code === 'ArrowUp') mForward += move    // 前进（沿视线方向）
        else if (code === 'ArrowDown') mForward -= move // 后退
        else if (code === 'ArrowLeft') yaw += rot  // 左转
        else if (code === 'ArrowRight') yaw -= rot // 右转
      } else {
        // 普通模式：上下 + 左右 平移
        if (code === 'ArrowUp') my += move           // 上升
        else if (code === 'ArrowDown') my -= move    // 下降
        else if (code === 'ArrowLeft') mx -= move    // 左移
        else if (code === 'ArrowRight') mx += move   // 右移
      }
    }

    // 平移（沿相机本地坐标系）
    const hasTranslation = mx !== 0 || my !== 0 || mForward !== 0
    const posBefore = hasTranslation ? this.camera.position.clone() : null

    if (mx !== 0) this.camera.translateX(mx)
    if (my !== 0) this.camera.translateY(my)

    // Shift + ↑/↓：将相机视线方向投影到 XZ 水平面后做平行移动，
    // 仅改变水平位置、不改变相机高度（Y）与朝向（贴地飞行）
    if (mForward !== 0) {
      const dir = new THREE.Vector3()
      this.camera.getWorldDirection(dir) // 相机看向的方向（世界坐标，已归一化）
      dir.y = 0                          // 投影到水平面
      if (dir.lengthSq() > 1e-8) {       // 防止视线接近垂直时退化
        dir.normalize()
        this.camera.position.addScaledVector(dir, mForward)
      }
    }

    // 把本帧「世界位移量」回调给外部，便于同步其它控制器的轨道中心
    // （例如 OrbitControls.target.add(delta)，避免鼠标接管时把相机拉回原点）
    if (hasTranslation && this.onPositionChange) {
      const moved = this.camera.position.clone().sub(posBefore)
      if (moved.lengthSq() > 1e-12) this.onPositionChange(moved)
    }

    // 偏航：绕世界 Y 轴旋转，保证相机始终「直立」不会侧翻。
    // 若外部存在会每帧 lookAt(target) 的控制器（如 OrbitControls.update），
    // 仅旋转相机朝向会被其还原；故同时把本帧旋转量回传，
    // 由外部把轨道中心(target)绕相机同步旋转，保持两套控制一致。
    if (yaw !== 0) {
      this.camera.rotateOnWorldAxis(WORLD_UP, yaw)
      if (this.onRotateChange) this.onRotateChange(yaw)
    }
  }

  /** 内置循环每帧回调 */
  _tick(now) {
    const delta = (now - this._lastTime) / 1000
    this._lastTime = now
    this.update(delta)
    this._raf = requestAnimationFrame(this._tick)
  }

  _onKeyDown(event) {
    console.log('_onKeyDown')
    console.log(event.code)
    const code = event.code
    if(this.setArrow) {
      this.setArrow(code, true);
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || this.arrowKeys.has(code)) {
      this.keys.add(code)
      // 阻止方向键滚动页面
      if (this.arrowKeys.has(code)) event.preventDefault()
    }
  }

  _onKeyUp(event) {
    console.log('_onKeyUp')
    if(this.setArrow) {
      this.setArrow(event.code, false);
    }
    this.keys.delete(event.code)
  }

  _onBlur() {
    console.log('_onBlur')
    if(this.setArrow) {
      this.setArrow(null, false);
    }
    // 窗口失焦时清空，避免按键状态残留导致相机持续移动
    this.keys.clear()
  }
}

/**
 * 演示用键盘控制适配层（胶水层）
 * 接收相机与可选的 OrbitControls 实例，把通用 KeyboardControls 的位移
 * 同步到 OrbitControls 的轨道中心(target)，使鼠标漫游接管时相机不会被拉回初始位置。
 *
 * 控制行为（由通用 KeyboardControls 定义）：
 *  - 方向键（无 Shift）：相机本地坐标系平移（↑↓ 上下、←→ 左右）
 *  - Shift + 方向键：Shift+↑↓ 沿视线XZ水平投影平行前后走（高度/朝向不变）、Shift+←→ 左右转动（偏航）
 *
 * 解耦说明：
 *  - 通用 KeyboardControls 完全不知道 OrbitControls 的存在，只会在每帧平移后回调 onPositionChange(delta)。
 *  - 本适配层接收 orbitControls 实例，把位移同步到它的轨道中心(target)，
 *    使鼠标漫游接管时不会把相机拉回初始位置——耦合收敛在本层，调用方无需关心。
 *
 * @param {THREE.Camera} camera 相机实例
 * @param {OrbitControls} [orbitControls] 可选，传入后与键盘平移同步轨道中心
 * @param {Object} [options] 透传给通用 KeyboardControls 的额外配置（moveSpeed / rotateSpeed 等）
 */
export class Keyboard {
  constructor(camera, orbitControls = null, options = {}) {
    if (!camera) {
      console.warn('[Keyboard] 未传入 camera 实例，键盘控制不会生效')
      return
    }
    // 运行时（构造函数）读取 Pinia store —— 此时 app.use(pinia) 早已执行，不会报 "no active Pinia"
    const keyboard = useKeyboardStore()
    const arrowKeys = keyboard.setArrowKeys
    const setArrow = keyboard.setArrow
    // autoUpdate：内部自带 requestAnimationFrame 循环，无需外部调用 update
    this.controls = new KeyboardControls(camera, {
      autoUpdate: true,
      ...options,
      arrowKeys,
      setArrow,
      // 从 store 注入方向键集合
      // 把键盘平移产生的「世界位移量」同步到 OrbitControls 的轨道中心，
      // 让鼠标漫游接管时相机不会被拉回初始位置（方案 A）
      onPositionChange: (delta) => {
        if (orbitControls) orbitControls.target.add(delta)
      },
      // 键盘偏航时同步旋转 OrbitControls 的轨道中心(target)：把 target 绕相机
      // 在世界 Y 平面内转过相同角度，使每帧 OrbitControls.update() 的
      // lookAt(target) 不再把键盘转向抵消（配合地图模式下每帧 update 使用）
      onRotateChange: (yaw) => {
        if (!orbitControls) return
        orbitControls.target
          .sub(camera.position)
          .applyAxisAngle(WORLD_UP, yaw)
          .add(camera.position)
      },
    })
  }

  /** 开启键盘监听（同时启动内部循环） */
  enable() {
    this.controls && this.controls.enable()
  }

  /** 关闭键盘监听（同时停止内部循环） */
  disable() {
    this.controls && this.controls.disable()
  }
}

// 同时导出通用类，方便其它模块直接复用（无需再引用 controls/keyboard 子目录）
export { KeyboardControls }
