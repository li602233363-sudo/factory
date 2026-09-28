import * as THREE from 'three'
import gsap from 'gsap'
import { headingOf, shortestAngle } from '../model/gongchang/xunjian/loopPath.js'

/**
 * PersonPatrolControl —— 巡检模式下人物沿环路自动行走的控制器
 *
 * 与 PersonKeyboardControl 的区别：
 *   · 键盘控制是「玩家输入驱动」，这个是「路径驱动」，两者互斥（巡检时键盘让位）；
 *   · 位置由弧长 s 沿路径采样得到，朝向由行进方向算出并用阻尼平滑，
 *     所以拐角是平滑转头而不是瞬间甩 90°。
 *
 * 用法：
 *   const ctrl = new PersonPatrolControl(personContainer, { speed: 20 })
 *   ctrl.setPath(createLoopPath(rect))
 *   ctrl.start()                 // 从当前位置最近的环路上路点切入
 *   time.on('tick', () => ctrl.update(delta))
 *   ctrl.stop() / ctrl.destroy()
 */
export class PersonPatrolControl {
    constructor(object, options = {}) {
        if (!object) throw new Error('PersonPatrolControl: 必须传入人物的 Object3D（container）')
        this.object = object

        this.path = options.path ?? null
        this.speed = options.speed ?? 20 // 移动速度（单位 / 秒），默认与箭头流速一致
        this.turnLerp = options.turnLerp ?? 8 // 转向阻尼（1/秒），越大转头越快
        this.enterDuration = options.enterDuration ?? 1.5 // 入场补间最长时长（秒）
        this.enterMode = options.enterMode ?? 'snap' // 'snap' 直接落位 | 'tween' 补间过去
        /**
         * 起点弧长：
         *   数字（默认 0）= 固定起点，0 即环路右上角，每次播放都从同一处出发；
         *   null          = 取环路上离人物当前位置最近的点（就地切入）。
         */
        this.startS = options.startS === undefined ? 0 : options.startS

        this.running = false // 是否处于巡检行走（不含入场）
        this.entering = false // 是否正在做入场补间
        this.s = 0 // 当前弧长

        this._tween = null
        this._point = {} // 复用的采样结果，避免每帧 new
        this._heading = this.object.rotation.y
    }

    /** 设置行走路径（环路几何变了就重新 setPath） */
    setPath(path, speed) {
        if (path) this.path = path
        if (typeof speed === 'number' && speed > 0) this.speed = speed
    }

    /** 是否正在行走（供 walk / idle 动画切换判断，入场阶段算静止） */
    get isMoving() {
        return this.running && !this.entering
    }

    /**
     * 开始巡逻：把人物直接放到环路起点（默认右上角，箭头带中心线上），
     * 朝向对齐该点的行进方向，然后开始沿环路走。
     */
    start() {
        if (!this.object || !this.path || this.running) return
        this.running = true

        const from = this.object.position
        // 起点弧长：固定值 → 直接采样；null → 取离人物最近的点
        const s = typeof this.startS === 'number'
            ? this.startS
            : this.path.nearest(from.x, from.z, {}).s
        const p = this.path.sample(s, {})
        this.s = s
        const target = headingOf(p.dirX, p.dirZ)

        const dist = Math.hypot(p.x - from.x, p.z - from.z)
        // 默认 snap：直接改人物位置/朝向，一步到位，无过渡
        if (this.enterMode !== 'tween' || dist <= 1e-3) {
            this._place(p, from.y, target)
            return
        }

        this.entering = true
        // 距离越远给的时间越长，但有上下限：太短会瞬移、太长要干等
        const dur = THREE.MathUtils.clamp(dist / 300, 0.4, this.enterDuration)
        this._killTween()
        this._tween = gsap.to(this.object.position, {
            x: p.x,
            y: p.y ?? from.y,
            z: p.z,
            duration: dur,
            ease: 'power2.inOut',
            onComplete: () => {
                this.entering = false
                this._tween = null
            },
        })
        const heading = this.object.rotation.y + shortestAngle(this.object.rotation.y, target)
        gsap.to(this.object.rotation, { y: heading, duration: dur, ease: 'power2.inOut' })
        // 记下补间终点，入场结束后阻尼从这儿接着走，不会回弹
        this._heading = heading
    }

    /** 瞬间把人物放到采样点并对齐朝向 */
    _place(p, fallbackY, heading) {
        this.object.position.set(p.x, p.y ?? fallbackY, p.z)
        this.object.rotation.y = heading
        this._heading = heading
        this.entering = false
    }

    /** 每帧推进，请在渲染循环 / time tick 中调用 */
    update(delta = 0.016) {
        if (!this.running || !this.path || !this.object) return
        // 入场阶段位置由补间接管，这里不动，避免两套逻辑打架
        if (this.entering) return

        const dt = Math.min(delta, 0.1) // 限制最大步长，避免切后台回来瞬移
        this.s += this.speed * dt

        const p = this.path.sample(this.s, this._point)
        this.object.position.set(p.x, p.y ?? this.object.position.y, p.z)

        // 朝向：先算出目标角，再用阻尼逼近（拐角 90° 大约 0.3s 转完）
        const target = headingOf(p.dirX, p.dirZ)
        const k = Math.min(1, this.turnLerp * dt)
        this._heading += shortestAngle(this._heading, target) * k
        this.object.rotation.y = this._heading
    }

    /** 停止巡逻（人物停在当前位置） */
    stop() {
        this.running = false
        this.entering = false
        this._killTween()
    }

    /** 销毁：停补间 + 解引用 */
    destroy() {
        this.stop()
        this.path = null
        this.object = null
    }

    _killTween() {
        if (this._tween) {
            this._tween.kill()
            this._tween = null
        }
        gsap.killTweensOf(this.object?.position)
        gsap.killTweensOf(this.object?.rotation)
    }
}

export default PersonPatrolControl
