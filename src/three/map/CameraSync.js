import * as Cesium from 'cesium'

/**
 * CameraSync —— three 相机 -> Cesium 相机 位姿镜像
 *
 * three 相机为操作主相机（OrbitControls / 第一人称键盘漫游），
 * Cesium 相机每帧被镜像为一致位姿，使底图与 three 模型严格贴合。
 *
 * 步骤：
 *  1. three 相机世界位置/视线方向经 GeoAnchor 换算到 ECEF；
 *  2. 在相机 ECEF 位置构建 ENU 参考系（Cesium heading 定义的基准），
 *     解出 heading/pitch（roll 恒 0 —— orbit/第一人称均无滚转）。
 */

const _v3 = { x: 0, y: 0, z: 0 }
const _dirE = new Cesium.Cartesian3()
const _posE = new Cesium.Cartesian3()
const _localFrame = new Cesium.Matrix4()
const _localInv = new Cesium.Matrix4()
const _dirLocal = new Cesium.Cartesian3()

/**
 * 将 three 相机的当前位姿完整镜像到 Cesium 相机
 * @param {Cesium.Camera} cesiumCamera
 * @param {THREE.Camera} threeCamera  需保证其 matrixWorld 已更新
 * @param {GeoAnchor} anchor
 */
export function syncCesiumFromThree(cesiumCamera, threeCamera, anchor) {
  const m = threeCamera.matrixWorld.elements

  // 位置：matrixWorld 平移部分 -> ECEF
  _v3.x = m[12]
  _v3.y = m[13]
  _v3.z = m[14]
  anchor.threeToEcef(_v3, _posE)

  // 视线方向：three 相机看向本地 -Z，世界前向 = -matrixWorld 第三列 -> ECEF
  _v3.x = -m[8]
  _v3.y = -m[9]
  _v3.z = -m[10]
  anchor.threeDirToEcef(_v3, _dirE)

  // 在相机所在位置构建 ENU 参考系（严格按 Cesium heading 定义基准）
  Cesium.Transforms.eastNorthUpToFixedFrame(_posE, Cesium.Ellipsoid.WGS84, _localFrame)
  Cesium.Matrix4.inverse(_localFrame, _localInv)
  Cesium.Matrix4.multiplyByPointAsVector(_localInv, _dirE, _dirLocal)

  // heading：北为 0，向东为正（atan2(e, n)）；pitch：水平 0，向上正、向下负
  const heading = Math.atan2(_dirLocal.x, _dirLocal.y)
  const horizontal = Math.hypot(_dirLocal.x, _dirLocal.y)
  const pitch = Math.atan2(_dirLocal.z, horizontal)

  cesiumCamera.setView({
    destination: _posE,
    orientation: { heading, pitch, roll: 0 },
  })

  return cesiumCamera
}

/**
 * 提取 Cesium 相机的 ECEF 世界位置（供其它逻辑使用）
 */
export function cesiumCameraPosition(cesiumCamera, out = _posE) {
  return Cesium.Cartesian3.clone(cesiumCamera.positionWC, out)
}
