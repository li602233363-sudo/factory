<script setup lang="ts">
// 设备信息浮层：展示被选中设备的模拟运行数据。
import { computed } from 'vue'
import type { EquipmentInfo } from '@/three/types'

const props = defineProps<{ info: EquipmentInfo | null }>()
const emit = defineEmits<{ close: [] }>()

const statusColor = computed<{ text: string; dot: string }>(() => {
  const map: Record<string, { text: string; dot: string }> = {
    运行: { text: '#00e6ff', dot: '#00e6ff' },
    待机: { text: '#f6c343', dot: '#f6c343' },
    检修: { text: '#8f9bb3', dot: '#8f9bb3' },
    报警: { text: '#ff4d6a', dot: '#ff4d6a' },
  }
  return map[props.info?.status ?? '运行'] ?? map.运行
})

const rows = computed(() => {
  const i = props.info
  if (!i) return []
  return [
    { label: '实时产量', value: `${i.output} 件` },
    { label: '设备温度', value: `${i.temperature} ℃` },
    { label: '稼动率', value: `${i.utilization} %` },
    { label: '报警数', value: `${i.alarms} 条` },
  ]
})
</script>

<template>
  <Transition name="panel">
    <div v-if="info" class="device-panel">
      <div class="panel-head">
        <span class="panel-title">{{ info.name }}</span>
        <button class="close" aria-label="关闭" @click="emit('close')">✕</button>
      </div>

      <div class="status-row">
        <span
          class="dot"
          :style="{ background: statusColor.dot, boxShadow: `0 0 8px ${statusColor.dot}` }"
        />
        <span class="status-text" :style="{ color: statusColor.text }">
          {{ info.status }}
        </span>
      </div>

      <div class="metric-grid">
        <div
          v-for="r in rows"
          :key="r.label"
          class="metric"
        >
          <div class="metric-value">{{ r.value }}</div>
          <div class="metric-label">{{ r.label }}</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
@use '@/styles/vars' as v;

.device-panel {
  background: v.$panel;
  border: 1px solid v.$border;
  border-radius: 10px;
  backdrop-filter: blur(8px);
  padding: 14px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.panel-title {
  color: v.$text;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.close {
  background: transparent;
  border: 0;
  color: v.$text-dim;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  &:hover {
    color: v.$text;
    background: rgba(v.$accent, 0.15);
  }
}
.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 12px;
  font-size: 13px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-text {
  letter-spacing: 1px;
}
.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.metric {
  background: rgba(v.$accent, 0.06);
  border: 1px solid rgba(v.$accent, 0.12);
  border-radius: 8px;
  padding: 8px 10px;
}
.metric-value {
  color: v.$text;
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.metric-label {
  color: v.$text-dim;
  font-size: 12px;
  margin-top: 2px;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>