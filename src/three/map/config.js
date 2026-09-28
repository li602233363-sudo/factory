/**
 * 地图模式全局配置
 *
 * 依赖的环境变量（在项目根目录 .env 中配置）：
 *  - VITE_TIANDITU_TK      天地图开发者密钥（必填，用于影像底图）
 *  - VITE_CESIUM_ION_TOKEN Cesium Ion token（可选，用于官方全球真实地形；不填则回退 ArcGIS Terrain3D 开放地形）
 *
 * 说明：lng/lat 为场景锚点中心经纬度（three 模型原点对应的地理位置），
 * height 为地形采样高度（自动从地形服务获取，无需手填）。
 */
export const mapConfig = {
  // 锚点（three 世界原点 0,0,0 对应的经纬度）
  center: {
    lng: 108.779200,
    lat: 34.263804,
    height: 0, // 自动从地形采样回填，无需手填
  },

  // 缩放：three 单位 -> 米（默认 1 单位 = 1 米）
  scale: 1,

  // 朝向偏移（度）：让底图相对 three 模型绕锚点旋转，用于模型朝向与地图对齐。
  // 正/负值方向相反，调到模型与底图贴合为止（如 90 / -90 / 180）。
  heading: 90,

  // 相机视野（与 three 相机保持一致）
  fov: 40,

  // 地形/影像密钥（从环境变量注入）
  tiandituTk: import.meta.env.VITE_TIANDITU_TK || '',
  ionToken: import.meta.env.VITE_CESIUM_ION_TOKEN || '',

  // 天地图瓦片最大层级
  tiandituMaxLevel: 18,

  // 是否叠加 Cesium Ion 全球 OSM 白模 3D 建筑（需 ionToken；中国大陆覆盖有限）
  osmBuildings: true,
}
