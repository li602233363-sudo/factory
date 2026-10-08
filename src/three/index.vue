<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ThreeBase from './base/index'
import type { LoadProgress } from './model/index'

const containerRef = ref<HTMLDivElement | null>(null)

let three: ThreeBase | null = null

const loading = ref(true)
const progress = ref(0)
const currentFile = ref('')
const errorMsg = ref('')

function handleProgress(data: LoadProgress) {
  progress.value = data.progress
  currentFile.value = data.currentFile
}

function handleError(error: unknown) {
  loading.value = false
  errorMsg.value = error instanceof Error ? error.message : '模型加载失败'
  ElMessage.error(errorMsg.value)
}

function startScene() {
  loading.value = true
  errorMsg.value = ''
  progress.value = 0
  currentFile.value = ''

  if (!containerRef.value) return

  three?.dispose()
  containerRef.value.innerHTML = ''

  three = new ThreeBase(containerRef.value, {
    onProgress: handleProgress,
  })
  three
    .init()
    .then(() => {
      progress.value = 100
      loading.value = false
    })
    .catch(handleError)
}

onMounted(() => {
  startScene()
})

onBeforeUnmount(() => {
  three?.dispose()
  three = null
})
</script>

<template>
  <div ref="containerRef" class="three-container"></div>

  <div v-if="loading || errorMsg" class="loading-mask">
    <div class="loading-panel">
      <template v-if="!errorMsg">
        <p class="loading-title">正在加载 3D 资源…</p>
        <div class="loading-progress">
          <el-progress
            :percentage="progress"
            :stroke-width="16"
            :show-text="false"
            striped
            striped-flow
          />
          <span class="loading-progress-text">{{ progress }}%</span>
        </div>
        <p class="loading-file">
          {{ progress }}% · {{ currentFile || '准备中' }}
        </p>
      </template>
      <template v-else>
        <p class="loading-title error">加载失败</p>
        <p class="loading-file error-text">{{ errorMsg }}</p>
        <el-button type="primary" @click="startScene">重新加载</el-button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.three-container {
  width: 100%;
  height: 100svh;
  overflow: hidden;
}

.three-container :deep(canvas) {
  display: block;
}

.loading-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(22 23 29 / 85%);
  backdrop-filter: blur(4px);
}

.loading-panel {
  width: min(420px, 80vw);
  padding: 28px 32px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 12px;
  background: #1f2028;
  box-shadow: var(--shadow);
}

.loading-title {
  margin: 0 0 18px;
  font-size: 18px;
  font-weight: 500;
  color: #f3f4f6;
  text-align: center;
}

.loading-title.error {
  color: #f56c6c;
}

.loading-progress {
  position: relative;
}

.loading-progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 0 0 / 35%);
  pointer-events: none;
}

.loading-file {
  margin: 14px 0 0;
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  word-break: break-all;
}

.error-text {
  color: #f56c6c;
}
</style>