<script setup lang="ts">
// 3D 场景画布：初始化 SceneManager，通过 loadAllModels 加载页面所有模型
// （实时聚合加载进度），处理点击拾取 / hover 事件，并收集场景中的带名设备。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { SceneManager } from '@/three/SceneManager'
import { loadAllModels } from '@/views/utils/loadAllModels'
import { PAGE_MODELS } from '@/config/models'
import type { Object3D } from 'three'
import type { EquipmentInfo, LoadProgressData } from '@/three/types'

const emit = defineEmits<{
  progress: [data: LoadProgressData]
  pick: [info: EquipmentInfo, target: unknown]
  clear: []
  devices: [list: { name: string; object: unknown }[]]
  loaded: []
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let manager: SceneManager | null = null
const hovered = ref(false)

onMounted(async () => {
  if (!canvas.value) return
  manager = new SceneManager(canvas.value)
  manager.start()

  manager.canvas.addEventListener('pointermove', onPointerMove)

  try {
    // 加载页面全部模型，整体进度实时上报
    const groups = await loadAllModels(PAGE_MODELS, (p) => emit('progress', p))

    const allNamed: { name: string; object: unknown }[] = []
    groups.forEach((group, i) => {
      manager!.scene.add(group) // 全部并入场景，均可拾取
      if (i === 0) manager!.setModelRoot(group) // 首个(车间)作取景基准
      allNamed.push(...collectNamed(group))
    })

    emit('progress', { percent: 100, done: true, name: '全部模型加载完成' })
    emit('devices', allNamed)
    emit('loaded')

    manager.canvas.addEventListener('click', onClick)
  } catch (err) {
    console.error('模型加载失败:', err)
    emit('progress', { percent: 100, done: true, name: '模型加载失败' })
  }
})

onBeforeUnmount(() => {
  manager?.canvas.removeEventListener('pointermove', onPointerMove)
  manager?.canvas.removeEventListener('click', onClick)
  manager?.dispose()
  manager = null
})

function collectNamed(root: Object3D): { name: string; object: unknown }[] {
  const seen = new Set<string>()
  const list: { name: string; object: unknown }[] = []
  root.traverse((obj) => {
    const n = obj.name
    if (n && !seen.has(n)) {
      seen.add(n)
      list.push({ name: n, object: obj })
    }
  })
  return list
}

function onPointerMove(e: MouseEvent) {
  if (!manager) return
  const hit = toNdc(e)
  const picked = hit ? manager.pick(hit.x, hit.y) : null
  const isHover = picked !== null
  if (isHover !== hovered.value) {
    hovered.value = isHover
    if (isHover) manager.canvas.style.cursor = 'pointer'
    else manager.canvas.style.cursor = 'default'
  }
}

function onClick(e: MouseEvent) {
  if (!manager) return
  const hit = toNdc(e)
  const picked = hit ? manager.pick(hit.x, hit.y) : null
  if (picked) {
    manager.setSelection(picked)
    emit('pick', SceneManager.describe(picked), picked)
  } else {
    manager.setSelection(null)
    emit('clear')
  }
}

function toNdc(e: MouseEvent) {
  const rect = manager?.canvas.getBoundingClientRect()
  if (!rect) return null
  return {
    x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
    y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
  }
}

/** 供父组件聚焦到指定对象（设备列表联动） */
function focusObject(target: unknown) {
  manager?.focusObject(target as Object3D)
}

/** 按键外部按对象名聚焦 */
function focusByName(name: string) {
  if (!manager?.scene) return
  const obj = manager.scene.getObjectByName(name)
  if (obj) {
    manager.setSelection(obj)
    emit('pick', SceneManager.describe(obj), obj)
    manager.focusObject(obj)
  }
}

defineExpose({ focusObject, focusByName })
</script>

<template>
  <canvas ref="canvas" class="scene-canvas" />
</template>

<style scoped lang="scss">
.scene-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  touch-action: none;
}
</style>