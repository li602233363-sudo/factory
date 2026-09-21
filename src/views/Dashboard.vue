<script setup lang="ts">
// 智慧工厂数字孪生主视图：3D 场景 + 科技风数据面板。
import { computed, ref } from 'vue'
import SceneCanvas from '@/components/SceneCanvas.vue'
import LoadProgress from '@/components/LoadProgress.vue'
import DeviceInfoPanel from '@/components/DeviceInfoPanel.vue'
import ProductionChart from '@/components/charts/ProductionChart.vue'
import DeviceStatusChart from '@/components/charts/DeviceStatusChart.vue'
import EnergyChart from '@/components/charts/EnergyChart.vue'
import type { EquipmentInfo, LoadProgressData } from '@/three/types'

const sceneRef = ref<InstanceType<typeof SceneCanvas> | null>(null)

const loading = ref(false)
const progress = ref<LoadProgressData>({ percent: 0, done: false, name: '智慧工厂车间' })
const selected = ref<EquipmentInfo | null>(null)
const selectedTarget = ref<unknown>(null)
const devices = ref<{ name: string; object: unknown }[]>([])
const clock = ref('')

function onProgress(p: LoadProgressData) {
  progress.value = p
  loading.value = !p.done
}

function onPick(info: EquipmentInfo, target: unknown) {
  selected.value = info
  selectedTarget.value = target
}

function onClear() {
  selected.value = null
  selectedTarget.value = null
}

function onDevices(list: { name: string; object: unknown }[]) {
  devices.value = list
}

function focusDevice(d: { name: string; object: unknown }) {
  selectedTarget.value = d.object
  selected.value = {
    name: d.name,
    status: '运行',
    output: Math.round(380 + Math.random() * 120),
    temperature: Math.round(38 + Math.random() * 12),
    utilization: Math.round(82 + Math.random() * 15),
    alarms: Math.floor(Math.random() * 3),
  }
  sceneRef.value?.focusObject(d.object)
}

// 顶部实时时钟
const timeStr = () => new Date().toLocaleString('zh-CN', { hour12: false })
clock.value = timeStr()
setInterval(() => (clock.value = timeStr()), 1000)

const deviceCount = computed(() => devices.value.length)
</script>

<template>
  <div class="dashboard">
    <SceneCanvas
      ref="sceneRef"
      @progress="onProgress"
      @pick="onPick"
      @clear="onClear"
      @devices="onDevices"
    />

    <!-- 顶部标题栏 -->
    <header class="top-bar">
      <div class="brand">
        <span class="logo" />
        <span class="title">智慧工厂 · 数字孪生系统</span>
      </div>
      <div class="clock">{{ clock }}</div>
    </header>

    <!-- 左侧：设备列表 -->
    <aside class="panel device-list">
      <div class="panel-title">设备列表</div>
      <div class="panel-sub">{{ deviceCount }} 个可识别对象</div>
      <ul class="device-items">
        <li
          v-for="d in devices"
          :key="d.name"
          class="device-item"
          @click="focusDevice(d)"
        >
          {{ d.name }}
        </li>
      </ul>
    </aside>

    <!-- 右侧：选中设备信息 -->
    <aside class="panel info-wrap">
      <DeviceInfoPanel :info="selected" @close="onClear" />
    </aside>

    <!-- 底部数据面板 -->
    <section class="charts">
      <div class="chart-card">
        <div class="chart-head">产量趋势（件 / 2h）</div>
        <ProductionChart />
      </div>
      <div class="chart-card">
        <div class="chart-head">设备状态分布</div>
        <DeviceStatusChart />
      </div>
      <div class="chart-card">
        <div class="chart-head">能耗趋势（kWh / h）</div>
        <EnergyChart />
      </div>
    </section>

    <!-- 底部提示 -->
    <div class="hint">点击 3D 场景中的设备查看详情 · 鼠标拖拽旋转 · 滚轮缩放 · 右键平移</div>

    <LoadProgress v-if="loading" :percent="progress.percent" :name="progress.name" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/vars' as *;

.dashboard {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(6, 9, 15, 0.9), rgba(6, 9, 15, 0));
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(135deg, $accent, #21e8ff);
  box-shadow: 0 0 12px rgba($accent, 0.8);
}
.title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 4px;
  color: $text;
}
.clock {
  color: $text-dim;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
  font-size: 14px;
}

.panel {
  position: fixed;
  z-index: 15;
  background: $panel;
  border: 1px solid $border;
  border-radius: 10px;
  backdrop-filter: blur(8px);
}

.device-list {
  top: 74px;
  left: 16px;
  width: 240px;
  max-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  padding: 14px 14px 8px;
}
.panel-title {
  color: $text;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
}
.panel-sub {
  color: $text-dim;
  font-size: 12px;
  margin: 2px 0 10px;
}
.device-items {
  list-style: none;
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}
.device-item {
  padding: 7px 10px;
  margin-bottom: 4px;
  border-radius: 6px;
  font-size: 13px;
  color: $text;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover {
    background: rgba($accent, 0.12);
    color: $accent;
  }
}

.info-wrap {
  top: 74px;
  right: 16px;
  width: 280px;
  padding: 14px 16px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.charts {
  position: fixed;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 300px));
  gap: 12px;
}
.chart-card {
  background: $panel;
  border: 1px solid $border;
  border-radius: 10px;
  backdrop-filter: blur(8px);
  padding: 10px 12px 4px;
}
.chart-head {
  color: $text-dim;
  font-size: 13px;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.hint {
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 12;
  color: rgba($text-dim, 0.6);
  font-size: 12px;
  letter-spacing: 0.5px;
  pointer-events: none;
}

@media (max-width: 900px) {
  .charts {
    grid-template-columns: 1fr;
    left: 12px;
    right: 12px;
    bottom: 12px;
    transform: none;
  }
  .device-list {
    width: 160px;
  }
  .info-wrap {
    width: 200px;
  }
}
</style>