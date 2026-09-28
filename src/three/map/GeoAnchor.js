import * as THREE from 'three'
import * as Cesium from 'cesium'

/**
 * GeoAnchor —— 地理锚点 / three ⇄ 地球坐标变换工具
 *
 * three 局部坐标系约定（保证右手系，Y 向上）：
 *   X = 东(east)   Y = 上(up)   Z = 南(-north)
 * Cesium ENU 局部系：
 *   X = 东(east)   Y = 北(north)   Z = 上(up)
 *
 * three -> ENU 换算：e = X 、 n = -Z 、 u = Y（距离再乘 scale）
 * ENU -> three 换算：X = e 、 Z = -n 、 Y = u
 *
 * 通过 Cesium.Transforms.eastNorthUpToFixedFrame(锚点) 在 ECEF 与 ENU 之间互转。
 */

const _enu = new Cesium.Cartesian3()
const _ecefOut = new Cesium.Cartesian3()
const _v3Out = new THREE.Vector3()

export class GeoAnchor {
  constructor({ lng, lat, height = 0, scale = 1, heading = 0 } = {}) {
    this.lng = lng
    this.lat = lat
    this.height = height
    this.scale = scale
    // 朝向偏移（度）：让 three 世界绕锚点 up 轴旋转，用于模型朝向与底图对齐
    this.heading = heading

    this.centerEcef = new Cesium.Cartesian3()
    this.enuToFixed = new Cesium.Matrix4() // ENU(米) -> ECEF
    this.fixedToEnu = new Cesium.Matrix4() // ECEF -> ENU(米)
    this.rot = new Cesium.Matrix3() // ENU 旋转部分 -> ECEF
    this.rotInv = new Cesium.Matrix3() // 旋转逆矩阵（正交转置）

    this.rebuild()
  }

  /** 构建/重建锚点矩阵（地形高度就绪后调用 setHeight 重建一次即可） */
  rebuild() {
    Cesium.Cartesian3.fromDegrees(this.lng, this.lat, this.height, Cesium.Ellipsoid.WGS84, this.centerEcef)
    Cesium.Transforms.eastNorthUpToFixedFrame(this.centerEcef, Cesium.Ellipsoid.WGS84, this.enuToFixed)

    // 朝向偏移：绕 ENU 的 up(z) 轴旋转 heading 度。
    // 因 three 的 (X, Z) 正好对应 ENU 的 (east, north)，three 绕 Y 旋转等价于 ENU 绕 z 旋转，
    // 直接把旋转乘进 enuToFixed，正反变换（three<->ECEF）会自动带上该偏移。
    if (this.heading) {
      const rotZ = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(this.heading))
      )
      Cesium.Matrix4.multiply(this.enuToFixed, rotZ, this.enuToFixed)
    }

    Cesium.Matrix4.inverse(this.enuToFixed, this.fixedToEnu)
    Cesium.Matrix4.getMatrix3(this.enuToFixed, this.rot)
    Cesium.Matrix3.transpose(this.rot, this.rotInv)
  }

  /** 更新锚点海拔（地形采样完成后调用） */
  setHeight(height) {
    this.height = height
    this.rebuild()
  }

  // ------------------- three 局部点 -> ECEF -------------------

  threeToEcef(v3, out = _ecefOut) {
    _enu.x = v3.x * this.scale // east
    _enu.y = -v3.z * this.scale // north
    _enu.z = v3.y * this.scale // up
    return Cesium.Matrix4.multiplyByPoint(this.enuToFixed, _enu, out)
  }

  // ----------------- three 局部方向向量 -> ECEF ----------------

  threeDirToEcef(v3, out = _ecefOut) {
    _enu.x = v3.x
    _enu.y = -v3.z
    _enu.z = v3.y
    return Cesium.Matrix3.multiplyByVector(this.rot, _enu, out)
  }

  // ------------------- ECEF -> three 局部点 --------------------

  ecefToThree(p, out = _v3Out) {
    Cesium.Matrix4.multiplyByPoint(this.fixedToEnu, p, _enu)
    out.x = _enu.x / this.scale
    out.y = _enu.z / this.scale
    out.z = -_enu.y / this.scale
    return out
  }

  // ---------------- ECEF 方向向量 -> three 局部向量 -------------

  ecefDirToThree(p, out = _v3Out) {
    Cesium.Matrix3.multiplyByVector(this.rotInv, p, _enu)
    out.x = _enu.x
    out.y = _enu.z
    out.z = -_enu.y
    return out
  }
}
