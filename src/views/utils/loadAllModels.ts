// 视图工具：统一加载一组模型，并实时聚合输出整体加载进度。
// 说明：本目录仅放通用的、可独立复用的封装方法；模型源清单（PAGE_MODELS）
// 属于页面业务配置，统一位于 src/config/models.ts，不在此处定义。
import { ModelLoader } from '@/three/ModelLoader'
import type { Object3D } from 'three'
import type { ModelSource } from '@/config/models'
import type { LoadProgressData } from '@/three/types'

export type { ModelSource }

/**
 * 加载一组模型，将所有模型并发加载，并把每个模型的实时进度聚合为整体
 * 进度（0-100）持续上报。
 *
 * @param models     待加载模型列表（调用方提供，通常来自 src/config/models）
 * @param onProgress 实时整体进度回调
 * @returns          Promise<Object3D[]>，顺序与传入 models 一一对应
 */
export function loadAllModels(
  models: ModelSource[],
  onProgress?: (p: LoadProgressData) => void,
): Promise<Object3D[]> {
  const loader = new ModelLoader()
  // name -> 已合并的单项进度(0-100)
  const table = new Map<string, number>()
  const count = models.length

  const emitCombined = () => {
    if (!onProgress) return
    let sum = 0
    for (const m of models) sum += table.get(m.name) ?? 0
    const percent = count ? Math.round(sum / count) : 0
    const done = models.every((m) => (table.get(m.name) ?? 0) >= 100)
    // 取第一个尚未完成的模型作为「当前加载项」展示
    const active = models.find((m) => (table.get(m.name) ?? 0) < 100)?.name ?? ''
    onProgress({ percent, done, name: active })
  }

  const tasks = models.map((m) =>
    loader.load(m.url, m.name, (p) => {
      table.set(m.name, p.percent)
      emitCombined()
    }),
  )

  return Promise.all(tasks).then((groups) => {
    emitCombined()
    return groups
  })
}