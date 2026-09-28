import {defineComponent, ref, onMounted} from 'vue'
import useThree from "../three/index";
export default defineComponent({
  name: 'Index',
  setup() {
    const cesiumRef = ref(null);
    onMounted(() => {
      if (cesiumRef.value) {
        useThree(cesiumRef);
      }
    }); 
    return () => (
      <>
        <div ref={cesiumRef} class="cesium-container" />
      </>
    )
  }
})