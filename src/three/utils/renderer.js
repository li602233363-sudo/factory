import * as THREE from 'three'
export class Renderer {
    constructor(threeRef, attribute = {}) {
        this.threeRef = threeRef
        this.sizes = attribute.sizes
        this.init()
        return this.renderer
    }
    init() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.threeRef.value,
            alpha: true,
            powerPreference: 'low-power'
        })
        // 必须在创建 renderer 后开启阴影
        this.renderer.shadowMap.enabled = true
        // 设置场景背景颜色为深灰色
        // this.renderer.setClearColor(0xffffff, 1)
        // 设置像素比，2 表示在 Retina 屏幕上以 2 倍分辨率渲染
        this.renderer.setPixelRatio(2)
        // 背景清成全透明：地图模式下透出底下 Cesium 的地球影像
        this.renderer.setClearColor(0x000000, 0)
        // 设置渲染器尺寸为当前视口大小
        const { width, height } = this.sizes.viewport
        this.renderer.setSize(width, height)
        // 禁用自动清除，便于实现后期处理等需要手动控制清除的场景
        this.renderer.autoClear = false
    }
}