/**
 * Resources
 *
 * 该模块负责加载所需的资源（模型、纹理等），并在加载过程
 * 中派发进度事件和完成事件。
 *
 * 主要功能：
 * - 使用 Loader 加载资源列表
 * - 将加载完成的数据缓存到 this.items
 * - 为纹理资源创建 THREE.Texture 并保存为 `${name}Texture`
 * - 触发 `progress` 事件以报告加载进度
 * - 触发 `ready` 事件表示所有资源加载完成
 *
 * 继承自 EventEmitter，因此可通过 `on(...)` 监听事件，通过 `trigger(...)`
 * 触发事件。
 */
import * as THREE from 'three'

import Loader from './Loader.js'
import EventEmitter from './EventEmitter.js'

export default class Resources extends EventEmitter {
    constructor(list) {
        super()
        this.loader = new Loader()
        this.loader.load(list)
        if (Array.isArray(list) && list.length > 0) {
            this.init(list)
        }
    }
    init(list) {
        this.items = {}
        this.loader.on('fileEnd', (_resource, _data) => {
            this.items[_resource.name] = _data

            // Texture
            if (_resource.type === 'texture') {
                const texture = new THREE.Texture(_data)
                texture.needsUpdate = true

                this.items[`${_resource.name}Texture`] = texture
            }

            // Trigger progress
            this.trigger('progress', [this.loader.loaded / this.loader.toLoad])
        })

        this.loader.on('end', () => {
            // Trigger ready
            this.trigger('ready')
        })
    }
}
