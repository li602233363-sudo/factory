import EventEmitter from './EventEmitter.js'
import * as TWEEN from '@tweenjs/tween.js'
import * as THREE from 'three'

export default class Time extends EventEmitter {
    constructor(){
        super()
        this.Clock = new THREE.Clock()
        this.tick = this.tick.bind(this)
        this.tick()
    }
    /**
     * 说明通过 requestAnimationFrame 持续更新帧时间并触发 tick 事件
     */
    tick() {
        this.ticker = window.requestAnimationFrame(this.tick)
        this.current = this.Clock.getDelta();
        TWEEN.update()
        this.trigger('tick')
    }
    /**
     * 说明停止主循环
     */
    stop() {
        console.log('停止循环')
        window.cancelAnimationFrame(this.ticker)
    }
}