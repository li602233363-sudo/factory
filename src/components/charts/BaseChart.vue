<script setup lang="ts">
// ECharts 通用封装：负责实例初始化、深监听刷新、尺寸自适应与资源释放。
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: string
  }>(),
  { height: '180px' },
)

const container = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!container.value) return
  chart = echarts.init(container.value)
  chart.setOption(props.option)

  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(container.value)
})

watch(
  () => props.option,
  (opt) => {
    chart?.setOption(opt)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="container" :style="{ height }" class="base-chart" />
</template>

<style scoped lang="scss">
.base-chart {
  width: 100%;
}
</style>