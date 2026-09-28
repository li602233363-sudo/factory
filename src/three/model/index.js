import * as THREE from 'three'
import { GroundFactory } from 'three-base-utils/factory';
import { ElLoading } from 'element-plus'

export class Model {
    constructor(_options){
        this.resources = _options.resources
        this.time = _options.time
        this.sizes = _options.sizes
        this.camera = _options.camera
        this.scene = _options.scene
        this.renderer = _options.renderer
        this.passes = _options.passess
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.addclick = _options.addclick
        this.attribute = _options.attribute
        this._init()
        this.scene.add(this.container)
    }
    _init() {
        // 资源加载完成事件：所有资源加载完成后，推进出现动画效果，进是激活启动区域並推进开始吻简
        // Ready
        const loading = ElLoading.service({
            lock: true,
            text: 'Loading',
            background: 'rgba(0, 0, 0, 0.7)',
        })

        this.resources.on('ready', () =>
        {
            // this.setControls()
            // // AxesHelper：辅助观察的坐标系
            // // this.scene.add(new THREE.AxesHelper(150))
            // // 楼房
            // this.container.add(createCommunityBuildings())
            // // 地面
            // this.container.add(new CreateCommunityOutline().self)
            // //墙
            // this.container.add(new Wall());
            // // 道路
            // this.roadMaterial = this.__initMaterialForRoadGround();
            // const road = new StationRoad({renderer: this.renderer, roadMaterial: this.roadMaterial});
            // this.container.add(road.self);
            // // 人
            // this.setModel()
            // /*
            //   工厂-start
            // */
            // // public/models 下的 3 个模型
            // // 创建厂房地面
            // this.gongchang = new gongchang({
            //     resources: this.resources,
            //     container: this.container,
            //     time: this.time,
            //     attribute: this.attribute,
            //     addclick: this.addclick,
            //     scene: this.scene,
            //     camera: this.camera
            // })
            // /*
            //   工厂-end
            // */
            // this.container.needsUpdate = true;
            loading.close()
        })
    }
    // 初始化道路材质
    __initMaterialForRoadGround() {
        const roadFactory = new GroundFactory();
        const imgUrl = new URL('/public/assets/imgs/curb01.png', import.meta.url).href;
        const material = roadFactory.createDefaultMaterial({imgUrl, repeat:[10,10],});
        material.polygonOffset = true;
        material.polygonOffsetFactor = -6; 
        material.polygonOffsetUnits = -2;
        material.needsUpdate = true;
        return material;
    }
    // 
    setControls(){
        this.controls = new Controls({
            sizes: this.sizes,
            time: this.time,
            camera: this.camera,
            sounds: this.sounds
        })
    }
    setModel(){
        this.person = new Person({
            sizes: this.sizes,
            time: this.time,
            camera: this.camera,
            sounds: this.sounds,
            resources: this.resources,
            controls: this.controls,
            renderer: this.renderer,
            passes: this.passes
        })
        this.container.add(this.person.container)
    }
    background(){
        new Background({
            time: this.time,
            resources: this.resources,
            scene: this.scene
        })
        this.container.add(this.person.container)
    }
}