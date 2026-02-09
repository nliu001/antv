/**
 * Graph 初始化配置
 * @description 提供 AntV X6 画布的默认配置
 */

import type { Graph } from '@antv/x6'

/**
 * 创建 Graph 配置
 * @param container - 挂载的 DOM 容器
 * @param options - 可选配置项
 * @returns Graph 配置对象
 */
export function createGraphConfig(
  container: HTMLElement,
  options?: {
    width?: number | string
    height?: number | string
    showGrid?: boolean
    enableSnapline?: boolean
  }
): Graph.Options {
  const {
    width = '100%',
    height = '100%',
    showGrid = true,
    enableSnapline = true
  } = options || {}

  return {
    container,
    width,
    height,
    autoResize: true,

    // 背景配置
    background: {
      color: '#F5F5F5'
    },

    // 网格配置
    grid: showGrid
      ? {
          size: 10, // 10px 步长
          visible: true, // 显示网格
          type: 'mesh', // 线状网格（更适合拓扑图场景）
          args: {
            color: '#D0D0D0', // 网格线颜色
            thickness: 1 // 网格线宽度
          }
        }
      : false,

    // 对齐线配置（X6 3.x 内置支持）
    snapline: enableSnapline
      ? {
          enabled: true,
          sharp: false, // 禁用磁吸（避免与网格冲突）
          tolerance: 10, // 对齐线显示距离
          className: 'my-snapline'
        }
      : false,

    // 缩放配置
    mousewheel: {
      enabled: true,
      modifiers: ['ctrl', 'meta'], // Ctrl + 滚轮（Mac 用 Cmd）
      minScale: 0.2, // 最小 20%
      maxScale: 3, // 最大 300%
      factor: 1.1 // 每次缩放 10%
    },

    // 平移配置
    panning: {
      enabled: true
      // 不设置 modifiers，允许空白区域直接拖拽
    },

    // 连接桩配置（暂不启用，后续步骤使用）
    connecting: {
      snap: true,
      allowBlank: false,
      allowLoop: false,
      allowNode: false
    },

    // 高亮配置
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#5F95FF',
            stroke: '#5F95FF'
          }
        }
      }
    },

    // 交互配置
    interacting: {
      nodeMovable: true, // 节点可移动（后续步骤启用）
      edgeMovable: false, // 边不可移动
      edgeLabelMovable: false // 边标签不可移动
    }
  }
}

/**
 * 默认配置
 */
export const defaultGraphConfig = {
  width: '100%',
  height: '100%',
  showGrid: true,
  enableSnapline: true
}
