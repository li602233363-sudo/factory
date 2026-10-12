import * as THREE from 'three';
import { getCornerPathVertexes } from "three-base-utils/math/vertex";


const r1 = 8;
const r2 = 1.0;


export function drawPoints() {
  const info = getCrubCfg_wrapper_a_i();
  const points = info.vertexes;

  // 1. 把点坐标打平为 Float32Array
  const positions = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    positions[i * 3 + 0] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  });

  // 2. 创建几何体并设置 position attribute
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xff0000, // 点的颜色
    size: 0.2,       // 点在视图中的大小（根据场景单位调整）
    sizeAttenuation: true
  });
  
  // 使用 Points 来渲染一组点
  const pointsMesh = new THREE.Points(geometry, material);
  // scene.add(pointsMesh);

  return pointsMesh;
}

export function testPath() {
  const path = new THREE.CurvePath();
  const info = getCrubCfg_wrapper_a_i();
  const lp = new THREE.Vector3();
  info.pathInfo.forEach((it, idx, list) => {
    if (it.type === 'point' && idx > 0) {
      if (idx === 0) {
        lp.copy(new THREE.Vector3().fromArray(it.position));
      }
      const p = new THREE.Vector3().fromArray(it.position);
      const childPath = new THREE.LineCurve3(lp, p);
      path.add(childPath);
      lp.copy(p);
    }
    if (it.type === 'corner' && idx > 0) {
      const corner = {
        position: it.position,
        sp: list[idx - 1].position,
        ep: list[idx + 1].position,
        deg: it.deg,
        r: it.r,
      }
      const cornerVertexes = getCornerPathVertexes(corner);
      
      const p1 = cornerVertexes.pop();
      cornerVertexes.push(p1);
      cornerVertexes.push(p1);
      const p2 = cornerVertexes.shift();
      cornerVertexes.unshift(p2);
      cornerVertexes.unshift(p2);

      const childPath = new THREE.CatmullRomCurve3(cornerVertexes);
      path.add(childPath);
      lp.copy(cornerVertexes[cornerVertexes.length - 1]);
    }
  })
  
  return path;

}
// testPath()
// --------------------------------------------------------------------












/**
 * 获取站内的道路信息
 * @returns 
 */
export function getRoadGroundInfo() {
  const info = {
    outline: [],
    holes: [],
    depth: 0.25,
  }

  // 外轮廓
  const outlinePart = getCrubCfg_wrapper();
  info.outline.push(...outlinePart.vertexes);

  // 挖孔
  [
    getCrubCfg_area_A,
    getCrubCfg_area_B,
  ].forEach(fn => {
    const hole = fn();
    info.holes.push(hole.vertexes);
  })

  return info;
}



/**
 * 获取站内的路沿信息
 * @returns 
 */
export function getCrubInfoList() {
  const crubInfoList = [];

  [
    getCrubCfg_area_A,
    getCrubCfg_area_B
  ].forEach(fn => {
    const crubCfgItem = fn();
    crubInfoList.push(crubCfgItem);
  })

  return crubInfoList;
}




/**
 * 根据路径信息计算路径形状点
 * >>> 注意: 首尾信息项-必须是point类型; 中间信息项-不做限制。
 * @param {Array} infoList - 路径信息列表 --- point|corner
 * @returns 
 */
function getVertexesFromPathInfoList(infoList) {
  if (!Array.isArray(infoList)) { return []; }

  const vertexes = [];
  const len = infoList.length;
  infoList.forEach((it, idx, list) => {
    if (it.type === 'point') { vertexes.push(new THREE.Vector3().fromArray(it.position)); }

    if (it.type === 'corner' && idx > 0 && idx < len - 1) {
      const corner = {
        position: it.position,
        sp: list[idx - 1].position,
        ep: list[idx + 1].position,
        deg: it.deg,
        r: it.r,
      }

      const cornerVertexes = getCornerPathVertexes(corner);

      vertexes.push(...cornerVertexes);
    }
  })

  return vertexes
}






// ------ [a~i------j~l] ------------------------------------------------
function getCrubCfg_wrapper() {
  const cfg = {
    name: '路沿ai',
    id: 'crub-a-i',
    pathInfo: [],
    vertexes: [],
  }

      // [-250, 0, 200],
  cfg.pathInfo = [
    {
      type: 'point',
      name: 'a',
      position: [-260, 0 , -200],
    },
    {
      type: 'point',
      name: 'b',
      position: [260, 0 , -200],
    },
    {
      type: 'point',
      name: 'c',
      position: [260, 0 , 210],
    },
    {
      type: 'point',
      name: 'e',
      position: [-260, 0 , 210],
    },
    {
      type: 'point',
      name: 'f',
      position: [-260, 0 , 210],
    },
  ]


  cfg.vertexes = getVertexesFromPathInfoList(cfg.pathInfo);
  return cfg;
}

function getCrubCfg_wrapper_a_i() {
  const cfg = {
    name: '路沿ai',
    id: 'crub-a-i',
    pathInfo: [],
    vertexes: [],
  }

  cfg.pathInfo = [
    {
      type: 'point',
      name: 'a',
      position: [-250, 0 , 0],
    },
    {
      type: 'corner',
      name: 'b',
      position: [-200, 0 , -60],
      r: r2,
      deg: -90,
    },
    {
      type: 'corner',
      name: 'c',
      position: [-150, 0 , -90],
      r: r1,
      deg: 90,
    },
    {
      type: 'corner',
      name: 'd',
      position: [-50, 0 , -20],
      r: r1,
      deg: 90,
    },
    {
      type: 'corner',
      name: 'e',
      position: [0, 0 , 0],
      r: r1,
      deg: 90,
    },
    {
      type: 'corner',
      name: 'f',
      position: [100, 0 , 50],
      r: r2,
      deg: 90,
    },
    {
      type: 'point',
      name: 'i',
      position: [250, 0 , 0],
    },
  ]


  cfg.vertexes = getVertexesFromPathInfoList(cfg.pathInfo);
  return cfg;
}


// ------ [A-B-C-D] ------------------------------------------------
function getCrubCfg_area_A() {
  const cfg = {
    name: '路沿A',
    id: 'crub-area-A',
    pathInfo: [],
    vertexes: [],
  }

  cfg.pathInfo = [
    {
      type: 'point',
      name: 'sp',
      position: [-250, 0 , -200],
    },
    {
      type: 'corner',
      name: 'r-t',
      position: [250, 0 , -200],
      r: r1,
      deg: 90,
    },
    {
      type: 'corner',
      name: 'r-b',
      position: [250, 0 , -10],
      r: r1,
      deg: 90,
    },
    {
      type: 'corner',
      name: 'r-l',
      position: [-250, 0 , -10],
      r: r1,
      deg: 90,
    },
    {
      type: 'point',
      name: 'ep',
      position: [-250, 0 , -190],
    },
  ]

  cfg.vertexes = getVertexesFromPathInfoList(cfg.pathInfo);
  return cfg;
}function getCrubCfg_area_B() {
  const cfg = {
    name: '路沿B',
    id: 'crub-area-B',
    pathInfo: [],
    vertexes: [],
  }

  cfg.pathInfo = [
    {
      type: 'point',
      name: 'sp',
      position: [-250, 0 , 10],
    },
    {
      type: 'corner',
      name: 'b-l-r',
      position: [250, 0 , 10],
      r: r1,
      deg: 90,
    },
    {
      type: 'corner',
      name: 'b-l-b',
      r: r1,
      position: [250, 0 , 210],
      deg: 90,
    },
    {
      type: 'corner',
      position: [-250, 0 , 210],
      name: 'b-l-l',
      r: r1,
      deg: 90,
    },
    {
      type: 'point',
      position: [-250, 0 , 10],
      name: 'ep',
    },
  ]

  cfg.vertexes = getVertexesFromPathInfoList(cfg.pathInfo);
  return cfg;
}