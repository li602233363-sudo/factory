import { defineComponent, ref } from "vue";
import Three from "../three/index";
export default defineComponent({
  name: "Index",
  setup() {
    const threeRef = ref(null);
    const cesiumRef = ref(null);
    new Three(threeRef, {
      cesiumRef, // 传入容器后自动启用「真实地图底图」模式
    });
    return () => (
      <>
        <div class="map-root">
          <div ref={cesiumRef} class="map-viewer" />
          <canvas ref={threeRef} id="three-id" />
        </div>
      </>
    );
  },
});
