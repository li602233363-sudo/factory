import {
  AmbientLight,
  Box3,
  BoxGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  Fog,
  GridHelper,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { EquipmentInfo } from './types'

/**
 * 负责 WebGL 场景生命周期：渲染器、相机、轨道控制、灯光、网格地面、
 * ResizeObserver 自适应，以及便于 UI 调用的拾取 / 聚焦能力。
 */
export class SceneManager {
  readonly canvas: HTMLCanvasElement
  readonly scene = new Scene()
  readonly camera: PerspectiveCamera
  readonly renderer: WebGLRenderer
  readonly controls: OrbitControls

  /** 地面网格，便于感知坐标与尺寸 */
  private readonly grid: GridHelper
  /** 当前被选中的高亮框 */
  private selection: LineSegments | null = null
  private frameId = 0
  private resizeObserver: ResizeObserver

  /** 主模型在场景中的根对象 */
  private root: THREE.Object3D | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.shadowMap.enabled = true

    this.camera = new PerspectiveCamera(50, 1, 0.1, 4000)

    this.scene.background = new Color(0x06090f)
    this.scene.fog = new Fog(0x06090f, 600, 2200)

    // 灯光：环境光 + 主平行光（带阴影）
    const ambient = new AmbientLight(0x8aa4c8, 1.1)
    this.scene.add(ambient)

    const dirLight = new DirectionalLight(0xffffff, 2.2)
    dirLight.position.set(300, 500, 200)
    dirLight.castShadow = true
    this.scene.add(dirLight)

    const fillLight = new DirectionalLight(0x2a6fdb, 0.6)
    fillLight.position.set(-400, 200, -300)
    this.scene.add(fillLight)

    // 地面参考网格（半透明）
    this.grid = new GridHelper(1200, 24, 0x1e3a5f, 0x12243d)
    this.grid.position.y = 0
    this.scene.add(this.grid)

    // 轨道控制
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.maxPolarAngle = Math.PI / 2.05
    this.controls.minDistance = 2
    this.controls.maxDistance = 2000

    // 尺寸自适应
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.resize()
  }

  /** 将模型根对象注入，用于自适应尺寸与聚焦 */
  setModelRoot(root: THREE.Object3D) {
    this.root = root
    this.scene.add(root)
    this.focusOn(root)
  }

  /** 加入 HUD 网格的同时，保持其为场景首层，便于点击穿透处理时可忽略 */
  getGrid(): GridHelper {
    return this.grid
  }

  /** 根据包围盒自动取景相机与轨道控制 */
  focusOn(boxTarget: THREE.Object3D) {
    const box = new Box3().setFromObject(boxTarget)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())

    const dist = Math.max(size.x, size.y, size.z) * 1.8
    this.camera.near = Math.max(0.1, dist / 500)
    this.camera.far = dist * 100
    this.camera.updateProjectionMatrix()

    const dir = new Vector3(1, 0.62, 1).normalize()
    this.camera.position.copy(center).add(dir.multiplyScalar(dist))
    this.controls.target.copy(center)
    this.controls.update()
  }

  /** 高亮某个对象（绘制线框包围盒），null 表示清除 */
  setSelection(target: THREE.Object3D | null): void {
    if (this.selection) {
      this.scene.remove(this.selection)
      this.selection.geometry.dispose()
      ;(this.selection.material as LineBasicMaterial).dispose()
      this.selection = null
    }
    if (!target) return

    const box = new Box3().setFromObject(target)
    if (box.isEmpty()) return
    const boxGeo = new BoxGeometry(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z,
    )
    boxGeo.translate(
      (box.max.x + box.min.x) / 2,
      (box.max.y + box.min.y) / 2,
      (box.max.z + box.min.z) / 2,
    )
    const helper = new EdgesGeometry(boxGeo)
    const mat = new LineBasicMaterial({ color: 0x00e6ff, linewidth: 1 })
    const line = new LineSegments(helper, mat)
    this.scene.add(line)
    this.selection = line
  }

  /** 外部聚焦到指定对象（用于设备列表点击联动） */
  focusObject(target: THREE.Object3D) {
    this.focusOn(target)
  }

  /** 根据屏幕坐标拾取，返回命中的可拾取对象；未命中返回 null */
  pick(ndcX: number, ndcY: number): THREE.Object3D | null {
    if (!this.root) return null
    // 使用 raycaster 从相机出发（遍历整场景，兼容多模型组）
    const raycaster = new Raycaster()
    raycaster.setFromCamera(new Vector2(ndcX, ndcY), this.camera)
    const hits = raycaster.intersectObjects(this.scene.children, true)
    for (const hit of hits) {
      // 忽略无名字 / 内部辅助对象；LineSegments 网格地面默认不参与拾取
      const name = hit.object.name
      if (!name || name.toLowerCase().includes('instance') || hit.object.userData.skipPick) {
        continue
      }
      // 向上回溯到第一个有命名的节点（即「可拾取设备」）
      let node: THREE.Object3D | null = hit.object
      while (node && !node.name) {
        node = node.parent
      }
      return node ?? hit.object
    }
    return null
  }

  /** 供 UI 计算设备信息（命中对象 -> EquipmentInfo） */
  static describe(feature: THREE.Object3D): EquipmentInfo {
    const name = feature.name || '设备'
    return {
      name,
      status: '运行',
      output: Math.round(380 + Math.random() * 120),
      temperature: Math.round(38 + Math.random() * 12),
      utilization: Math.round(82 + Math.random() * 15),
      alarms: Math.floor(Math.random() * 3),
    }
  }

  private resize() {
    const width = this.canvas.clientWidth || 1
    const height = this.canvas.clientHeight || 1
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  /** 启动渲染循环 */
  start(): void {
    const loop = () => {
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      this.frameId = requestAnimationFrame(loop)
    }
    this.frameId = requestAnimationFrame(loop)
  }

  /** 释放所有 GPU / 事件资源 */
  dispose(): void {
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    this.controls.dispose()
    this.setSelection(null)
    // 递归释放
    this.scene.traverse((obj) => {
      const mesh = (obj as THREE.Mesh).isMesh ? (obj as THREE.Mesh) : undefined
      if (mesh) {
        mesh.geometry.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => m.dispose())
      }
    })
    this.renderer.dispose()
  }
}