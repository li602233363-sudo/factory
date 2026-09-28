import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'

// 场景坐标约定（见 map/GeoAnchor.js）：X=东、Y=上、Z=南，故「西」为 -X 方向
const WEST = new THREE.Vector3(-1, 0, 0)
const UP = new THREE.Vector3(0, 1, 0)

// 修改相机位置
export default class {
    constructor() {
    }
    computedMesh(point3d) {
        point3d.geometry.computeBoundingBox();
        point3d.geometry.computeBoundingSphere();
    }
    /**
     * 计算被点中物体「顶部中心」的世界坐标
     *  - InstancedMesh（如 CNC5_instanced）：用 intersection.instanceId 取该实例矩阵，
     *    把几何体本地包围盒的顶部中心先变换到实例空间、再变换到世界空间；
     *  - 普通 Mesh（如楼宇）：本地包围盒顶部中心直接乘 matrixWorld；
     *  - 取不到几何体时回退为射线命中点。
     */
    getTopCenter(point3d) {
        const mesh = point3d.object
        const box = mesh && mesh.geometry && mesh.geometry.boundingBox
        if (!box) {
            return point3d.point ? point3d.point.clone() : new THREE.Vector3()
        }
        // 几何体本地包围盒的顶部中心
        const top = new THREE.Vector3(
            (box.min.x + box.max.x) / 2,
            box.max.y,
            (box.min.z + box.max.z) / 2
        )
        if (mesh.isInstancedMesh && point3d.instanceId !== undefined) {
            // InstancedMesh：先从几何体空间变换到「被点中实例」的本地空间
            const instanceMatrix = new THREE.Matrix4()
            mesh.getMatrixAt(point3d.instanceId, instanceMatrix)
            top.applyMatrix4(instanceMatrix)
        }
        // 实例/物体本地空间 -> 世界空间
        mesh.updateWorldMatrix(true, false)
        top.applyMatrix4(mesh.matrixWorld)
        return top
    }

    /**
     * 相机飞到物体顶部「朝西 45°」方向、距物体 distance 个单位处，并注视物体顶部。
     * @param {Object} point3d 射线拾取结果（含 object / point；InstancedMesh 还含 instanceId）
     * @param {number} distance 相机与物体顶部的直线世界距离（默认 200）
     * @param {number} angleDeg 相机仰角（默认 45°：竖直抬高与水平向西偏移相等）
     */
    changeCamera(point3d, distance = 150, angleDeg = 30) {
        const child = point3d.object ? point3d.object : point3d
        this.computedMesh(child)

        // 物体顶部中心（世界坐标）：既是相机位置的参考点，也是相机注视目标
        const targetPos = this.getTopCenter(point3d)

        // 45° 仰角分解：竖直抬高 + 向西(-X)水平偏移，合成后直线距离 = distance
        const angle = THREE.MathUtils.degToRad(angleDeg)
        const lift = distance * Math.sin(angle)
        const westOffset = distance * Math.cos(angle)
        const cameraPos = targetPos.clone()
            .addScaledVector(UP, lift)
            .addScaledVector(WEST, westOffset)

        const controls = this.camera.orbitControls
        const time = 2000
        // 掐掉上一次飞行，避免来回点击时补间叠加
        this.tweenPosition?.stop()
        this.tweenTarget?.stop()
        // 相机位置飞到顶部的西上方
        // 注意：第二参数 true 不能省 —— @tweenjs/tween.js v25 里 start() 不会自动把
        // tween 加入主组，只有构造时传 true 才会加入 mainGroup，Time.js 里的 TWEEN.update() 才能驱动它
        this.tweenPosition = new TWEEN.Tween(controls.object.position, true)
            .easing(TWEEN.Easing.Cubic.InOut)
            .to({
                x: cameraPos.x,
                y: cameraPos.y,
                z: cameraPos.z,
            }, time)
            .onUpdate(() => {
                controls.update()
            })
            .start()
        // 轨道中心（注视点）同步飞到物体顶部：
        // 不补间 target 的话相机仍看向场景原点，物体会偏离画面中心、视角也不是 45°
        this.tweenTarget = new TWEEN.Tween(controls.target, true)
            .easing(TWEEN.Easing.Cubic.InOut)
            .to({
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
            }, time)
            .start()
    }
}
