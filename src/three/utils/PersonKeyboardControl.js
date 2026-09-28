import * as THREE from 'three'
import { KeyboardControls } from './keyboard.js'

const WORLD_UP = new THREE.Vector3(0, 1, 0)

/**
 * PersonKeyboardControl —— 第一人称下的人物键盘移动控制器
 *
 * 设计：
 *  - 复用 Utils/keyboard.js 的 KeyboardControls 来做「按键收集」（上下左右），
 *    但【不调用它的 update】，因此不会移动相机，只复用其 window 键监听与 keys 集合。
 *  - 自身只负责把「上下左右」翻译成人物的 前进/后退 + 左转/右转，
 *    直接驱动传入的 Object3D（人物 container 的 position 与 rotation）。
 *
 * 控制：
 *   ↑ / ↓ ：沿人物当前正面朝向，在水平面前后移动（前进 / 后退）
 *   ← / → ：绕世界 Y 轴左右转（左转 / 右转）
 *
 * 用法：
 *   const ctrl = new PersonKeyboardControl(container, { moveSpeed: 30, rotateSpeed: Math.PI / 2 })
 *   // 渲染循环里调用： ctrl.update(delta)
 *   // 仅第一人称时：   ctrl.setActive(true)
 *   // 销毁时：         ctrl.destroy()
 */
export class PersonKeyboardControl {
  constructor(object, options = {}) {
    if (!object) throw new Error('PersonKeyboardControl: 必须传入人物的 Object3D（container）')
    this.object = object

    this.moveSpeed = options.moveSpeed ?? 30             // 移动速度（单位/秒）
    this.rotateSpeed = options.rotateSpeed ?? Math.PI / 2 // 转向速度（弧度/秒）
    this.isActive = options.isActive ?? false

    // 复用 keyboard.js 的按键收集（只监听 window，不移动相机）：
    // 传一个空相机 + autoUpdate:false → enable() 仅绑定监听，
    // 只要不调用 update，就不会去动相机，只把按下的键收集进 this.kb.keys（Set）。
    this.kb = new KeyboardControls(new THREE.PerspectiveCamera(), { autoUpdate: false })
    this.kb.enable()

    // 复用方向向量，避免每帧 new
    this._forward = new THREE.Vector3()
  }

  /** 切换是否启用（第一人称时为 true） */
  setActive(v) {
    this.isActive = !!v
  }

  /** 每帧推进人物移动，请在渲染循环 / time tick 中调用 */
  update(delta = 0.016) {
    if (!this.isActive) return
    const dt = Math.min(delta, 0.1) // 限制最大步长，避免切后台回来瞬移
    const keys = this.kb.keys
    const up = keys.has('ArrowUp')
    const down = keys.has('ArrowDown')
    const left = keys.has('ArrowLeft')
    const right = keys.has('ArrowRight')

    // 转向：绕物体本地 Y 轴（container 未受父节点旋转时即世界 Y）
    const rot = this.rotateSpeed * dt
    if (left) this.object.rotateY(rot)    // 左转（逆时针）
    if (right) this.object.rotateY(-rot)  // 右转（顺时针）

    // 前进方向：人物正面 = 本地 -Z 轴，按当前朝向旋转
    // 若角色模型实际面朝 +Z，把 (0,0,-1) 改成 (0,0,1)
    this._forward.set(0, 0, -1).applyQuaternion(this.object.quaternion)
    this._forward.y = 0 // 仅水平移动，保持人物贴地
    if (this._forward.lengthSq() > 1e-8) {
      this._forward.normalize()
      const move = this.moveSpeed * dt
      if (up) this.object.position.addScaledVector(this._forward, move)    // 前进
      if (down) this.object.position.addScaledVector(this._forward, -move) // 后退
    }
  }

  /** 是否正在按键移动（供动画切换判断） */
  get isMoving() {
    const k = this.kb.keys
    return k.has('ArrowUp') || k.has('ArrowDown') || k.has('ArrowLeft') || k.has('ArrowRight')
  }

  /** 销毁：解绑 window 键盘监听，防止 HMR/切换时泄漏 */
  destroy() {
    this.kb && this.kb.disable()
    this.kb = null
    this.object = null
  }
}
