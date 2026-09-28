import * as THREE from 'three'
import {watch} from 'vue'
import EventEmitter from './EventEmitter.js'
export class AddClick extends EventEmitter {
    constructor(camera, scene, threeRef, attribute) {
        super()
        this.camera = camera;
        this.scene = scene;
        this.threeRef = threeRef;
        this.init();
        const { select } = attribute
        watch(select, (newVal, oldVal) => {
            console.log('select 变化:', newVal, oldVal)
            // 在这里写你的点击 / 场景逻辑
            const obj = this.scene.getObjectByName(newVal);
            if(obj){
                const worldPos = new THREE.Vector3()
                obj.getWorldPosition(worldPos)
                this.trigger('btn', [{object: obj, point: worldPos}])
            }
        })
    }
    init() {
        this.flag = true;
        const canvas = this.threeRef.value;
        // 先 bind 存引用：addEventListener 和 removeEventListener 必须用同一引用才能正确解绑
        // （原代码 add 用 this._onDown.bind(this) 新函数、remove 用 this._onDown 原函数，引用不同 → remove 无效）
        this._onDownBound = this._onDown.bind(this)
        this._onMoveBound = this._onMove.bind(this)
        this._onUpBound = this._onUp.bind(this)
        canvas.addEventListener('mousedown', this._onDownBound)
        canvas.addEventListener('mousemove', this._onMoveBound)
        canvas.addEventListener('mouseup', this._onUpBound)
    }
    _onDown() {
        this.flag = true
    }
    _onMove() {
        if (this.flag) {
            this.flag = false       // 按下后动了 = 这是拖拽，不是纯点击
        }
    }
    _onUp(event) {
        if (this.flag) {
            this.handleClick(event)
        }
    }
    handleClick(event) {
        const camera = this.camera.instance;
        // 获取到浏览器坐标
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 创建设备坐标（三维）
        const standardVector = new THREE.Vector3(x, y, 0.5);

        const worldVector = standardVector.unproject(camera);

        // 做序列化
        const ray = worldVector.sub(camera.position).normalize();

        // 如何实现点击选中
        // 创建一个射线发射器，用来发射一条射线
        const raycaster = new THREE.Raycaster(camera.position, ray);
        // Raycaster 要拾取 Sprite/Points 必须设 camera，否则 Sprite.raycast 读 null.matrixWorld 报错
        raycaster.camera = camera

        // 返回射线碰撞到的物体
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        console.log('射线碰撞'+intersects)
        let point3d = null;
        if (intersects.length) {
            point3d = intersects.find(v => v?.object.name);
        }
        if (point3d) {
            this.trigger('btn', [point3d])
        }
    }
    /**
     * 说明停止主循环
     */
    stop() {
        console.log('停止循环')
        const canvas = this.threeRef.value;
        if (canvas) {
            canvas.removeEventListener('mousedown', this._onDownBound)
            canvas.removeEventListener('mousemove', this._onMoveBound)
            canvas.removeEventListener('mouseup',   this._onUpBound)
        }
        window.cancelAnimationFrame(this.ticker)
    }
}
