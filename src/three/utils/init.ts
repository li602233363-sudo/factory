import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

/** 相机位置可接受三维坐标元组或 THREE.Vector3 */
export type Vector3Like = [x: number, y: number, z: number] | THREE.Vector3

export interface SceneOptions {
  /** 场景背景色，默认 #16171d */
  background?: THREE.ColorRepresentation
}

export interface CameraOptions {
  /** 视场角（角度），默认 75 */
  fov?: number
  /** 宽高比；不传时根据容器尺寸自动计算 */
  aspect?: number
  /** 近裁剪面，默认 0.1 */
  near?: number
  /** 远裁剪面，默认 1000 */
  far?: number
  /** 相机位置，默认 (0, 0, 3) */
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
  /** 是否开启阻尼（惯性），默认 true */
  enableDamping?: boolean
  /** 阻尼系数，默认 0.05 */
  dampingFactor?: number
  /** 最近距离，默认 0.1 */
  minDistance?: number
  /** 最远距离，默认 Infinity */
  maxDistance?: number
  /** 垂直旋转下限（弧度），默认 0 */
  minPolarAngle?: number
  /** 垂直旋转上限（弧度），默认 Math.PI / 2（即不转到地面以下） */
  maxPolarAngle?: number
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
  const { background = 0x16171d } = options
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(background)
  return scene
}

/**
 * 创建透视相机，尺寸默认从容器读取
 */
export function createCamera(
  container: HTMLElement,
  options: CameraOptions = {},
): THREE.PerspectiveCamera {
  const {
    fov = 75,
    aspect = container.clientWidth / container.clientHeight,
    near = 0.1,
    far = 1000,
    position = [0, 0, 3],
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
    enableDamping = true,
    dampingFactor = 0.05,
    minDistance = 0.1,
    maxDistance = Infinity,
    minPolarAngle = 0,
    maxPolarAngle = Math.PI / 2,
    autoRotate = false,
    autoRotateSpeed = 2,
  } = options

  const controls = new OrbitControls(camera, domElement)

  controls.target.copy(toVector3(target))
  controls.enableRotate = enableRotate
  controls.enablePan = enablePan
  controls.enableZoom = enableZoom
  controls.enableDamping = enableDamping
  controls.dampingFactor = dampingFactor
  controls.minDistance = minDistance
  controls.maxDistance = maxDistance
  controls.minPolarAngle = minPolarAngle
  controls.maxPolarAngle = maxPolarAngle
  controls.autoRotate = autoRotate
  controls.autoRotateSpeed = autoRotateSpeed

  // 立即同步一次，保证初始 target 生效
  controls.update()

  return controls
}
