import { Group, Mesh, MeshStandardMaterial, SRGBColorSpace, Texture } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { LoadProgressData } from './types'

/**
 * 封装 GLB/GLTF 模型加载，向 UI 暴露实时进度，并在加载完成后统一修正材质
 *（色彩空间 / 阴影投射），保证数字孪生场景观感一致。
 */
export class ModelLoader {
  private readonly loader = new GLTFLoader()

  /**
   * 加载一个模型
   * @param url      模型 URL（通常以 /models/ 开头落于 public）
   * @param name     展示用名称
   * @param onProgress 进度回调（含 percent 0-100）
   */
  async load(
    url: string,
    name: string,
    onProgress?: (p: LoadProgressData) => void,
  ): Promise<Group> {
    return new Promise<Group>((resolve, reject) => {
      onProgress?.({ percent: 0, done: false, name })
      this.loader.load(
        url,
        (gltf) => {
          const group = gltf.scene
          normalizeMaterials(group)
          onProgress?.({ percent: 100, done: true, name })
          resolve(group)
        },
        (progress) => {
          if (onProgress) {
            const ratio = progress.total
              ? progress.loaded / progress.total
              : 0.5
            onProgress({
              percent: Math.min(99, Math.round(ratio * 100)),
              done: false,
              name,
            })
          }
        },
        (error) => reject(error),
      )
    })
  }
}

/** 递归统一材质：CAD 模型的纹理贴图转换到 sRGB，并开启阴影投射 */
function normalizeMaterials(group: Group): void {
  group.traverse((obj) => {
    if ((obj as Mesh).isMesh) {
      const mesh = obj as Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((mat) => {
        if (!isStandard(mat)) return
        Object.values(mat).forEach((prop) => {
          if (prop instanceof Texture) prop.colorSpace = SRGBColorSpace
        })
      })
    }
  })
}

function isStandard(mat: unknown): mat is MeshStandardMaterial {
  return mat instanceof MeshStandardMaterial
}