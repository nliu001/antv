import type { Node } from '@antv/x6'
import type { GraphManual } from '@antv/x6/lib/graph/options'
import type { CellView } from '@antv/x6'
import { NodeType, type DeviceNodeData, type SystemNodeData } from '@/types/node'

export const EMBEDDING_HIGHLIGHT_STYLE = {
  padding: 4,
  attrs: {
    'stroke-width': 3,
    stroke: '#1890ff',
  },
}

export interface GraphConfigOptions {
  width?: number
  height?: number
  showGrid?: boolean
}

export function createGraphConfig(
  container: HTMLElement,
  options?: GraphConfigOptions
): GraphManual {
  const {
    width,
    height,
    showGrid = true
  } = options || {}

  const config: GraphManual = {
    container,
    autoResize: true,

    background: {
      color: '#F5F5F5'
    },

    grid: showGrid
      ? {
          size: 10,
          visible: true,
          type: 'mesh',
          args: {
            color: '#D0D0D0',
            thickness: 1
          }
        }
      : false,

    mousewheel: {
      enabled: true,
      modifiers: ['ctrl', 'meta'],
      minScale: 0.2,
      maxScale: 3,
      factor: 1.1,
      zoomAtMousePosition: true,
    },

    panning: {
      enabled: true
    },

    connecting: {
      snap: true,
      allowBlank: false,
      allowLoop: false,
      allowNode: false
    },

    embedding: {
      enabled: true,
      findParent: 'bbox',
      frontOnly: false,
      validate: ({ child, parent }: { child: Node; parent: Node }) => {
        const childData = child.getData<DeviceNodeData | SystemNodeData>()
        const parentData = parent.getData<SystemNodeData>()
        
        // 父节点必须是系统容器
        if (parentData?.type !== NodeType.SYSTEM) {
          return false
        }
        
        // 子节点可以是设备节点或系统容器（支持嵌套）
        const isValid = childData?.type === NodeType.DEVICE || childData?.type === NodeType.SYSTEM
        
        // 防止自己嵌入自己
        if (child.id === parent.id) {
          return false
        }
        
        return isValid
      },
    },

    highlighting: {
      embedding: {
        name: 'stroke',
        args: EMBEDDING_HIGHLIGHT_STYLE,
      },
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

    interacting: (cellView: CellView) => {
      const node = cellView.cell
      const nodeData = node.getData()
      if (nodeData?._locked) {
        return {
          nodeMovable: false,
          magnetConnectable: false,
          edgeMovable: false,
          edgeLabelMovable: false,
          arrowheadMovable: false,
          vertexMovable: false,
          vertexAddable: false,
          vertexDeletable: false,
        }
      }
      return {
        nodeMovable: true,
        magnetConnectable: true,
        edgeMovable: false,
        edgeLabelMovable: false,
      }
    }
  }

  if (width !== undefined) {
    config.width = width
  }
  if (height !== undefined) {
    config.height = height
  }

  return config
}

export const defaultGraphConfig: GraphConfigOptions = {
  showGrid: true
}
