// 将 Cesium 的运行时静态资源（WebWorker / 纹理 / 控件 / 三方库）从
// node_modules 复制到 public/cesium，供 dev 与 build 原样伺服。
//
// 用递归 copyFileSync 实现（而非 fs.cpSync）：在此环境 fs.cpSync 复制
// Cesium 大目录会崩溃（退出码 127），copyFileSync 稳定且跨平台
// （cmd 与 sh 均可通过 `node` 运行）。
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const srcRoot = path.join(root, 'node_modules', 'cesium', 'Build', 'Cesium')
const outRoot = path.join(root, 'public', 'cesium')

if (!fs.existsSync(srcRoot)) {
  console.error('[copy-cesium] 未找到 Cesium 构建目录: ' + srcRoot)
  process.exit(1)
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDirSync(s, d)
    else fs.copyFileSync(s, d)
  }
}

try {
  for (const dir of ['Workers', 'Assets', 'Widgets', 'ThirdParty']) {
    copyDirSync(path.join(srcRoot, dir), path.join(outRoot, dir))
  }
  console.log('[copy-cesium] 静态资源已复制到 public/cesium')
} catch (err) {
  console.error('[copy-cesium] 复制失败:', err)
  process.exit(1)
}