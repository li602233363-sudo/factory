import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import {watch} from 'vue'
import {Keyboard} from './keyboard.js'

export default class Camera
{
    /**
     * 构造函数 - 初始化相机系统
     * @param {Object} _options - 配置对象，包含 time、sizes、renderer、debug、config
     */
    constructor(_options){
        // 配置参数
        this.time = _options.time
        this.sizes = _options.sizes
        this.renderer = _options.renderer
        this.scene = _options.scene
        this.manyou = _options.attribute?.manyou
        // manyou 切换：同时开关「鼠标漫游(OrbitControls)」与「键盘控制」
        if (this.manyou) {
            watch(this.manyou, (newVal)=>{
                console.log('开始漫游')
                if(this.keyboard){
                    if(newVal) this.keyboard.enable()
                    else this.keyboard.disable()
                }
            })
        }

        // 初始化
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.targetEased = new THREE.Vector3(0, 0, 0)
        this.target = new THREE.Vector3(0, 0, 0) // 注视目标点（orbit 关闭时由 tick 看向它）
        this.easing = 0.15

        this.setAngle()
        this.setInstance()
        this.setOrbitControls()
        // 把 orbitControls 作为依赖注入键盘控制：键盘平移时由键盘适配层
        // 同步 orbitControls.target，鼠标漫游接管后相机不会被拉回初始位置（方案 A）
        this.keyboard = new Keyboard(this.instance, this.orbitControls, {
            moveSpeed: 30,
            rotateSpeed: Math.PI / 2,
        })
    }

    /**
     * 设置相机角度 - 管理相机的观察角度配置
     * 预定义多个视角，支持通过 gsap 平滑切换
     */
    setAngle() {
        // 初始化相机角度配置
        this.angle = {}

        // 预定义相机角度
        this.angle.items = {
            // default: new THREE.Vector3(1.135, - 1.45, 1.15),
            default: new THREE.Vector3(0, 200, 200),
            // projects: new THREE.Vector3(0.38, - 1.4, 1.63)
        }

        // 当前角度值
        this.angle.value = new THREE.Vector3()
        this.angle.value.copy(this.angle.items.default)

        // 切换相机角度方法
        this.angle.set = (_name) =>
        {
            const angle = this.angle.items[_name]
            if(typeof angle !== 'undefined')
            {
                gsap.to(this.angle.value, { ...angle, duration: 2, ease: 'power1.inOut' })
            }
        }
    }

    /**
     * 创建相机实例 - 初始化透视相机并设置更新逻辑
     * 创建 PerspectiveCamera，注册窗口 resize 监听和时间轴 tick 更新
     */
    setInstance(){
        // 初始化透视相机
        this.instance = new THREE.PerspectiveCamera(40, this.sizes.viewport.width / this.sizes.viewport.height, 1, 10000)
        // this.instance.up.set(0, 0, 1)
        this.instance.position.copy(this.angle.value)
        this.instance.lookAt(new THREE.Vector3())
        this.container.add(this.instance)

        // 监听窗口大小变化，更新相机宽高比
        this.sizes.on('resize', () =>
        {
            this.instance.aspect = this.sizes.viewport.width / this.sizes.viewport.height
            this.instance.updateProjectionMatrix()
        })

        // 时间更新事件
        this.time.on('tick', () => {
            
        })
    }

    /**
     * 设置轨道控制器 - 初始化 OrbitControls
     * 默认禁用，通过 orbitControls.enabled 切换启用/禁用状态
     */
    setOrbitControls(){
        // 初始化轨道控制器
        this.orbitControls = new OrbitControls(this.instance, this.renderer.domElement);
        // 注：本版本 OrbitControls 已废弃 enableKeys 属性，且默认不监听键盘
        // （需显式 listenToKeyEvents 才会开启），方向键不会与之冲突。
        this.orbitControls.zoomSpeed = 0.5
        // 极角安全边距 ≈ 2.9°（0.05 rad）
        // 极角(polar) = 相机位置向量与 +Y 轴的夹角。
        // 取 0 时相机停在目标正上方，视线方向与相机 up 向量平行，
        // 方位角(azimuth)失去参考 → 万向锁：画面抖动、方位突然翻转。
        // 取 π 时同理（相机在目标正下方）。所以要把极角夹在 (0, π) 开区间内。
        const POLAR_EPS = 0.05
        // 极角最小值：禁止垂直俯视（接近垂直，但不与 +Y 轴重合）
        this.orbitControls.minPolarAngle = POLAR_EPS
        // 极角最大值：略高于地平线，避免相机与地面共面、穿到地下
        this.orbitControls.maxPolarAngle = Math.PI / 2.1;
        this.orbitControls.maxDistance = 1000   // 最远：拉远不能超过 100
        this.orbitControls.minDistance = 5     // 最近：拉近不能小于 5
        // 调试面板
        if(this.debug){
            this.debugFolder.add(this.orbitControls, 'enabled').name('orbitControlsEnabled')
        }
    }
}
