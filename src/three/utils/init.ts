import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

/** 相机位置可接受三维坐标元组或 THREE.Vector3 */
export type Vector3Like = [x: number, y: number, z: number] | THREE.Vector3

export interface SceneOptions {
  /** 场景背景色，默认 #16171d */
  background?: THREE.ColorRepresentation
}

export interface CameraOptions {
  /** 视场角（角度），默认 45 */
  fov?: number
  /** 宽高比；不传时根据容器尺寸自动计算 */
  aspect?: number
  /** 近裁剪面，默认 1（与相机控件最近距离配合，避免贴到地面或模型内部） */
  near?: number
  /** 远裁剪面，默认 20000（必须大于相机控件的最远距离，否则滚轮拉远后厂区会被裁掉） */
  far?: number
  /** 相机位置，默认 (0, 320, 440)：厂区尺度（约 520 × 410）下从斜上方俯视 */
  position?: Vector3Like
}

export interface RendererOptions {
  /** 是否开启抗锯齿，默认 true */
  antialias?: boolean
  /** 设备像素比，默认 window.devicePixelRatio */
  pixelRatio?: number
  /** 画布宽度；不传时取容器 clientWidth */
  width?: number
  /** 画布高度；不传时取容器 clientHeight */
  height?: number
  /** 是否自动将 canvas 挂载到容器，默认 true */
  appendToContainer?: boolean
}

export interface OrbitControlsOptions {
  /** 环绕观察的目标点，默认 (0, 0, 0) */
  target?: Vector3Like
  /** 是否允许旋转（左键拖拽），默认 true */
  enableRotate?: boolean
  /** 是否允许平移（右键拖拽），默认 true */
  enablePan?: boolean
  /** 是否允许缩放（滚轮 / 双指），默认 true */
  enableZoom?: boolean
  /**
   * 滚轮 / 双指缩放速度，默认 1
   * 滚轮每格的缩放量正比于鼠标上报的 deltaY：若某个鼠标/触控板每格 deltaY 很小
   * （表现为“滚轮几乎没反应”），把这里调大即可，例如 3 ~ 5
   */
  zoomSpeed?: number
  /** 是否以鼠标指针位置为中心缩放，默认 false（以 target 为中心） */
  zoomToCursor?: boolean
  /** 旋转速度，默认 1 */
  rotateSpeed?: number
  /** 平移速度，默认 1 */
  panSpeed?: number
  /** 平移时是否沿屏幕平面移动，默认 false（沿地面方向平移，适合厂区这类水平场景） */
  screenSpacePanning?: boolean
  /** 是否开启阻尼（惯性），默认 true */
  enableDamping?: boolean
  /** 阻尼系数，默认 0.05 */
  dampingFactor?: number
  /** 最近距离，默认 1（要大于相机近裁剪面，否则会穿模） */
  minDistance?: number
  /** 最远距离，默认 8000（要小于相机远裁剪面，否则拉远后厂区会被裁掉） */
  maxDistance?: number
  /** 垂直旋转下限（弧度），默认 0 */
  minPolarAngle?: number
  /** 垂直旋转上限（弧度），默认 Math.PI / 2（即不转到地面以下） */
  maxPolarAngle?: number
  /**
   * 相机高度下限（世界坐标 y），默认 0，即相机 y 轴不允许为负（不钻到地面以下）
   * 说明：maxPolarAngle 只限制“相机相对 target 的垂直角度”，
   * 但平移（screenSpacePanning）、以指针为中心缩放（zoomToCursor）、
   * 外部直接改 target / camera.position 等路径都能绕过它；
   * 这里会在每次 update 之后硬性夹一次高度作为兜底，
   * 同时保证观察点（target）不会被拖到地平面（y = 0）以下
   * 若想留一点离地间隙（避免贴地时地面变成刀刃视角），可设为 10 ~ 50
   */
  minCameraY?: number
  /** 是否自动旋转，默认 false */
  autoRotate?: boolean
  /** 自动旋转速度，默认 2 */
  autoRotateSpeed?: number
}

/** 将 Vector3Like 归一化为 THREE.Vector3 */
export function toVector3(value: Vector3Like): THREE.Vector3 {
  return Array.isArray(value) ? new THREE.Vector3(...value) : value
}

/**
 * 创建场景
 */
export function createScene(options: SceneOptions = {}): THREE.Scene {
  const { background = 0xffffff } = options
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(background)
  return scene
}

/**
 * 创建透视相机，尺寸默认从容器读取
 * 默认值按厂区尺度（约 520 × 410）设置：
 * 相机高于地面、与观察目标保持数百单位距离，滚轮缩放才有明显可见的变化
 * （若把相机放在地面上，地面是刀刃视角，滚轮只会改变半径，画面几乎不会变化）
 */
export function createCamera(
  container: HTMLElement,
  options: CameraOptions = {},
): THREE.PerspectiveCamera {
  const {
    fov = 45,
    aspect = container.clientWidth / container.clientHeight,
    near = 1,
    far = 20000,
    position = [0, 320, 440],
  } = options

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
  camera.position.copy(toVector3(position))
  return camera
}

/**
 * 创建 WebGL 渲染器，尺寸默认从容器读取，默认自动挂载 canvas
 */
export function createRenderer(
  container: HTMLElement,
  options: RendererOptions = {},
): THREE.WebGLRenderer {
  const {
    antialias = true,
    pixelRatio = window.devicePixelRatio,
    width = container.clientWidth,
    height = container.clientHeight,
    appendToContainer = true,
  } = options

  const renderer = new THREE.WebGLRenderer({ antialias })
  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(width, height)

  if (appendToContainer) {
    container.appendChild(renderer.domElement)
  }

  return renderer
}

/**
 * 创建轨道控制器（OrbitControls）
 * 左键拖拽旋转、右键拖拽平移、滚轮缩放，始终围绕 target 点观察
 * 滚轮缩放相关配置：enableZoom、zoomSpeed、zoomToCursor、minDistance、maxDistance
 * 垂直旋转范围：minPolarAngle、maxPolarAngle（默认 0 ~ Math.PI / 2，即不转到地面以下）
 * 离地高度下限：minCameraY（默认 0，任何交互都不会让相机 y 为负）
 * 注意：开启阻尼或自动旋转后，需要在渲染循环中调用 controls.update()
 */
export function createOrbitControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
  options: OrbitControlsOptions = {},
): OrbitControls {
  const {
    target = [0, 0, 0],
    enableRotate = true,
    enablePan = true,
    enableZoom = true,
    zoomSpeed = 1,
    zoomToCursor = false,
    rotateSpeed = 1,
    panSpeed = 1,
    screenSpacePanning = false,
    enableDamping = true,
    dampingFactor = 0.05,
    minDistance = 1,
    maxDistance = 8000,
    minPolarAngle = 0,
    maxPolarAngle = Math.PI / 2,
    minCameraY = 1,
    autoRotate = false,
    autoRotateSpeed = 2,
  } = options

  const controls = new OrbitControls(camera, domElement)

  controls.target.copy(toVector3(target))
  controls.enableRotate = enableRotate
  controls.enablePan = enablePan
  controls.enableZoom = enableZoom
  controls.zoomSpeed = zoomSpeed
  controls.zoomToCursor = zoomToCursor
  controls.rotateSpeed = rotateSpeed
  controls.panSpeed = panSpeed
  controls.screenSpacePanning = screenSpacePanning
  controls.enableDamping = enableDamping
  controls.dampingFactor = dampingFactor
  controls.minDistance = minDistance
  controls.maxDistance = maxDistance
  controls.minPolarAngle = minPolarAngle
  controls.maxPolarAngle = maxPolarAngle
  controls.autoRotate = autoRotate
  controls.autoRotateSpeed = autoRotateSpeed

  /**
   * 相机高度兜底（见 minCameraY）
   * OrbitControls 只在 update() 里夹垂直角度（相对 target 的 polar 角），
   * 不含“离地高度”这一约束：平移（screenSpacePanning）、以指针为中心缩放（zoomToCursor）、
   * 外部直接改 target / camera.position 都能让相机跑到地平面以下
   * 所以把 update 包一层，控制器每次求值后立即把高度夹回来
   * （不能只挂 change 事件：位移小于 OrbitControls 内部 EPS 时不会派发 change，
   *   阻尼收敛阶段会残留 1e-3 量级的负高度）
   */
  const clampCameraY = () => {
    // 观察点被拖到地平面（y = 0）以下时，整个观察系统一起抬回地面，观察方向保持不变
    if (controls.target.y < 0) {
      const lift = -controls.target.y
      controls.target.y += lift
      camera.position.y += lift
    }

    // 相机低于高度下限时，贴回下限高度并重新对准观察点
    if (camera.position.y < minCameraY) {
      camera.position.y = minCameraY
      camera.lookAt(controls.target)
    }
  }

  const updateControls = controls.update.bind(controls)
  controls.update = (deltaTime?: number | null) => {
    const moved = updateControls(deltaTime ?? null)
    clampCameraY()
    return moved
  }

  // 立即同步一次，保证初始 target 生效（并夹住外部传入的负高度）
  controls.update()

  return controls
}
