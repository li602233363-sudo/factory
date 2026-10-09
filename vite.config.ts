import { closeSync, existsSync, openSync, readdirSync, readSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

/** Git LFS 指针文件的固定开头 */
const LFS_POINTER_MAGIC = 'version https://git-lfs.github.com/spec/v1'

/** 需要检查的模型扩展名 */
const MODEL_EXTENSIONS = ['.glb', '.gltf']

/** 识别文件类型时读取的字节数（只读开头，避免载入大模型） */
const SAMPLE_SIZE = 64

/**
 * 判断文件是否为未拉取的 Git LFS 指针文件
 */
function isLfsPointer(file: string): boolean {
  const fd = openSync(file, 'r')

  try {
    const buffer = Buffer.alloc(SAMPLE_SIZE)
    const bytes = readSync(fd, buffer, 0, SAMPLE_SIZE, 0)
    return buffer.subarray(0, bytes).toString('utf8').startsWith(LFS_POINTER_MAGIC)
  } finally {
    closeSync(fd)
  }
}

/**
 * 递归找出目录下所有仍是 Git LFS 指针的模型文件
 */
function findLfsPointers(dir: string): string[] {
  const pointers: string[] = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      pointers.push(...findLfsPointers(fullPath))
      continue
    }

    if (!MODEL_EXTENSIONS.includes(extname(entry.name))) continue
    if (statSync(fullPath).size > 0 && isLfsPointer(fullPath)) {
      pointers.push(fullPath)
    }
  }

  return pointers
}

/**
 * 启动 / 构建前检查静态模型资源
 * 未被拉取的 LFS 指针只会返回一段文本，浏览器端必然出现「模型加载失败」
 */
function lfsModelGuard(): Plugin {
  let root = process.cwd()

  const report = (warn: (message: string) => void) => {
    const publicDir = join(root, 'public')
    if (!existsSync(publicDir)) return

    const pointers = findLfsPointers(publicDir)
    if (!pointers.length) return

    const list = pointers.map(file => `  - ${relative(root, file)}`).join('\n')
    warn(
      `检测到 ${pointers.length} 个模型文件仍是 Git LFS 指针（真实内容未拉取），浏览器无法加载：\n` +
        `${list}\n请在项目根目录执行 git lfs pull 后重新启动。`,
    )
  }

  return {
    name: 'lfs-model-guard',
    configResolved(config) {
      root = config.root
    },
    buildStart() {
      report(message => this.warn(message))
    },
    configureServer(server) {
      report(message => server.config.logger.warn(message))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), lfsModelGuard()],
})
