import * as THREE from 'three'
export class Basic {
    constructor(_options){
        this.scene = _options.scene
        this.init()
    }
    init(){
        this._ambientLight()
        this._directionalLight()
    }
    // 环境光
    _ambientLight(){
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    }
    // 平行光
    _directionalLight(){
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
        // 开启阴影
        directionalLight.castShadow = true

        // 平行光的照射方向由 position → target 决定，lookAt() 对它无效，
        // 而且 target 必须加入场景，否则方向会一直指向世界原点 (0,0,0)。
        // 这里让光轴对准整个场景的中心（厂区 + 小区），方向与最初保持一致。
        directionalLight.position.set(-75, 260, 225)
        directionalLight.target.position.set(-275, 0, 5)
        this.scene.add(directionalLight.target)

        // 阴影相机范围：要覆盖整个场景
        // 厂区 x -800~-360、小区 x -250~250、z -200~210，斜投影后取 ±600 足够
        directionalLight.shadow.camera.left = -600
        directionalLight.shadow.camera.right = 600
        directionalLight.shadow.camera.top = 600
        directionalLight.shadow.camera.bottom = -600
        directionalLight.shadow.camera.near = 0.1
        directionalLight.shadow.camera.far = 1500

        // 关键：更新阴影相机投影矩阵
        directionalLight.shadow.camera.updateProjectionMatrix()

        // 范围放大后提高贴图分辨率，避免阴影边缘太粗糙
        directionalLight.shadow.mapSize.width = 4096
        directionalLight.shadow.mapSize.height = 4096

        this.scene.add(directionalLight)
    }
}