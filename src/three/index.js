import { onMounted, onUnmounted } from 'vue'
import Time from './utils/Time'
import Sizes from './utils/Sizes'
import { Scene } from './utils/Scene'
import { Renderer } from './utils/renderer'
let communityScene = null
function dispose() {
    if (communityScene) {
        communityScene = null
    }
}
export default function useThree(cesiumRef, attribute = {}) {
    onMounted(() => {
        this.time = new Time()
        this.sizes = new Sizes(cesiumRef.value)
        this.scene = new Scene().init()
        this.renderer = new Renderer(cesiumRef, {
            sizes: this.sizes
        })
    })
    onUnmounted(() => {
        dispose()
    })

}