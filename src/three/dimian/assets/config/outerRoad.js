import * as THREE from 'three';
import { getCornerPathVertexes } from "three-base-utils/math/vertex";


const r1 = 22;
const r2 = 1.0;
const road_w = 6.0;
const center_x = 92.0
const center_z = 140.24 - 0.2;
const W = 36.0;
const H = 10.36;




/**
 * 获取站内的道路信息
 * @returns 
 */
export function getOuterRoadGroundInfo() {
  const info = {
    outline: [],
    holes: [],
    depth: 0.25,
  }

  // 外轮廓
  const outlinePart1 = getOuterCrubCfg_left();
  info.outline.push(...outlinePart1.vertexes)
  const outlinePart2 = getOuterCrubCfg_right();
  info.outline.push(...outlinePart2.vertexes.reverse());

  // 挖孔
  [].forEach(fn => {
    const hole = fn();
    info.holes.push(hole.vertexes);
  })

  return info;
}



/**
 * 获取站内的路沿信息
 * @returns 
 */
export function getOuterCrubInfoList() {
  const crubInfoList = [];

  [
    getOuterCrubCfg_left,
    getOuterCrubCfg_right,
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
function getOuterCrubCfg_left() {
  const cfg = {
    name: '路沿ai',
    id: 'crub-a-i',
    pathInfo: [],
    vertexes: [],
  }

  cfg.pathInfo = [
    {
      type: 'point',
      name: 'l1',
      position: [center_x - W/2, 0, center_z],
    },
    {
      type: 'point',
      name: 'l1-1',
      position: [center_x - W/2, 0 , center_z + 0.2],
    },
    {
      type: 'corner',
      name: 'l2',
      position: [center_x - W/2, 0, center_z + H],
      r: r2,
      deg: -90,
    },
    {
      type: 'corner',
      name: 'l3',
      position: [center_x - road_w/2, 0, center_z + H],
      r: r2,
      deg: 90,
    },
    {
      type: 'corner',
      name: 'l4',
      position: [center_x - road_w/2, 0, center_z + H + 40],
      r: r2,
      deg: -90,
    },
    {
      type: 'point',
      name: 'l5',
      position: [center_x - road_w/2 + 234.4, 0, center_z + H + 40],
    },
  ]


  cfg.vertexes = getVertexesFromPathInfoList(cfg.pathInfo);
  return cfg;
}


function getOuterCrubCfg_right() {
  const cfg = {
    name: '路沿jl',
    id: 'crub-j-l',
    pathInfo: [],
    vertexes: [],
  }

  cfg.pathInfo = [
    {
      type: 'point',
      name: 'r1',
      position: [center_x + W/2, 0, center_z],
    },
    {
      type: 'point',
      name: 'r1-1',
      position: [center_x + W/2, 0, center_z],
    },
    {
      type: 'corner',
      name: 'r2',
      position: [center_x + W/2, 0, center_z + H],
      r: r2,
      deg: 90,
    },
    {
      type: 'corner',
      name: 'r3',
      position: [center_x + road_w/2, 0, center_z + H],
      r: r2,
      deg: -90,
    },
    {
      type: 'corner',
      name: 'r4',
      position: [center_x + road_w/2, 0, center_z + H + 40 - road_w],
      r: r1,
      deg: -90,
    },
    {
      type: 'point',
      name: 'r5',
      position: [center_x + road_w/2 + 234.4 - 1.45 - road_w, 0, center_z + H + 40 - road_w],
    },
  ]

  cfg.vertexes = getVertexesFromPathInfoList(cfg.pathInfo);
  return cfg;
}












