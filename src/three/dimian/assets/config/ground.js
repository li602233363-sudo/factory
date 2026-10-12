import { getRoadGroundInfo } from './index.js';


export function getBaseGroundInfo() {
  const info = {
    radius: 4000,
    holes: [],
  }
  const stationGround = getStationGroundInfo();
  info.holes.push(stationGround.outline);

  return info;
  
}


export function getStationGroundInfo(info) {
  // 厂区底面轮廓点
  // const info = {
  //   outline: [
  //     [-260, 0, -210],
  //     [260, 0, -210],
  //     [260, 0, 210],
  //     [-260, 0, 210],
  //   ],
  //   holes: [],
  // }

  const roadInfo = getRoadGroundInfo();
  if (Array.isArray(roadInfo.outline) && roadInfo.outline.length > 2) {
    const hole = [];
    roadInfo.outline.forEach(it => {
      if (Array.isArray(it) && it.length === 3 && it[2] <= 140.36) {
        hole.push(it);
      }
      if (it.isVector3 && it.z <= 140.36) {
        hole.push(it.toArray());
      }
    })
    // info.holes.push(hole);
  }

  return info;
}

