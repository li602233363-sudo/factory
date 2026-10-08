import * as THREE from 'three'
import { toVector3, type Vector3Like } from './init'

export interface AmbientLightOptions {
  /** 灯光颜色，默认白色 */
  color?: THREE.ColorRepresentation
  /** 光照强度，默认 0.5 */
  intensity?: number
}

export interface DirectionalLightOptions {
  /** 灯光颜色，默认白色 */
  color?: THREE.ColorRepresentation
  /** 光照强度，默认 1.2 */
  intensity?: number
  /** 灯光位置，默认 (2, 3, 4) */
  position?: Vector3Like
}

/**
 * 创建环境光
 */
export function createAmbientLight(
  options: AmbientLightOptions = {},
): THREE.AmbientLight {
  const { color = 0xffffff, intensity = 0.5 } = options
  return new THREE.AmbientLight(color, intensity)
}

/**
 * 创建方向光
 */
export function createDirectionalLight(
  options: DirectionalLightOptions = {},
): THREE.DirectionalLight {
  const { color = 0xffffff, intensity = 1.2, position = [2, 3, 4] } = options

  const light = new THREE.DirectionalLight(color, intensity)
  light.position.copy(toVector3(position))
  return light
}
