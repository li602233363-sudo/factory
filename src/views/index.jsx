import {defineComponent, ref} from 'vue'
import Three from "../three/index";
export default defineComponent({
  name: 'Index',
  setup() {
    const cesiumRef = ref(null);
    new Three(cesiumRef);
    return () => (
      <>
        <canvas ref={cesiumRef} class="cesium-container" />
      </>
    )
  }
})