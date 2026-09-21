<script setup lang="ts">
// 设备状态分布图：环形占比统计。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'

const byStatus = [
  { name: '运行', value: 0 },
  { name: '待机', value: 0 },
  { name: '检修', value: 0 },
  { name: '报警', value: 0 },
]
const items = ref<typeof byStatus>(
  byStatus.map((b, i) => ({ ...b, value: [46, 12, 5, 3][i] })),
)
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    items.value = items.value.map((it) => {
      const drift = Math.floor(Math.random() * 3) - 1
      return { ...it, value: Math.max(0, it.value + drift) }
    })
  }, 3000)
})

onBeforeUnmount(() => clearInterval(timer))

const option = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item', formatter: '{b}: {c} 台 ({d}%)' },
  legend: {
    bottom: 0,
    textStyle: { color: '#7fa4c8' },
    itemWidth: 12,
    itemHeight: 12,
  },
  series: [
    {
      name: '设备状态',
      type: 'pie',
      radius: ['46%', '68%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: false,
      label: { show: false },
      itemStyle: { borderColor: '#06090f', borderWidth: 2 },
      data: items.value.map((it) => {
        const colorMap: Record<string, string> = {
          运行: '#00e6ff',
          待机: '#f6c343',
          检修: '#8f9bb3',
          报警: '#ff4d6a',
        }
        return { ...it, itemStyle: { color: colorMap[it.name] } }
      }),
    },
  ],
}))
</script>

<template>
  <BaseChart :option="option" />
</template>