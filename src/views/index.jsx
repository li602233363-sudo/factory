import {defineComponent, ref} from 'vue'
import useThree from "../three/index";
export default defineComponent({
  name: 'Index',
  setup() {
    const cesiumRef = ref(null);
    useThree(cesiumRef);
    return () => (
      <>
        <div ref={cesiumRef} class="cesium-container" />
      </>
    )
  }
})