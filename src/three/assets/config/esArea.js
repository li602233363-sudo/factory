/** 用于计算的基础配置信息 */
const cfg = {
  deviceOffset: {
    hv35: getHV35Offset(),
    galaxy4g1: getGalaxy4gOffset(1),
    galaxy4g2: getGalaxy4gOffset(2),
    galaxy4g3: getGalaxy4gOffset(3),
    galaxy4g4: getGalaxy4gOffset(4),
  }, 
  cellOffsets: {
    x1: [ // 适用于: 一区|二区|三区
      -169.8, // -179.9 + 5.25 + 2.6 + 4.5/2 --- 最左侧柜子，相对原点的X偏移量 #X1
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X2
      21.7, // 4.5/2 + 2.6 + 2.25 + 9.75 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X3
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X4
      21.7, // 4.5/2 + 2.6 + 2.25 + 4.5 + 5.25 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X5
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X6
      21.7, // 4.5/2 + 2.6 + 2.25 + 9.75 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X7
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X8
      21.7, // 4.5/2 + 2.6 + 2.25 + 9.75 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X9
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X10
    ],
    x2: [ // 适用于: 四区|五区
      11.7, // 0 + 6.85 + 2.6 + 4.5/2 --- 最左侧柜子，相对原点的X偏移量 #X1
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X2
      21.7, // 4.5/2 + 2.6 + 2.25 + 9.75 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X3
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X4
      21.7, // 4.5/2 + 2.6 + 2.25 + 9.75 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X5
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X6
      21.7, // 4.5/2 + 2.6 + 2.25 + 4.5 + 5.25 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X7
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X8
      21.7, // 4.5/2 + 2.6 + 2.25 + 9.75 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X9
      14.2, // 4.5/2 + 2.6 + 4.5 + 2.6 + 4.5/2 --- 相对左侧柜子的X偏移量 #X10
    ],
  },
  regionOffsetY: [ // 每个region的两行cell在Y轴上的偏移量
    [ // 一区
      113.3, // 136.36 - 10.4 - 6.058 - 5.002 - 3.2/2
      67.98, // 90.64 - 10 - 6.058 - 5.002 - 3.2/2
    ],
    [ // 二区
      22.66, // 0 + 10 + 6.058 + 5.002 + 3.2/2
      -22.66, // 0 - 10 - 6.058 - 5.002 - 3.2/2
    ],
    [ // 三区
      -67.98, // -90.64 + 10 + 6.058 + 5.002 + 3.2/2
      -113.3, // -90.64 - 10 - 6.058 - 5.002 - 3.2/2
    ],
    [ // 四区
      22.66, // 0 + 10 + 6.058 + 5.002 + 3.2/2
      -22.66, // 0 - 10 - 6.058 - 5.002 - 3.2/2
    ],
    [ // 五区
      -67.98, // -90.64 + 10 + 6.058 + 5.002 + 3.2/2
      -113.3, // -90.64 - 10 - 6.058 - 5.002 - 3.2/2
    ],
  ],

  firewall: {
    size: {
      length: 8, 
      height: 4, 
      depth: 0.4
    },
    offset: [3.55, 0, 0],
  },
  hv35Size: [5.8, 3.2, 3.2],
  hv35PedestalSize: [6, 0.565, 3.4],
  galaxySize: [6.038, 2.896, 2.438],
  galaxyPedestalSize: [6.238, 0.565, 2.638],

}





/**
 * 获取指定编号的Galaxy在Cell中的位置偏移
 * @param {number} num - Galaxy在Cell中的位置编号
 * @returns 
 */
function getGalaxy4gOffset(num) {
  const dx = 3.55;
  const dy = 0;
  const dz = 9.631;

  if (num === 1) { return [-dx, dy, dz]; }
  if (num === 2) { return [dx, dy, dz]; }
  if (num === 3) { return [-dx, dy, -dz]; }
  if (num === 4) { return [dx, dy, -dz]; }
}


/**
 * 计算HV35在Cell内的坐标偏移
 * @returns 
 */
function getHV35Offset() {
  const dx = 0;
  const dy = 0;
  const dz = 0;
  return [dx, dy, dz];
}




/**
 * 获取区域信息列表
 * @returns 
 */
export function getRegionInfoList() {
  const infoList = Array.from([1,2,3,4,5]).map(regionNum => {
    return getRegionInfo(regionNum);
  })
  return infoList;
}


/**
 * 获取指定区域的设备信息
 * @param {number} regionNum - 区域编码 1-一区 | 2-二区 | 3-三区 | 4-四区 | 5-五区
 * @returns 
 */
function getRegionInfo(regionNum) {
  const info = {
    name: `region#${regionNum}`,
    cellList: [],
  }

  // 区域靠南侧的一排
  Array.from([1,2,3,4,5,6,7,8,9,10]).map(num => num + (2 * regionNum - 2) * 10).forEach((cellNum, idx) => {
    const cellInfo = {
      posNum: `#${cellNum}`,
      position: getCellPosition(regionNum, 0, idx),
      children: getCellChildren(cellNum),
    }
    info.cellList.push(cellInfo);
  });


  // 区域靠北侧的一排
  Array.from([1,2,3,4,5,6,7,8,9,10]).map(num => num + (2 * regionNum - 1) * 10).forEach((cellNum, idx) => {
    const cellInfo = {
      posNum: `#${cellNum}`,
      position: getCellPosition(regionNum, 1, idx),
      children: getCellChildren(cellNum),
    }
    info.cellList.push(cellInfo);
  });

  return info;
}


/**
 * 获取cell的位置信息
 * @param {number} regionNum 区域号码 1-一区 | 2-二区 | 3-三区 | 4-四区 | 5-五区
 * @param {number} rowNum 行号 - 由南向东北 - 从0开始 - 目前每个区域只有两行
 * @param {number} colNum 列号 - 由西向东 - 从0开始
 * @returns 
 */
function getCellPosition(regionNum, rowNum, colNum) {
  let x = 0;
  let y = 0;
  let z = 0;

  // 西侧的区域
  if ([1,2,3].includes(regionNum)) {
    const offcetList = cfg.cellOffsets.x1;
    for (let idx = 0; idx <= colNum; idx ++) {
      x += offcetList[idx];
    }
  }

  // 东侧的区域
  if ([4,5].includes(regionNum)) {
    const offcetList = cfg.cellOffsets.x2;
    for (let idx = 0; idx <= colNum; idx ++) {
      x += offcetList[idx];
    }
  }

  const zList = cfg.regionOffsetY[regionNum-1];
  z = zList[rowNum];

  return [x, y, z];
}




/**
 * 获取cell的子设备信息
 * @param {number} cellNum 最小单元的编号
 * @returns 
 */
function getCellChildren(cellNum) {
  const children = [];

  const hv35 = {
    name: `hv35#${cellNum}`,
    type: 'hv35',
    posNum: `#${cellNum}`,
    position: cfg.deviceOffset.hv35,
    size: cfg.hv35Size,
    pedestalSize: cfg.hv35PedestalSize,
  }
  children.push(hv35);

  const galaxy4g1 = {
    name: `galaxy#${cellNum}-1`,
    type: `galaxy4g`,
    posNum: `#${cellNum}-1`,
    position: cfg.deviceOffset.galaxy4g1,
    size: cfg.galaxySize,
    pedestalSize: cfg.galaxyPedestalSize,
    firewall: {
      isNeed: true,
      size: cfg.firewall.size,
      offset: cfg.firewall.offset,
    }
  }
  children.push(galaxy4g1);

  const galaxy4g2 = {
    name: `galaxy#${cellNum}-2`,
    type: `galaxy4g`,
    posNum: `#${cellNum}-2`,
    position: cfg.deviceOffset.galaxy4g2,
    size: cfg.galaxySize,
    pedestalSize: cfg.galaxyPedestalSize,
    firewall: {
      isNeed: ![70,80,90,100].includes(cellNum),
      size: cfg.firewall.size,
      offset: cfg.firewall.offset,
    }
  }
  children.push(galaxy4g2);

  const galaxy4g3 = {
    name: `galaxy#${cellNum}-3`,
    type: `galaxy4g`,
    posNum: `#${cellNum}-3`,
    position: cfg.deviceOffset.galaxy4g3,
    size: cfg.galaxySize,
    pedestalSize: cfg.galaxyPedestalSize,
    firewall: {
      isNeed: true,
      size: cfg.firewall.size,
      offset: cfg.firewall.offset,
    }
  }
  children.push(galaxy4g3);

  const galaxy4g4 = {
    name: `galaxy#${cellNum}-4`,
    type: `galaxy4g`,
    posNum: `#${cellNum}-4`,
    position: cfg.deviceOffset.galaxy4g4,
    size: cfg.galaxySize,
    pedestalSize: cfg.galaxyPedestalSize,
    firewall: {
      isNeed: ![70,80,90,100].includes(cellNum),
      size: cfg.firewall.size,
      offset: cfg.firewall.offset,
    }
  }
  children.push(galaxy4g4);

  return children;
}




