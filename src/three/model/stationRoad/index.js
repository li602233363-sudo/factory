/**
 * StationRoad —— 站内道路模型
 *
 * 职责：根据配置数据生成厂区内部道路的两部分网格，并统一挂在 this.self（THREE.Group）下：
 *  1. 路面（roadGround）：按「外轮廓 + 镂空孔洞」挤出的薄板，外部传入材质；
 *  2. 路沿（crub）：沿每段路径挤出侧截面生成的长条道牙，自带 curb01.png 纹理。
 *
 * 数据来源：../../assets/config（道路轮廓 / 孔洞 / 路沿路径均为写死的模拟坐标，
 *   配置文件 stationRoad.js 中以 pathInfo（point 直点 / corner 圆角）描述）。
 * 几何生成：three-base-utils/factory 的 GroundFactory（轮廓挤出）与 CrubFactory（沿路沿路径挤出）。
 *
 * 用法：
 *   const road = new StationRoad({ renderer, roadMaterial });
 *   container.add(road.self);
 */

import * as THREE from 'three';
import { CrubFactory, GroundFactory } from 'three-base-utils/factory';
import { getRoadGroundInfo, getCrubInfoList, drawPoints } from '../../assets/config/index.js';



export class StationRoad {
  /**
   * @param {Object} options
   * @param {THREE.WebGLRenderer} options.renderer 渲染器（预留，当前内部未实际使用）
   * @param {THREE.Material} options.roadMaterial 路面材质，由外部创建后注入
   */
  constructor({renderer, roadMaterial}) {
    this.renderer = renderer;
    this.roadMaterial = roadMaterial;
    // 道路所有网格的统一容器，外部只需把 road.self 加入场景
    this.self = new THREE.Group();
    this.crubFactory = new CrubFactory();
    this.roadFactory = new GroundFactory();

    this.init();
  }


  /**
   * 组装道路：先建路沿，再建路面。
   */
  init() {
    // 调试遗留：drawPoints() 生成路沿路径的红色点云（取自 S 形测试路径），
    // 此处仅抬高了它的 y，从未 add 进 this.self，实际不会出现在场景中。
    const points = drawPoints();
    points.position.y += 0.36;


    this.initCrub();
    this.initRoadGround();
  }





  /**
   * 初始化站内道路路面
   */
  initRoadGround() {
    this.createRoadGround();
  }


  /**
   * 初始化站内路沿：读取全部路沿配置，逐段挤出成网格。
   * 每段配置至少包含 2 个路径顶点，否则无法构成延伸路径，跳过。
   */
  initCrub() {
    const crubInfoList = getCrubInfoList();
    if (Array.isArray(crubInfoList)) {
      crubInfoList.forEach(cfg => {
        if (Array.isArray(cfg.vertexes) && cfg.vertexes.length > 1) {
          this.createCrub(cfg.vertexes);
        }
      })
    }
  }


  /**
   * 创建道路路面
   * 按外轮廓与镂空孔洞挤出指定厚度的薄板（ExtrudeGeometry），使用注入的路面材质。
   */
  createRoadGround() {
    const roadCfg = getRoadGroundInfo();
    // outline 外轮廓顶点、depth 板厚、holes 镂空区域（不铺设路面的地块）
    const geometry = this.roadFactory.createGemotryByVertexes(roadCfg.outline, roadCfg.depth, roadCfg.holes);
    const roadGround = this.roadFactory.createGround(geometry, this.roadMaterial);
    roadGround.receiveShadow = true; // 地面接收阴影
    roadGround.name = '路面';
    roadGround.position.y += 0.15; // 略微抬高，避免与 y=0 的地面共面产生 z-fighting
    this.self.add(roadGround);
  }



  /**
   * 创建路沿对象
   * 沿 pathVertexes 组成的路径挤出默认侧截面，得到一段长条道牙网格。
   * @param {THREE.Vector3[]} pathVertexes 路沿延伸方向的路径顶点
   * @returns {THREE.Mesh} 生成的路沿网格
   */
  createCrub(pathVertexes) {
    const geometry = this.crubFactory.createGemotryByVertexes(pathVertexes);
    // 道牙纹理：public 目录资源直接以 /assets/... 访问（不要带 /public 前缀）
    const imgUrl = new URL('/assets/imgs/curb01.png', import.meta.url).href;
    const material = this.crubFactory.createDefaultMaterial({imgUrl, repeat:[10,10]});
    const crubMesh = this.crubFactory.createCrub(geometry, material);
    this.self.add(crubMesh);
    return crubMesh;
  }
}


