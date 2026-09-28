import { onMounted, onUnmounted } from 'vue'
import Time from './utils/Time'
import Sizes from './utils/Sizes'
import { Scene } from './utils/Scene'
import { Renderer } from './utils/renderer'
import { AddClick } from './utils/addclick.js'
import {Basic} from './light/basic'
import { Model } from './model/index.js'
import Resources from './utils/Resources.js'
export default class Three {
    constructor(threeRef, attribute = {}) {
        this.threeRef = threeRef;
        this.attribute = attribute;
        onMounted(() => {
            this.init();
        })
        onUnmounted(() => {
            this.dispose();
        })
    }
    init() {
        this.time = new Time()
        this.sizes = new Sizes(threeRef.value)
        this.scene = new Scene().init()
        this.renderer = new Renderer(threeRef, {
            sizes: this.sizes
        })
        this.resources = new Resources([
            // 加载模型
            // { name: '人物', source: `${import.meta.env.BASE_URL}gltf/Soldier.glb` },
            // { name: 'CNC5', source: `${import.meta.env.BASE_URL}models/newCnc5.glb` },
        ])
        this.setCamera();
        this.addClick();
        this.setModel();
        this.setPasses();
        this.light();
        this.initMap();
        this.sizes.on('resize', () => {
            const vp = this.sizes.viewport
            this.renderer.setSize(vp.width, vp.height)
            // 描边用独立的 RenderTarget，窗口变化时必须同步尺寸，否则描边错位/拉伸
            this.outline?.setSize(vp.width, vp.height)
            if (this.map && this.map.ready) this.map.resize()
        })
    }
    // 添加相机
    setCamera() {
        this.camera = new Camera({
            time: this.time,
            sizes: this.sizes,
            renderer: this.renderer,
            scene: this.scene,
            attribute: this.attribute
        })
        this.scene.add(this.camera.container)
    }
    // 射线碰撞
    addClick(){
        this.addclick = new AddClick(this.camera, this.scene, this.threeRef, this.attribute)
    }
    // 加载模型
    setModel(){
        this.model = new Model({
            time: this.time,
            resources: this.resources,
            sizes: this.sizes,
            camera: this.camera,
            scene: this.scene,
            renderer: this.renderer,
            addclick: this.addclick,
            attribute: this.attribute
        })
    }
    // 后期处理
    setPasses(){
        this.passes = {}
        this.passes.composer = new EffectComposer(this.renderer)
        this.passes.renderPass = new RenderPass(this.scene, this.camera.instance)

        this.passes.composer.addPass(this.passes.renderPass)
        // 外发光描边（CNC 设备选中高亮）
        this.createOutlinePass()
        this.time.on('tick', () =>{
            // 第一人称：store.getPerson === '1' 时切换到绑在人物上的 fpCamera
            const store = useDemoStore()
            const fp = this.model && this.model.person && this.model.person.fpCamera
            const useFirst = store.getPerson === '1' && !!fp
            // 第一人称相机宽高比跟随主相机（主相机已处理 resize）
            if (fp) {
                fp.aspect = this.camera.instance.aspect
                fp.updateProjectionMatrix()
            }
            const renderCamera = useFirst ? fp : this.camera.instance
            this.passes.renderPass.camera = renderCamera
            // 描边用与主渲染同一个相机（第一人称切到 fpCamera 时要跟着切）
            this.outline?.syncCamera(renderCamera)
            if (this.camera.orbitControls) this.camera.orbitControls.enabled = !useFirst

            // 地图模式：先刷新 three 矩阵 → 把相机姿态镜像给 Cesium → 先渲染真实底图，再叠加 three
            if (this.map) {
                if (this.map.ready) {
                    this.scene.updateMatrixWorld()
                    if (this.camera.orbitControls) this.camera.orbitControls.update()
                    if (renderCamera) renderCamera.updateMatrixWorld(true)
                    this.map.syncFromThreeCamera(renderCamera)
                    this.map.render()
                } else if (this.camera.instance) {
                    this.camera.instance.updateMatrixWorld()
                }
            }
            this.passes.composer.render()
        })
    }
    // 光
    light(){
        new Basic({
            scene: this.scene
        })
    }
    
    /**
     * 初始化地图底图（异步加载 Cesium，资源较重）
     * 传入 attribute.cesiumRef 时启用：真实地球影像作为背景，three 透明叠加其上
     */
    async initMap(){
        const { cesiumRef } = this.attribute || {}
        if (!cesiumRef || !cesiumRef.value) return
        try {
            const { CesiumMap } = await import('./map/CesiumMap.js')
            this.map = new CesiumMap(cesiumRef.value)
            await this.map.init()
            this.initShadowCatcher();
        } catch (err) {
            console.error('[Map] 地图初始化失败，继续以三维模式运行', err)
        }
    }
    
    /**
     * 阴影承接面（shadow catcher）
     *
     * 为什么需要它：Cesium 地球是独立的 WebGL 画布，three 的阴影只能投在
     * three 自己的网格上，无法直接投影到底层 Cesium 影像。ShadowMaterial 除
     * 阴影外完全透明，只有阴影区域把真实地图压暗，视觉上等同于阴影落在地面。
     */
    initShadowCatcher() {
        // 覆盖整个场景（厂区 x -800~-360、小区 x -250~250、z -200~210）
        const geometry = new THREE.PlaneGeometry(2000, 1200)
        // opacity = 阴影浓度，觉得太深/太浅调这里（0.2~0.4 较自然）
        const material = new THREE.ShadowMaterial({ opacity: 0.3 })
        // 透明平面不写深度，避免挡住它后面的物体
        material.depthWrite = false
        const plane = new THREE.Mesh(geometry, material)
        plane.rotation.x = -Math.PI / 2
        // 抬高 0.05 并对齐场景中心，避免和 y=0 的碎石地面产生 z-fighting
        plane.position.set(-270, 0.05, 5)
        plane.receiveShadow = true
        plane.name = '阴影承接面'
        this.scene.add(plane)
    }
    // 销毁
    dispose() {
        // 0. 销毁地图（Cesium viewer：停内部循环、释放 GPU / WebGL）
        if (this.map) {
            this.map.dispose && this.map.dispose()
            this.map = null
        }
        // 1. 停主循环 rAF（最关键，止住每帧 composer.render 多份并发）
        if (this.time) this.time.stop()

        // 1.5 释放人物（销毁键盘控制器）
        if (this.model && this.model.person && this.model.person.dispose) {
            this.model.person.dispose()
        }

        // 1.6 释放厂房巡检箭头（箭头纹理 / tick 监听）
        if (this.model && this.model.gongchang && this.model.gongchang.dispose) {
            this.model.gongchang.dispose()
        }

        // 2. 解绑 canvas 点击事件（addclick.stop 内部 removeEventListener）
        if (this.addclick) this.addclick.stop()

        // 2.5 释放描边（先摘掉替身网格，再释放 pass / 材质）
        if (this.outline) {
            this.outline.dispose()
            this.outline = null
            if (this.passes) this.passes.outlinePass = null
        }

        // 3. 释放后处理（EffectComposer）
        if (this.passes && this.passes.composer) {
            this.passes.composer.dispose && this.passes.composer.dispose()
        }

        // 4. 释放场景内所有 geometry / material / texture（含楼名 Sprite 的 CanvasTexture）
        if (this.scene) {
            this.scene.traverse((obj) => {
                if (obj.isMesh || obj.isSprite) {
                    if (obj.geometry) obj.geometry.dispose && obj.geometry.dispose()
                    const mat = obj.material
                    if (Array.isArray(mat)) {
                        mat.forEach((m) => {
                            if (m.map) m.map.dispose && m.map.dispose()
                            m.dispose && m.dispose()
                        })
                    } else if (mat) {
                        if (mat.map) mat.map.dispose && mat.map.dispose()
                        mat.dispose && mat.dispose()
                    }
                }
            })
        }
        // 4.5 释放共用楼宇贴图缓存（同尺寸楼共用 Texture，这里统一清掉）
        disposeFacadeTextures()

        // 5. 释放 WebGL context（防 context 累积，浏览器上限约 16 个）
        if (this.renderer) {
            this.renderer.dispose()
            this.renderer.forceContextLoss()
        }

        // 6. 解绑 window resize
        if (this.sizes && this.sizes.resize) {
            window.removeEventListener('resize', this.sizes.resize)
        }
    }
}