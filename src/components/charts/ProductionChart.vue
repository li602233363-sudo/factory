<script setup lang="ts">
// 产量趋势图：滚动时间窗折线，模拟实时刷新。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'

const labels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
const data = ref<number[]>(labels.map(() => 280 + Math.random() * 160))
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    data.value.push(280 + Math.random() * 160)
    if (data.value.length > labels.length) data.value.shift()
  }, 2000)
})

onBeforeUnmount(() => clearInterval(timer))

const option = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { top: 24, right: 16, bottom: 20, left: 36 },
  xAxis: {
    type: 'category',
    data: labels,
    axisLine: { lineStyle: { color: '#1d3b57' } },
    axisLabel: { color: '#7fa4c8' },
  },
  yAxis: {
    type: 'value',
    name: '件',
    splitLine: { lineStyle: { color: '#14263a' } },
    axisLabel: { color: '#7fa4c8' },
  },
  series: [
    {
      name: '产量',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: data.value,
      lineStyle: { color: '#00e6ff', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0,230,255,0.35)' },
            { offset: 1, color: 'rgba(0,230,255,0)' },
          ],
        },
      },
    },
  ],
}))
</script>

<template>
  <BaseChart :option="option" />
</template>