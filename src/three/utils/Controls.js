/**
 * Controls —— 键盘「动作状态」收集器
 *
 * 定位（重要）：
 *  本类【只收集按键状态，不直接移动任何相机 / 物体】。它把按键翻译成六个语义化的
 *  布尔动作（up / right / down / left / brake / boost），由外部控制器（如车辆、人物）
 *  在自己的更新循环里读取 these.actions 自行驱动。这是典型的驾驶类游戏输入层写法，
 *  源自 Three.js Journey 课程模板。
 *
 * 按键映射（在 setKeyboard 中绑定）：
 *   W / ↑、A / ←、S / ↓、D / → ：up / left / down / right
 *   Ctrl 或 Space               ：brake（刹车）
 *   Shift                       ：boost（加速 / 氮气）
 *   R                           ：触发 'action' 事件，载荷 'reset'（重置载具）
 *
 * 失焦保护：监听 visibilitychange，页面从后台切回时清空全部动作，
 * 避免按键"卡住"导致载具持续移动。
 *
 * 当前状态（遗留模块）：
 *  构造函数中 setKeyboard() 调用被注释，故目前实例化后只建立动作状态、不绑定键盘监听，
 *  实际不产生控制效果。项目现行的键盘相机漫游见 utils/keyboard.js 的 KeyboardControls
 * （配合 Pinia keyboard store），与本文件互不相关；如后续不做载具玩法可移除本文件。
 */

import EventEmitter from '../Utils/EventEmitter'
export default class Controls extends EventEmitter {
    /**
     * @param {Object} _options 透传的上下文（config / sizes / time / camera / sounds），
     *        预留給后续读取动作状态的外部控制器使用
     */
    constructor(_options){
        super()
        this.config = _options.config
        this.sizes = _options.sizes
        this.time = _options.time
        this.camera = _options.camera
        this.sounds = _options.sounds
        this.setActions()
        // this.setKeyboard() // 当前未启用：不绑定键盘监听，本实例仅持有初始动作状态
    }
    /**
     * 初始化六个动作状态，并注册页面可见性变化监听（切回前台时清空全部动作）
     */
    setActions() {
        this.actions = {}
        this.actions.up = false
        this.actions.right = false
        this.actions.down = false
        this.actions.left = false
        this.actions.brake = false
        this.actions.boost = false

        document.addEventListener('visibilitychange', () =>
        {
            if(!document.hidden)
            {
                this.actions.up = false
                this.actions.right = false
                this.actions.down = false
                this.actions.left = false
                this.actions.brake = false
                this.actions.boost = false
            }
        })
    }
    /**
     * 绑定键盘按下 / 抬起监听，把物理按键映射为动作状态。
     * 同时缓存解绑函数（_destroyKeydown / _destroyKeyup），供外部销毁时调用，
     * 防止监听器泄漏。
     * 注意：当前该方法未在构造函数中调用，需要启用时把构造函数里的注释打开。
     */
    setKeyboard(){
        this.keyboard = {}
        this.keyboard.events = {}

        // 按下：置对应动作为 true
        this.keyboard.events.keyDown = (_event) => {
            switch(_event.code)
            {
                case 'ArrowUp':
                case 'KeyW':
                    this.actions.up = true
                    break

                case 'ArrowRight':
                case 'KeyD':
                    this.actions.right = true
                    break

                case 'ArrowDown':
                case 'KeyS':
                    this.actions.down = true
                    break

                case 'ArrowLeft':
                case 'KeyA':
                    this.actions.left = true
                    break

                case 'ControlLeft':
                case 'ControlRight':
                case 'Space':
                    this.actions.brake = true
                    break

                case 'ShiftLeft':
                case 'ShiftRight':
                    this.actions.boost = true
                    break

                // case ' ':
                //     this.jump(true)
                //     break
            }
        }

        // 抬起：置对应动作为 false；R 键额外派发 reset 动作事件
        this.keyboard.events.keyUp = (_event) => {
            switch(_event.code)
            {
                case 'ArrowUp':
                case 'KeyW':
                    this.actions.up = false
                    break

                case 'ArrowRight':
                case 'KeyD':
                    this.actions.right = false
                    break

                case 'ArrowDown':
                case 'KeyS':
                    this.actions.down = false
                    break

                case 'ArrowLeft':
                case 'KeyA':
                    this.actions.left = false
                    break

                case 'ControlLeft':
                case 'ControlRight':
                case 'Space':
                    this.actions.brake = false
                    break

                case 'ShiftLeft':
                case 'ShiftRight':
                    this.actions.boost = false
                    break

                case 'KeyR':
                    this.trigger('action', ['reset'])
                    break
            }
        }

        document.addEventListener('keydown', this.keyboard.events.keyDown)
        document.addEventListener('keyup', this.keyboard.events.keyUp)
        this._destroyKeydown = () => document.removeEventListener('keydown', this.keyboard.events.keyDown)
        this._destroyKeyup = () => document.removeEventListener('keyup', this.keyboard.events.keyUp)
    }
}