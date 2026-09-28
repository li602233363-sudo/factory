import EventEmitter from './EventEmitter.js'

/**
 * 视口尺寸管理器
 * 负责监听窗口大小变化，计算并存储视口尺寸，通知其他组件更新
 */
export default class Sizes extends EventEmitter
{
    /**
     * 构造函数
     */
    constructor($canvas)
    {
        super()
        this.$canvas = $canvas

        const myCommunity = document.getElementById('app')
        // 用于存储渲染视口尺寸
        this.viewport = {}
        // 创建一个隐藏的 div 元素用于精确测量视口尺寸
        this.$sizeViewport = document.createElement('div')
        this.$sizeViewport.style.width = myCommunity.offsetWidth
        this.$sizeViewport.style.height = myCommunity.offsetHeight
        this.$sizeViewport.style.position = 'absolute'
        this.$sizeViewport.style.top = 0
        this.$sizeViewport.style.left = 0
        this.$sizeViewport.style.pointerEvents = 'none'

        // 监听窗口大小变化事件
        this.resize = this.resize.bind(this)
        window.addEventListener('resize', this.resize)

        // 初始化视口尺寸
        this.resize()
    }

    /**
     * 计算视口尺寸
     * 通过临时 DOM 元素精确测量视口实际渲染尺寸，并触发 resize 事件通知订阅者
     */
    resize()
    {
        const myCommunity = document.getElementById('app')
        this.$canvas.appendChild(this.$sizeViewport)
        this.viewport.width = myCommunity.offsetWidth
        this.viewport.height = myCommunity.offsetHeight
        this.$canvas.removeChild(this.$sizeViewport)

        // 存储窗口内部尺寸（包括滚动条）
        this.width = myCommunity.offsetWidth
        this.height = myCommunity.offsetHeight
        this.trigger('resize')
    }
}
