import * as THREE from 'three'
export class Scene {
    constructor() {

    }
    /**
     * 初始化场景。
     * 地图模式下不再使用天空盒：three 画布透明化，背景由底层 Cesium 地球影像提供，
     * 否则天空盒会把真实底图整个盖住。
     */
    init() {
        const scene = new THREE.Scene()
        scene.background = null

        return scene;
    }
}
