// 应用级 3D 模型配置：定义页面会加载的模型源清单。
// 独立于工具层，方便按需增删模型、调整加载顺序与名称。

/** 一个待加载模型源 */
export interface ModelSource {
  /** 展示名 */
  name: string
  /** 模型 URL（通常以 /models/ 开头命中 public） */
  url: string
}

/** 页面使用到的全部 3D 模型（按加载顺序，首个作为主场景/取景基准） */
export const PAGE_MODELS: ModelSource[] = [
  { name: '智慧工厂车间', url: '/models/chejian3.glb' },
  { name: 'CNC 车床', url: '/models/cnc.glb' },
  { name: '新型机床', url: '/models/newCnc5.glb' },
]