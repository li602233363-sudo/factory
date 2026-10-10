import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  createCamera,
  createOrbitControls,
  createRenderer,
  createScene,
  type OrbitControlsOptions,
} from '../utils/init'
import { createAmbientLight, createDirectionalLight } from '../utils/light'
import {
  loadGLTFModels,
  type LoadProgress,
  type ModelLoadResult,
} from '../model/index'

export interface ThreeBaseOptions {
  /** 加载进度回调 */
  onProgress?: (progress: LoadProgress) => void
  /** 相机控件（OrbitControls）配置 */
  controls?: OrbitControlsOptions
}

/**
 * Three.js 基础场景封装
 * 负责组合初始化工具、灯光工具、模型加载、渲染循环以及资源销毁
 */
export default class ThreeBase {
  /** 挂载容器 */
  container: HTMLElement

  /** 加载完成的模型，用于资源销毁 */
  modelResults: ModelLoadResult[] = []

  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  renderer!: THREE.WebGLRenderer

  /** 相机控件：轨道控制（左键旋转 / 右键平移 / 滚轮缩放） */
  controls!: OrbitControls

  /** 渲染帧 id */
  animationId = 0
  constructor(container: HTMLElement, options: ThreeBaseOptions = {}) {
    this.container = container
    this.onProgress = options.onProgress
    this.controlsOptions = options.controls
  }

  /** 加载进度回调（由外部注入） */
  private onProgress?: ThreeBaseOptions['onProgress']

  /** 相机控件配置（由外部注入） */
  private controlsOptions?: ThreeBaseOptions['controls']

  async init() {
    // 场景、相机、渲染器（通用初始化逻辑已抽离到 utils/init）
    this.scene = createScene()
    this.camera = createCamera(this.container)
    this.renderer = createRenderer(this.container)

    // 相机控件（创建逻辑抽离到 utils/init）
    this.controls = createOrbitControls(
      this.camera,
      this.renderer.domElement,
      this.controlsOptions,
    )

    // 灯光（创建逻辑抽离到 utils/light，是否入场景由调用方决定）
    this.scene.add(createAmbientLight())
    this.scene.add(createDirectionalLight())

    // 网格地面参考
    // const grid = new THREE.GridHelper(20, 20, 0x444444, 0x2a2a2a)
    // this.scene.add(grid)

    // 初始加载指定模型（模型清单由 model 模块内部的 modelList 提供）
    const results = await loadGLTFModels(this.onProgress)
    this.modelResults = results
    // results.forEach((result, index) => {
    //   const model = result.gltf.scene
    //   // 两个模型沿 x 轴并排摆放，间距 3
    //   model.position.x = (index - (results.length - 1) / 2) * 3
    //   this.scene.add(model)
    // })

    window.addEventListener('resize', this.handleResize)
    this.animate()
  }
  // 后期处理
  setPasses = () =>{
    
  }
  handleResize = () => {
    const { clientWidth, clientHeight } = this.container
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight)
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate)
    // 阻尼与自动旋转需要逐帧更新
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.handleResize)

    // 移除相机控件绑定的 DOM 事件监听
    this.controls.dispose()

    // 释放模型占用的几何体、材质与纹理
    this.modelResults.forEach(({ gltf }) => {
      gltf.scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        const mesh = object as THREE.Mesh
        mesh.geometry?.dispose()

        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        materials.forEach(material => {
          Object.values(material).forEach(value => {
            if (value && typeof value === 'object' && 'isTexture' in value) {
              ;(value as THREE.Texture).dispose()
            }
          })
          material.dispose()
        })
      })
    })

    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}