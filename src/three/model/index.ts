import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface ModelItem {
  /** 模型名称（用于进度提示） */
  name: string
  /** 模型地址 */
  url: string
}

export interface ModelLoadResult {
  name: string
  url: string
  gltf: GLTF
}

export interface LoadProgress {
  /** 总进度 0 ~ 100 */
  progress: number
  /** 当前正在下载的文件名称 */
  currentFile: string
  /** 已完成数量 */
  loadedCount: number
  /** 总数量 */
  totalCount: number
}

/**
 * 3D 模型资源清单
 * 集中管理初始化需要加载的模型名称与地址
 */
export const modelList: ModelItem[] = [
  {
    name: 'Soldier.glb',
    url: `${import.meta.env.BASE_URL}gltf/Soldier.glb`,
  },
  {
    name: 'newCnc5.glb',
    url: `${import.meta.env.BASE_URL}models/newCnc5.glb`,
  },
  { name: '车间', url: `${import.meta.env.BASE_URL}models/chejian3.glb` },
  // { name: 'CNC', url: `${import.meta.env.BASE_URL}models/cnc.glb` },
]

/**
 * 批量加载 glTF / GLB 模型
 * 每个文件权重相同，按文件维度汇总总进度
 */
export function loadGLTFModels(
  models: ModelItem[],
  onProgress?: (progress: LoadProgress) => void,
): Promise<ModelLoadResult[]> {
  const loader = new GLTFLoader()
  const totalCount = models.length

  // 每个文件已下载的比例 0 ~ 1
  const shares = new Array(totalCount).fill(0)

  const report = (currentFile: string) => {
    const sum = shares.reduce((acc, value) => acc + value, 0)
    const loadedCount = shares.filter(value => value >= 1).length
    onProgress?.({
      progress: Math.round((sum / totalCount) * 100),
      currentFile,
      loadedCount,
      totalCount,
    })
  }

  const tasks = models.map(
    (model, index) =>
      new Promise<ModelLoadResult>((resolve, reject) => {
        loader.load(
          model.url,
          gltf => {
            shares[index] = 1
            report(model.name)
            resolve({ name: model.name, url: model.url, gltf })
          },
          event => {
            if (event.total > 0) {
              shares[index] = Math.min(event.loaded / event.total, 0.999)
            } else if (event.lengthComputable) {
              shares[index] = Math.min(event.loaded / event.total, 0.999)
            }
            report(model.name)
          },
          () => {
            reject(new Error(`模型加载失败: ${model.url}`))
          },
        )
      }),
  )

  return Promise.all(tasks)
}
