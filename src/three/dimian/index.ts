import * as THREE from 'three'
import { getStationGroundInfo } from './assets/config/index.js'
import { loadTexture } from 'three-base-utils/loader';

/**
 * 地面贴图一格覆盖的世界尺寸
 * ShapeGeometry 的 uv 直接用世界坐标，因此 repeat 必须按“一格多少世界单位”换算
 * 40 表示 40×40 单位铺一张 640×640 的石子贴图
 */
const GROUND_TILE_SIZE = 40;

export class CreateCommunityOutline {
  constructor() {
    this.init();
  }
  init() {
    this.self = this.create();
  }
  create() {
    const shape = this.getGroundShape();
    const geometry = new THREE.ShapeGeometry(shape);
    const material = this.getGroundMaterial();
    const ground = new THREE.Mesh(geometry, material);
    ground.receiveShadow = true; // 地面接收阴影
    ground.name = '地面';
    ground.rotation.x = Math.PI / 2;
    return ground;
  }
  getGroundShape() {
    const info = {
      outline: [
        [-260, 0, -200],
        [260, 0, -200],
        [260, 0, 210],
        [-260, 0, 210],
      ],
      holes: [],
    }
    const cfgInfo = getStationGroundInfo(info);
    if (!(Array.isArray(cfgInfo?.outline) && cfgInfo.outline.length > 2)) { console.error(`创建厂区底面时，配置参数异常，请检查！`); return; }
    const outlineVertexs = cfgInfo.outline.map(p => new THREE.Vector2(p[0], p[2]));
    const shape = new THREE.Shape(outlineVertexs);
    // 挖孔
    if (Array.isArray(cfgInfo?.holes)) {
      cfgInfo.holes.forEach(pList => {
        if (!(Array.isArray(pList) && pList.length > 2)) { return; }
        const holeVertexs = pList.map(p => new THREE.Vector2(p[0], p[2]));
        // 计算孔路径
        const path = new THREE.Path();
        const sp = holeVertexs[0];
        const lastIdx = holeVertexs.length - 1;
        holeVertexs.forEach((p, idx) => {
          if (idx === 0) {
            path.moveTo(p.x, p.y);
          } else {
            if (idx === lastIdx) {
              path.lineTo(sp.x, sp.y);
            } else {
              path.lineTo(p.x, p.y);
            }
          }
        })
        // 设置孔路径
        shape.holes.push(path);
      });
    }
    return shape;
  }
  getGroundMaterial() {
    // public 目录下的静态资源由 Vite 直接以根路径提供，这里用 BASE_URL 拼接
    // 带 /public 前缀会变成 404，地面将退化成一块纯色
    const imgUrl = `${import.meta.env.BASE_URL}assets/imgs/gravel01.jpg`;

    const texture = loadTexture(imgUrl);

    // 以下参数要在图片加载完成（首次上传显存）之前设置好，之后修改还需要额外触发 needsUpdate
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    // 贴图按 sRGB 解读，否则颜色会发灰发白
    texture.colorSpace = THREE.SRGBColorSpace;
    // ShapeGeometry 生成的 uv 是世界坐标（本厂区跨度约 520 × 410），
    // 不做换算会重复几百次，最终被 mipmap 平均成一个纯色，看起来就像“贴图没生效”
    texture.repeat.set(1 / GROUND_TILE_SIZE, 1 / GROUND_TILE_SIZE);
    texture.offset.set(0, 0);
    // 地面是斜视角观察，开启各向异性过滤避免远处糊成一片（three 会按设备上限自动裁剪）
    texture.anisotropy = 16;

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    })
    material.polygonOffset = true;
    material.polygonOffsetFactor = -1;
    material.polygonOffsetUnits = -1;
    material.needsUpdate = true;

    return material;
  }
}