import type { Object3D } from 'three'

// 智慧工厂数字孪生 —— 共享类型定义

/** 加载进度回调数据 */
export interface LoadProgressData {
  /** 进度百分比 0-100 */
  percent: number
  /** 是否已完成 */
  done: boolean
  /** 正在加载的模型文件名 */
  name: string
}

/** 设备状态枚举 */
export type DeviceStatus = '运行' | '待机' | '检修' | '报警'

/** 设备信息（用于点击选中后展示） */
export interface EquipmentInfo {
  /** 设备名 */
  name: string
  /** 所属模型文件（可选） */
  model?: string
  /** 运行状态 */
  status: DeviceStatus
  /** 实时产量（件） */
  output: number
  /** 温度 ℃ */
  temperature: number
  /** 稼动率 % */
  utilization: number
  /** 报警数 */
  alarms: number
}

/** 场景点击选中事件载荷 */
export interface EquipmentPickEvent {
  info: EquipmentInfo
  /** 命中的 3D 对象（可在组件中用于相机聚焦） */
  target?: unknown
}

/** 主车间模型可拾取的场景根对象描述 */
export interface PickableObject {
  object: Object3D
  name: string
}