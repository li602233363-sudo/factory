<script setup lang="ts">
// 模型加载进度条：130MB 大模型加载期间显示。
const props = defineProps<{ percent: number; name?: string }>()
</script>

<template>
  <div class="load-overlay">
    <div class="load-box">
      <div class="load-title">数字孪生场景加载中</div>
      <div class="load-model">{{ props.name }}</div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: props.percent + '%' }" />
      </div>
      <div class="load-percent">{{ Math.round(props.percent) }}%</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/vars' as v;

.load-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(v.$bg-deep, 0.72);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.load-box {
  width: 360px;
  text-align: center;
}
.load-title {
  font-size: 18px;
  letter-spacing: 3px;
  color: v.$text;
}
.load-model {
  margin-top: 6px;
  color: v.$accent;
  font-size: 13px;
  min-height: 18px;
}
.progress-track {
  margin-top: 18px;
  height: 6px;
  border-radius: 3px;
  background: rgba(v.$accent, 0.18);
  overflow: hidden;
  width: 100%;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, v.$accent, #21e8ff);
  transition: width 0.3s ease;
}
.load-percent {
  margin-top: 10px;
  font-variant-numeric: tabular-nums;
  color: v.$text-dim;
  font-size: 14px;
}
</style>