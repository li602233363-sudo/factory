# 智慧工厂 · 数字孪生系统

基于 **Vue 3 + TypeScript + Vite + Three.js + ECharts** 的智慧工厂数字孪生项目。

## 功能

- **3D 场景**：通过 Three.js 渲染 `public/models/chejian3.glb` 车间模型，支持拖拽旋转 / 滚轮缩放 / 右键平移（OrbitControls）
- **交互拾取**：点击场景中的设备可高亮并弹出设备信息浮层（模拟数据）；左侧「设备列表」点击可联动聚焦
- **数据可视化**：ECharts 面板展示产量趋势、设备状态分布、能耗趋势（模拟实时刷新）
- **科技风 UI**：深蓝青配色、半透明玻璃拟态面板、加载进度条

## 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | Vue 3.5（`<script setup>`）+ TypeScript |
| 构建 | Vite 8 |
| 三维 | Three.js 0.186（GLTFLoader + OrbitControls） |
| 图表 | ECharts 6 |
| 路由 | Vue Router 4 |
| 样式 | SCSS（`@` 别名指向 `src/`） |

## 目录结构

```
├─ public/models/          # GLB 模型（静态资源，不参与打包）
│  ├─ chejian3.glb         # 车间整体模型（约 130MB）
│  ├─ cnc.glb              # CNC 车床
│  └─ newCnc5.glb          # 新机床
└─ src/
   ├─ three/               # 3D 场景层
   │  ├─ SceneManager.ts   # 渲染器/相机/轨道控制/拾取/高亮/聚焦
   │  ├─ ModelLoader.ts    # GLB 加载 + 材质规范化 + 进度回调
   │  └─ types.ts          # 类型定义
   ├─ views/Dashboard.vue  # 主视图（3D + 数据面板布局）
   ├─ components/
   │  ├─ SceneCanvas.vue   # 3D 画布，封装场景生命周期
   │  ├─ LoadProgress.vue  # 模型加载进度条
   │  ├─ DeviceInfoPanel.vue # 设备信息浮层
   │  └─ charts/           # ECharts 封装与各图表
   └─ styles/              # 全局变量与样式
```

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 开发预览（http://localhost:5173）
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览构建产物
```

## 说明

- **130MB 车间模型**：始终经 `public/` URL 加载（不打包进 JS），首次加载较慢属正常，加载期间有进度条；请确保使用支持 WebGL 的浏览器。
- **所有设备/图表数据均为模拟数据**，后续可在此结构上对接真实 MES / SCADA 接口。
- 配置了路径别名 `@ -> src/`（vite.config.ts 与 tsconfig.app.json 均已设置）。