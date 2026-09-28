// Cesium 需要通过 window.CESIUM_BASE_URL 定位 Workers/Assets/Widgets 等运行时资源。
// 该文件必须最先被 import（放在 import cesium 之前），保证打包后资源路径正确。
if (typeof window !== 'undefined') {
  const base = (import.meta.env.BASE_URL || './').replace(/\/?$/, '/')
  window.CESIUM_BASE_URL = window.CESIUM_BASE_URL || `${base}cesium/`
}
