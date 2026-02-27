# AntV X6 拓扑设计器

## 一、项目概述

基于 Vue 3 + TypeScript + AntV X6 构建的拓扑图设计器，支持设备节点和系统容器的可视化编辑、拖拽布局、自动扩容和数据持久化。

**技术栈：**
- Vue 3 (Composition API)
- TypeScript
- AntV X6 (图编辑引擎)
- Pinia (状态管理)
- Element Plus (UI 组件)
- Vite (构建工具)

## 二、核心功能

### 1. 节点类型

| 类型 | 说明 | 组件 |
|------|------|------|
| 设备节点 | 路由器、交换机、服务器、防火墙、存储设备 | `DeviceNode.vue` |
| 系统容器 | 网络区域、数据中心、云区域（可嵌套子节点） | `SystemContainer.vue` |

### 2. 交互功能

| 功能 | 操作方式 | 实现模块 |
|------|----------|----------|
| 拖拽放置 | 从左侧物料面板拖拽到画布 | `useDnd.ts` |
| 快速放置 | 点击物料 → 画布点击放置 | `useQuickPlacement.ts` |
| 画布平移 | Space + 鼠标拖拽 | `useSpacePan.ts` |
| 画布缩放 | Ctrl + 滚轮 / 工具栏按钮 | `useGraph.ts` |
| 节点出组 | Ctrl + 拖拽节点离开容器 | `useNodeOutGroup.ts` |
| 框选多选 | 鼠标拖拽框选 | `usePlugins.ts` |
| 撤销重做 | Ctrl+Z / Ctrl+Y | `usePlugins.ts` |
| 复制粘贴 | Ctrl+C / Ctrl+V / Ctrl+X | `usePlugins.ts` |

### 3. 容器自动扩容

- 子节点移动/调整大小时，容器自动扩展
- 拖拽节点到空容器上方时，预览扩容效果
- 支持配置最小尺寸、内边距、节流延迟

### 4. 对齐与分布

| 功能 | 说明 |
|------|------|
| 左/中/右对齐 | 多节点水平对齐 |
| 顶/中/底对齐 | 多节点垂直对齐 |
| 水平等距分布 | 多节点水平间距相等 |
| 垂直等距分布 | 多节点垂直间距相等 |

### 5. 导出功能

支持导出为 PNG、JPEG、SVG 格式图片。

### 6. 画布锁定

锁定后禁止编辑操作，但允许选择和查看。

## 三、API 接口

### 基础路径

```
BASE_URL: /api
```

### 接口列表

#### 1. 画布 API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/graph/list` | 获取画布列表 | `page`, `pageSize` |
| GET | `/graph/:id` | 获取画布详情 | `id` |
| POST | `/graph/save` | 保存画布 | `id?`, `name`, `description?`, `nodes`, `edges` |
| DELETE | `/graph/delete/:id` | 删除画布 | `id` |

#### 2. 节点 API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | `/node/save` | 保存节点（新增/更新） | `graphId`, `id?`, `type`, `x`, `y`, `width`, `height`, `label`, `data?`, `parentId?` |
| PUT | `/node/update` | 更新节点属性 | `id`, `graphId`, `x?`, `y?`, `width?`, `height?`, `label?`, `data?`, `parentId?` |
| DELETE | `/node/delete/:id` | 删除节点 | `id`, `graphId` (query) |

#### 3. 模板 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/templates/devices` | 获取设备模板列表 |
| GET | `/templates/systems` | 获取系统容器模板列表 |

### 请求/响应格式

```typescript
// 通用响应格式
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 保存画布参数
interface SaveGraphParams {
  id?: string
  name: string
  description?: string
  nodes: NodeData[]
  edges: EdgeData[]
}

// 保存节点参数
interface SaveNodeParams {
  graphId: string
  id?: string
  type: 'device' | 'system'
  x: number
  y: number
  width: number
  height: number
  label: string
  data?: Record<string, any>
  parentId?: string
}
```

## 四、数据同步机制

### 自动同步事件

| 事件 | 触发时机 | API 调用 |
|------|----------|----------|
| `node:added` | 节点添加到画布 | `POST /node/save` |
| `node:moved` | 节点移动结束 | `PUT /node/update` |
| `node:resized` | 节点调整大小结束 | `PUT /node/update` |
| `node:removed` | 节点删除 | `DELETE /node/delete/:id` |

### 首次放置流程

1. 检查是否存在 `currentGraphId`
2. 不存在则先调用 `POST /graph/save` 创建空画布
3. 再调用 `POST /node/save` 保存节点

## 五、项目结构

```
src/
├── composables/              # 组合式函数（核心逻辑）
│   ├── useGraph.ts           # 画布管理
│   ├── useDnd.ts             # 拖拽功能
│   ├── useGraphPersistence.ts # 数据持久化
│   ├── useAutoExpand.ts      # 容器自动扩容
│   ├── useAlignment.ts       # 对齐分布
│   ├── usePlugins.ts         # 插件管理
│   └── ...
├── components/
│   ├── canvas/               # 画布组件
│   │   ├── GraphCanvas.vue   # 主画布
│   │   ├── Toolbar.vue       # 工具栏
│   │   └── Stencil.vue       # 物料面板
│   ├── nodes/                # 节点组件
│   │   ├── DeviceNode.vue    # 设备节点
│   │   └── SystemContainer.vue # 系统容器
│   └── common/               # 通用组件
├── services/api.ts           # API 服务
├── stores/graphStore.ts      # 状态管理
├── types/                    # 类型定义
│   ├── api.ts               # API 类型
│   ├── node.ts              # 节点类型
│   └── graph.ts             # 画布类型
├── utils/                    # 工具函数
│   ├── graphConfig.ts       # Graph 配置
│   ├── nodeFactory.ts       # 节点工厂
│   ├── coordinateTransform.ts # 坐标转换
│   └── request.ts           # HTTP 请求
├── config/                   # 配置文件
│   ├── nodeConfig.ts        # 节点配置
│   └── containerConfig.ts   # 容器配置
└── constants/                # 常量定义
    ├── stencil.ts           # 物料配置
    └── drag.ts              # 拖拽常量
```

## 六、快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 七、集成指南

### 1. 基础使用

```vue
<template>
  <div class="designer">
    <Stencil @item-drag-start="handleDragStart" />
    <GraphCanvas @graph-ready="handleGraphReady" />
    <Toolbar @save-graph="handleSave" />
  </div>
</template>

<script setup lang="ts">
import { useDnd, useGraphPersistence } from '@/composables'

const { startDrag } = useDnd()
const { saveGraph, currentGraphId } = useGraphPersistence()

const handleDragStart = (config, event) => {
  startDrag(config, event)
}

const handleSave = async () => {
  await saveGraph('My Topology')
}
</script>
```

### 2. 后端对接

实现以上 API 接口，返回符合 `ApiResponse<T>` 格式的数据即可。Mock 服务示例见 `mock/graph.ts`。

## 八、注意事项

1. **节点 ID**：前端使用 `nanoid()` 生成，保存时传递给后端
2. **画布 ID**：首次保存时由后端生成，前端缓存到 `currentGraphId`
3. **层级管理**：容器 zIndex 较低（10），设备节点 zIndex 较高（20）
4. **状态同步**：节点操作会自动触发 API 调用，无需手动调用

## 九、浏览器兼容性

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

## 许可证

MIT License
