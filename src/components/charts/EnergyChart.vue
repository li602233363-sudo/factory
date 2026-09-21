<script setup lang="ts">
// 能耗趋势图：近 24 小时柱状图，模拟实时刷新。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'

const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const data = ref<number[]>(hours.map(() => 40 + Math.random() * 30))
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    data.value.push(40 + Math.random() * 30)
    if (data.value.length > hours.length) data.value.shift()
    void data.value
  }, 3000)
})

onBeforeUnmount(() => clearInterval(timer))

const option = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { top: 24, right: 16, bottom: 20, left: 40 },
  xAxis: {
    type: 'category',
    data: hours,
    axisLine: { lineStyle: { color: '#1d3b57' } },
    axisLabel: { color: '#7fa4c8', showMaxLabel: true },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    name: 'kWh',
    splitLine: { lineStyle: { color: '#14263a' } },
    axisLabel: { color: '#7fa4c8' },
  },
  series: [
    {
      name: '能耗',
      type: 'bar',
      barWidth: '46%',
      data: data.value,
      itemStyle: {
        borderRadius: [2, 2, 0, 0],
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#00e6ff' },
            { offset: 1, color: '#0a6fb0' },
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