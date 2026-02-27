import { onMounted, onBeforeUnmount } from 'vue'
import type { Node } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { NodeType, type DeviceNodeData, type SystemNodeData } from '@/types/node'
import { ZIndexManager } from './useZIndexManager'

const DRAGGING_OPACITY = 0.7
const DRAGGING_SHADOW = {
  blur: 10,
  offsetX: 4,
  offsetY: 4,
  color: 'rgba(0, 0, 0, 0.3)',
}

const EMBEDDING_PREVIEW_STYLE = {
  stroke: '#1890ff',
  strokeWidth: 2,
  strokeDasharray: '5,5',
  fill: 'rgba(24, 144, 255, 0.1)',
}

export interface UseDragVisualOptions {
  opacity?: number
  shadow?: {
    blur: number
    offsetX: number
    offsetY: number
    color: string
  }
}

export function useDragVisual(options: UseDragVisualOptions = {}) {
  const graphStore = useGraphStore()

  const opacity = options.opacity ?? DRAGGING_OPACITY
  const shadow = options.shadow ?? DRAGGING_SHADOW

  const handleNodeMove = ({ node }: { node: Node }) => {
    const nodeData = node.getData<DeviceNodeData | SystemNodeData>()
    
    node.setAttrs({
      body: {
        opacity,
        filter: {
          name: 'dropShadow',
          args: shadow,
        },
      },
    })

    if (nodeData?.type === NodeType.DEVICE || nodeData?.type === NodeType.SYSTEM) {
      node.setZIndex(1000)
    }
  }

  const handleNodeMoved = ({ node }: { node: Node }) => {
    node.setAttrs({
      body: {
        opacity: 1,
        filter: null,
      },
    })

    const nodeData = node.getData<DeviceNodeData | SystemNodeData>()
    
    if (nodeData?.type === NodeType.DEVICE || nodeData?.type === NodeType.SYSTEM) {
      ZIndexManager.setNodeZIndex(node)
      
      if (nodeData?.type === NodeType.SYSTEM) {
        ZIndexManager.updateChildrenZIndex(node)
      }
      
      const parent = node.getParent()
      if (parent && parent.isNode && parent.isNode()) {
        ZIndexManager.updateChildrenZIndex(parent as Node)
      }
    }
  }

  const handleNodeEmbedding = ({ currentParent }: { node: Node; currentParent: Node | null }) => {
    if (currentParent) {
      currentParent.setAttrs({
        body: {
          stroke: EMBEDDING_PREVIEW_STYLE.stroke,
          strokeWidth: EMBEDDING_PREVIEW_STYLE.strokeWidth,
          strokeDasharray: EMBEDDING_PREVIEW_STYLE.strokeDasharray,
          fill: EMBEDDING_PREVIEW_STYLE.fill,
        },
      })
    }
  }

  const handleNodeEmbedded = ({ currentParent }: { node: Node; currentParent: Node | null }) => {
    if (currentParent) {
      currentParent.setAttrs({
        body: {
          stroke: null,
          strokeWidth: null,
          strokeDasharray: null,
          fill: null,
        },
      })
    }
  }

  const enable = () => {
    const graph = graphStore.graph
    if (!graph) return

    graph.on('node:move', handleNodeMove)
    graph.on('node:moved', handleNodeMoved)
    graph.on('node:embedding', handleNodeEmbedding)
    graph.on('node:embedded', handleNodeEmbedded)
  }

  const disable = () => {
    const graph = graphStore.graph
    if (!graph) return

    graph.off('node:move', handleNodeMove)
    graph.off('node:moved', handleNodeMoved)
    graph.off('node:embedding', handleNodeEmbedding)
    graph.off('node:embedded', handleNodeEmbedded)
  }

  onMounted(() => {
    if (graphStore.isInitialized) {
      enable()
    } else {
      const unwatch = graphStore.$subscribe((_mutation, state) => {
        if (state.isInitialized) {
          enable()
          unwatch()
        }
      })
    }
  })

  onBeforeUnmount(() => {
    disable()
  })

  return {
    enable,
    disable,
  }
}
