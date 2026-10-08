// 必须在 import cesium 之前先执行，设置资源访问路径
import './cesium-bootstrap.js'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { mapConfig } from './config'
import { GeoAnchor } from './GeoAnchor'
import { syncCesiumFromThree } from './CameraSync'

/**
 * CesiumMap —— 真实地球底图封装
 *
 * 职责：
 *  1. 创建 Cesium Viewer（关闭默认控件与默认 Ion 影像，避免无 token 报错/黑屏）；
 *  2. 叠加天地图矢量底图（vec_w + cva_w 注记，可选），未配置 key 时回退 ArcGIS 在线影像；
 *  3. 启用全球真实地形：优先 Cesium World Terrain（需要 Ion token），否则回退 ArcGIS Terrain3D；
 *  4. 采样「锚点（config.center）」的真实海拔，构建 GeoAnchor；
 *  5. 对外提供每帧 render() / 相机同步 / resize / dispose。
 */

const DEG2RAD = Math.PI / 180

/** 等待若干毫秒 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 给异步操作加超时，超时后 reject，用于防止网络请求无限挂起导致底图一直不渲染 */
function withTimeout(promise, ms) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ])
}

export class CesiumMap {
  constructor(container, overrides = {}) {
    this.container = container
    this.config = { ...mapConfig, ...overrides }
    this.viewer = null
    this.anchor = null
    this.ready = false
    this.disposed = false
  }

  async init() {
    const { center, scale } = this.config

    if (this.config.ionToken) {
      Cesium.Ion.defaultAccessToken = this.config.ionToken
    }

    const viewer = new Cesium.Viewer(this.container, {
      baseLayer: false, // 不使用默认 Ion 影像，底图由下方自定义
      animation: false,
      timeline: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shouldAnimate: false,
      useDefaultRenderLoop: false, // 由 three 的 rAF 统一驱动
    })
    this.viewer = viewer

    const scene = viewer.scene
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b2233')
    scene.globe.enableLighting = false
    scene.globe.depthTestAgainstTerrain = false
    scene.backgroundColor = Cesium.Color.fromCssColorString('#050a10')
    scene.skyAtmosphere.show = true

    // 关闭 Cesium 默认天体（太阳/月亮）：它们挂在天球上，会随相机移动并投影成
    // 画面中央/天空里的一个灰暗小圆点（即用户看到的"黑点"），地图底图场景无需显示。
    // scene.sun.show = false
    scene.moon.show = false

    // 先用海拔 0 构建锚点，让渲染循环能立刻接管底图；真实海拔采样完成后再 setHeight 重建
    this.anchor = new GeoAnchor({ lng: center.lng, lat: center.lat, height: 0, scale, heading: this.config.heading })

    // 默认视野：俯视锚点，等待 three 相机接管后每帧被镜像覆盖
    viewer.camera.frustum.fov = this.config.fov * DEG2RAD

    // 关键：立即标记 ready，避免影像/地形/OSM 任一网络请求挂起导致底图永远不渲染
    this.ready = true

    // 影像/地形/OSM/海拔采样放到后台逐步补齐，互不阻塞、且都带超时回退
    this._loadLayers(center)
  }

  /**
   * 后台加载影像、地形、OSM 建筑与锚点海拔。
   * 不再 await 到底，任何一层失败/超时都能独立回退，不影响底图渲染。
   */
  async _loadLayers(center) {
    await this.setupImagery()
    await this.setupTerrain()
    await this.setupOsmBuildings()

    if (this.disposed) return
    const groundHeight = await this.sampleGroundHeight(center.lng, center.lat)
    center.height = groundHeight
    if (this.anchor) this.anchor.setHeight(groundHeight)
    console.log(`[CesiumMap] layers ready @ ${center.lng.toFixed(6)}, ${center.lat.toFixed(6)}, 海拔 ${groundHeight.toFixed(1)}m`)
  }

  // ---------------- 天地图底图 ----------------

  /** 用一张 level0 全球瓦片探测天地图可用性（tk 无效 / 未加白名单 / 网络受限时失败） */
  detectTiandituTile(tk, timeoutMs = 8000) {
    const url =
      'https://t0.tianditu.gov.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0' +
      '&LAYER=vec&style=default&tileMatrixSet=w&format=tiles&TileMatrix=0&TileRow=0&TileCol=0' +
      `&tk=${tk}`
    return new Promise((resolve) => {
      const img = new Image()
      let done = false
      const finish = (ok) => {
        if (done) return
        done = true
        clearTimeout(timer)
        resolve(ok)
      }
      const timer = setTimeout(() => finish(false), timeoutMs)
      img.onload = () => finish(true)
      img.onerror = () => finish(false)
      img.src = url
    })
  }

  async setupImagery() {
    const tk = this.config.tiandituTk

    if (!tk) {
      console.warn(
        '[CesiumMap] 未配置 VITE_TIANDITU_TK（天地图密钥），' +
        '底图回退 ArcGIS 在线影像。在项目根目录 .env 中配置后重启 dev 即可使用天地图。'
      )
      await this.addArcGisImagery()
      return
    }

    const tianOk = await this.detectTiandituTile(tk)
    if (!tianOk) {
      console.warn(
        '[CesiumMap] 天地图瓦片拉取失败（tk 无效 / 未配置域名白名单 / 网络受限），' +
        '底图自动回退 ArcGIS 在线影像。请到天地图控制台把当前访问域名加入白名单后重启 dev。'
      )
      await this.addArcGisImagery()
      return
    }

    
    // 天地图影像 + 中文注记（任一图层失败不阻塞整体）
    // await this.addTiandituLayer('img_w', 'img', tk)
    // 天地图矢量底图 + 中文注记（任一图层失败不阻塞整体）
    await this.addTiandituLayer('vec_w', 'vec', tk)
    await this.addTiandituLayer('cva_w', 'cva', tk)
  }

  async addTiandituLayer(layerPath, layerName, tk) {
    try {
      const provider = await this.tiandituProvider(layerPath, layerName, tk)
      if (provider) {
        this.viewer.imageryLayers.add(new Cesium.ImageryLayer(provider))
      } else {
        console.warn(`[CesiumMap] 天地图 ${layerName} 图层不可用`)
      }
    } catch (err) {
      console.warn(`[CesiumMap] 天地图 ${layerName} 图层加载失败`, err)
    }
  }

  async addArcGisImagery() {
    try {
      const provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
        { enablePickFeatures: false }
      )
      this.viewer.imageryLayers.add(new Cesium.ImageryLayer(provider))
    } catch (err) {
      console.warn('[CesiumMap] ArcGIS 在线影像加载失败', err)
    }
  }

  /** 构建天地图 WMTS Provider（vec_w 矢量 / cva_w 注记） */
  tiandituProvider(layerPath, layerName, tk) {
    // KVP + 模板占位符混合：把 tk 与固定参数写在 url，
    // Cesium 用 WebMapTileServiceImageryProvider 填充 {TileMatrix}/{TileRow}/{TileCol}
    const url =
      `https://t{s}.tianditu.gov.cn/${layerPath}/wmts?` +
      `service=wmts&request=GetTile&version=1.0.0&LAYER=${layerName}` +
      `&style=default&tileMatrixSet=w&format=tiles` +
      `&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&tk=${tk}`

    return Promise.resolve(
      new Cesium.WebMapTileServiceImageryProvider({
        url,
        layer: layerName,
        style: 'default',
        format: 'tiles',
        tileMatrixSetID: 'w',
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        maximumLevel: this.config.tiandituMaxLevel,
        enablePickFeatures: false,
      })
    )
  }

  // ---------------- 地形 ----------------

  async setupTerrain() {
    try {
      let provider
      if (this.config.ionToken) {
        provider = await withTimeout(Cesium.createWorldTerrainAsync(), 10000)
      } else {
        console.warn(
          '[CesiumMap] 未配置 VITE_CESIUM_ION_TOKEN，地形暂回退 ArcGIS Terrain3D（开放服务）。' +
          '配置 token 后重启 dev 可切换为 Cesium World Terrain。'
        )
        provider = await withTimeout(
          Cesium.CesiumTerrainProvider.fromUrl(
            'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
          ),
          10000
        )
      }
      this.viewer.terrainProvider = provider
      this._terrainOk = true
    } catch (err) {
      this._terrainOk = false
      console.warn('[CesiumMap] 真实地形加载失败，降级为椭球面（模型按海拔 0 锚定）', err)
    }
  }

  // ---------------- OSM 3D 建筑 ----------------

  /**
   * 叠加 Cesium Ion 全球 OSM 白模 3D 建筑（3D Tiles），让"地图上的楼"也立起来。
   * 需要 VITE_CESIUM_ION_TOKEN；中国大陆 OSM 建筑覆盖有限，部分区域可能无数据。
   */
  async setupOsmBuildings() {
    if (!this.config.osmBuildings) return
    if (!this.config.ionToken) {
      console.warn('[CesiumMap] 未配置 VITE_CESIUM_ION_TOKEN，跳过 OSM 3D 建筑图层')
      return
    }
    try {
      const tileset = await withTimeout(Cesium.createOsmBuildingsAsync(), 10000)
      this._osmBuildings = this.viewer.scene.primitives.add(tileset)
      console.log('[CesiumMap] OSM 3D 建筑图层已加载')
    } catch (err) {
      this._osmBuildings = null
      console.warn('[CesiumMap] OSM 3D 建筑加载失败（网络受限 / token 无效）', err)
    }
  }

  /** 采样指定经纬度的真实海拔（供锚点贴地） */
  async sampleGroundHeight(lng, lat) {
    if (!this._terrainOk) return 0
    const tp = this.viewer.terrainProvider
    if (!tp) return 0

    const carto = Cesium.Cartographic.fromDegrees(lng, lat, 0)
    try {
      await Promise.race([
        Cesium.sampleTerrainMostDetailed(tp, [carto]),
        delay(8000),
      ])
      if (Number.isFinite(carto.height)) return carto.height
    } catch (e) {
      console.warn('[CesiumMap] 地形高度采样失败，使用 0 高度', e)
    }

    // 采样失败时退而求其次：轮询 globe.getHeight
    for (let i = 0; i < 20 && !this.disposed; i++) {
      const h = this.viewer.scene.globe.getHeight(carto)
      if (Number.isFinite(h)) return h
      await delay(500)
    }
    return 0
  }

  // ---------------- 每帧渲染 / 相机同步 ----------------

  /**
   * 把 three 相机姿态镜像到 Cesium 相机，供每帧渲染底图前调用
   */
  syncFromThreeCamera(threeCamera) {
    if (!this.ready || this.disposed || !threeCamera) return false

    const frustum = this.viewer.camera.frustum
    const aspect = Number.isFinite(threeCamera.aspect) ? threeCamera.aspect : 1
    // three fov 为「垂直」视场角；Cesium frustum.fov 在宽>=高时表示「水平」FOV，
    // 需按宽高比换算后再赋值，否则两层投影比例不一致，平移时会分层错位
    const vfov = (threeCamera.fov || this.config.fov) * DEG2RAD
    frustum.aspectRatio = aspect
    frustum.fov = aspect >= 1 ? 2 * Math.atan(Math.tan(vfov / 2) * aspect) : vfov

    syncCesiumFromThree(this.viewer.camera, threeCamera, this.anchor)
    return true
  }

  render() {
    if (!this.ready || this.disposed) return
    this.viewer.render()
  }

  resize() {
    if (this.viewer && !this.disposed) this.viewer.resize()
  }

  // ---------------- 销毁 ----------------

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.ready = false
    if (this.viewer) {
      try {
        this.viewer.destroy()
      } catch (e) {
        console.warn('[CesiumMap] destroy error', e)
      }
      this.viewer = null
    }
    this.anchor = null
  }
}
