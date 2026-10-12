
export function getWallInfoList() {
  const infoList = [
    {
      name: 'AB', // 外侧围墙法向量 ⊥ [A -> B] 向左。
      height: 3,
      depth: 0.4,
      sp: [84.5, 0, 140.36],
      ep: [-183.4, 0, 140.36],
    },
    {
      name: 'BC', 
      height: 3,
      depth: 0.4,
      sp: [-183.4, 0, 140.36],
      ep: [-183.4, 0, -139.96],
    },
    {
      name: 'CD', 
      height: 3,
      depth: 0.4,
      sp: [-183.4, 0, -139.96],
      ep: [183.1, 0, -139.96],
    },
    {
      name: 'DE', 
      height: 3,
      depth: 0.4,
      sp: [183.1, 0, -139.96],
      ep: [183.1, 0, 140.36],
    },
    {
      name: 'EF', 
      height: 3,
      depth: 0.4,
      sp: [183.1, 0, 140.36],
      ep: [99.5, 0, 140.36],
    },
  ]

  return infoList;
}

