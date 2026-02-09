/**
 * Graph 相关类型定义
 * @description 定义画布、节点、状态等核心类型
 */

import type { Graph } from '@antv/x6'

/**
 * Graph 状态接口
 */
export interface GraphState {
  // Graph 实例（使用 markRaw 包裹，避免响应式追踪）
  graph: Graph | null

  // 初始化状态
  isInitialized: boolean
  isLoading: boolean
  error: Error | null

  // 画布缩放比例
  zoom: number

  // 画布中心点坐标
  centerPoint: {
    x: number
    y: number
  }

  // 交互状态
  isInteracting: boolean
  isPanning: boolean
  isZooming: boolean
}

/**
 * Graph 配置选项接口
 */
export interface GraphOptions {
  // 容器 DOM 元素
  container: HTMLElement

  // 画布尺寸
  width?: number | string
  height?: number | string

  // 是否显示网格
  showGrid?: boolean

  // 是否启用对齐线
  enableSnapline?: boolean
}

/**
 * 工具栏位置类型
 */
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * 工具栏配置接口
 */
export interface ToolbarProps {
  // 工具栏位置
  position?: ToolbarPosition

  // 是否显示缩放比例文本
  showZoomText?: boolean
}
