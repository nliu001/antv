import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Node, Graph } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { NodeType, type SystemNodeData, type DeviceNodeData } from '@/types/node'
import { DEFAULT_EXPAND_CONFIG } from '@/config/containerConfig'

interface OriginalSize {
  width: number
  height: number
}

export interface UseEmbeddingPreviewOptions {
  padding?: number
}

export function useEmbeddingPreview(options: UseEmbeddingPreviewOptions = {}) {
  const graphStore = useGraphStore()
  
  // 使用统一配置的 padding，与 useAutoExpand 保持一致
  const padding = options.padding ?? DEFAULT_EXPAND_CONFIG.padding
  
  const originalSizes = new Map<string, OriginalSize>()
  const previewingParentId = ref<string | null>(null)

  const getGraph = (): Graph | null => {
    const graph = graphStore.graph
    if (!graph) return null
    return graph as Graph
  }

  const calculateRequiredSize = (childBBox: { width: number; height: number }): { width: number; height: number } => {
    const requiredWidth = Math.max(
      DEFAULT_EXPAND_CONFIG.minWidth,
      childBBox.width + padding * 2
    )
    
    const requiredHeight = Math.max(
      DEFAULT_EXPAND_CONFIG.minHeight,
      childBBox.height + padding * 2
    )
    
    return { width: requiredWidth, height: requiredHeight }
  }

  const expandParentPreview = (parent: Node, requiredSize: { width: number; height: number }) => {
    if (!originalSizes.has(parent.id)) {
      const currentSize = parent.getSize()
      originalSizes.set(parent.id, {
        width: currentSize.width,
        height: currentSize.height
      })
    }

    parent.resize(requiredSize.width, requiredSize.height)
    previewingParentId.value = parent.id
  }

  const restoreParentSize = (parent: Node) => {
    const originalSize = originalSizes.get(parent.id)
    if (originalSize) {
      parent.resize(originalSize.width, originalSize.height)
      originalSizes.delete(parent.id)
    }
    if (previewingParentId.value === parent.id) {
      previewingParentId.value = null
    }
  }

  const restoreAllPreviews = () => {
    const graph = getGraph()
    if (!graph) return

    originalSizes.forEach((_, parentId) => {
      const parent = graph.getCellById(parentId) as Node
      if (parent) {
        restoreParentSize(parent)
      }
    })
    originalSizes.clear()
    previewingParentId.value = null
  }

  const handleNodeMoving = ({ node }: { node: Node }) => {
    const nodeData = node.getData<DeviceNodeData | SystemNodeData>()
    
    if (nodeData?.type !== NodeType.DEVICE && nodeData?.type !== NodeType.SYSTEM) {
      return
    }

    const graph = getGraph()
    if (!graph) return

    const childBBox = node.getBBox()

    const allNodes = graph.getNodes()
    const emptyContainers = allNodes.filter(n => {
      const data = n.getData<SystemNodeData>()
      const isSystem = data?.type === NodeType.SYSTEM
      const children = n.getChildren()
      const isEmpty = !children || children.length === 0
      const isNotSelf = n.id !== node.id
      
      return isSystem && isEmpty && isNotSelf
    })

    if (emptyContainers.length === 0) return

    let foundTarget = false

    for (const container of emptyContainers) {
      const containerBBox = container.getBBox()
      
      const parentRight = containerBBox.x + containerBBox.width
      const parentBottom = containerBBox.y + containerBBox.height
      const childRight = childBBox.x + childBBox.width
      const childBottom = childBBox.y + childBBox.height
      
      const hasIntersection = !(
        childBBox.x > parentRight ||
        childRight < containerBBox.x ||
        childBBox.y > parentBottom ||
        childBottom < containerBBox.y
      )
      
      if (hasIntersection) {
        foundTarget = true
        const requiredSize = calculateRequiredSize(childBBox)
        const currentSize = container.getSize()

        if (requiredSize.width > currentSize.width || requiredSize.height > currentSize.height) {
          expandParentPreview(container, requiredSize)
        }
        break
      }
    }

    if (!foundTarget && previewingParentId.value) {
      const graph = getGraph()
      if (graph) {
        const parent = graph.getCellById(previewingParentId.value) as Node
        if (parent) {
          restoreParentSize(parent)
        }
      }
    }
  }

  const handleNodeMoved = () => {
    setTimeout(() => {
      restoreAllPreviews()
    }, 100)
  }

  const handleNodeEmbedded = ({ currentParent }: { node: Node; currentParent: Node | null }) => {
    if (currentParent && originalSizes.has(currentParent.id)) {
      originalSizes.delete(currentParent.id)
    }
    previewingParentId.value = null
  }

  const enable = () => {
    const graph = getGraph()
    if (!graph) return

    graph.on('node:moving', handleNodeMoving)
    graph.on('node:moved', handleNodeMoved)
    graph.on('node:embedded', handleNodeEmbedded)
  }

  const disable = () => {
    const graph = getGraph()
    if (!graph) return

    graph.off('node:moving', handleNodeMoving)
    graph.off('node:moved', handleNodeMoved)
    graph.off('node:embedded', handleNodeEmbedded)

    restoreAllPreviews()
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
    previewingParentId,
    enable,
    disable
  }
}
