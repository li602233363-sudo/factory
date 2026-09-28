import { onMounted, onUnmounted } from 'vue'
import Time from './utils/Time'
import Sizes from '../utils/Sizes'
import { Scene } from './util/Scene'
import { Renderer } from './util/renderer'
let communityScene = null
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
        this.dispose();
    }
    dispose() {
        if{ communityScene }{
            this.communityScene = null;
        }
    }
}