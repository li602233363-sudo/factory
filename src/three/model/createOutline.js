import * as THREE from 'three'
import { getStationGroundInfo } from '../assets/config/index.js'
import { loadTexture } from 'three-base-utils/loader';

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
    const imgUrl = new URL('/assets/imgs/gravel01.jpg', import.meta.url).href;

    const texture = loadTexture(imgUrl, (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.offset.set(0, 0);
    });

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