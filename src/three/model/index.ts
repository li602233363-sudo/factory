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

/** 探测文件开头时请求的字节数（只取极小片段，避免重新下载整个模型） */
const SNIFF_BYTES = 160

interface SniffResult {
  /** HTTP 状态码 */
  status: number
  /** 响应是否成功 */
  ok: boolean
  /** 文件开头内容（按文本解码） */
  head: string
}

/**
 * 读取文件开头片段，用于分析加载失败的原因
 * 探测本身失败（如断网、跨域）时返回 null，不影响原始错误
 */
async function sniffFileHead(url: string): Promise<SniffResult | null> {
  try {
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${SNIFF_BYTES - 1}` },
      cache: 'no-store',
    })

    if (!response.ok || !response.body) {
      return { status: response.status, ok: response.ok, head: '' }
    }

    const reader = response.body.getReader()
    const { value } = await reader.read()
    // 拿到开头片段后立即取消，剩余内容不再下载
    await reader.cancel().catch(() => {})

    return {
      status: response.status,
      ok: true,
      head: value ? new TextDecoder().decode(value.subarray(0, SNIFF_BYTES)) : '',
    }
  } catch {
    return null
  }
}

/**
 * 把加载失败翻译成可操作的提示
 * 常见原因：Git LFS 指针未拉取、路径不存在、被开发服务器回退到 index.html
 */
async function describeLoadFailure(url: string, error: unknown): Promise<string> {
  const message = `模型加载失败: ${url}`
  const detail = error instanceof Error && error.message ? `（${error.message}）` : ''
  const info = await sniffFileHead(url)

  if (!info) return `${message}${detail}`

  if (!info.ok) {
    return info.status === 404
      ? `${message}（HTTP 404，文件不存在）`
      : `${message}（HTTP ${info.status}）`
  }

  // Git LFS 未拉取时，浏览器拿到的是指针文本而不是模型二进制
  if (info.head.startsWith('version https://git-lfs')) {
    return `${message}（文件是 Git LFS 指针，真实模型未拉取，请在项目根目录执行 git lfs pull）`
  }

  if (info.head.trimStart().startsWith('<')) {
    return `${message}（返回的是 HTML 页面，通常是路径错误或被开发服务器回退到 index.html）`
  }

  if (url.endsWith('.glb') && !info.head.startsWith('glTF')) {
    return `${message}（文件内容不是有效的 GLB 二进制）`
  }

  return `${message}${detail}`
}

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
          async (error: unknown) => {
            reject(new Error(await describeLoadFailure(model.url, error)))
          },
        )
      }),
  )

  return Promise.all(tasks)
}
