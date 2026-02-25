import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Node, Graph } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { NodeType, type SystemNodeData, type DeviceNodeData } from '@/types/node'

const OVERLAP_THRESHOLD = 0.3
const PREVIEW_PADDING = 40
const MIN_CONTAINER_SIZE = { width: 300, height: 200 }

interface OriginalSize {
  width: number
  height: number
}

export interface UseEmbeddingPreviewOptions {
  overlapThreshold?: number
  padding?: number
}

export function useEmbeddingPreview(options: UseEmbeddingPreviewOptions = {}) {
  const graphStore = useGraphStore()
  
  const overlapThreshold = options.overlapThreshold ?? OVERLAP_THRESHOLD
  const padding = options.padding ?? PREVIEW_PADDING
  
  const originalSizes = new Map<string, OriginalSize>()
  const previewingParent = ref<Node | null>(null)

  const getGraph = (): Graph | null => {
    const graph = graphStore.graph
    if (!graph) return null
    return graph as Graph
  }

  const isEmptyContainer = (node: Node): boolean => {
    const data = node.getData<SystemNodeData>()
    if (data?.type !== NodeType.SYSTEM) return false
    
    const children = node.getChildren()
    return !children || children.length === 0
  }

  const calculateOverlapRatio = (childBBox: DOMRect, parentBBox: DOMRect): number => {
    const overlapX = Math.max(0, Math.min(childBBox.right, parentBBox.right) - Math.max(childBBox.left, parentBBox.left))
    const overlapY = Math.max(0, Math.min(childBBox.bottom, parentBBox.bottom) - Math.max(childBBox.top, parentBBox.top))
    const overlapArea = overlapX * overlapY
    const childArea = childBBox.width * childBBox.height
    
    return childArea > 0 ? overlapArea / childArea : 0
  }

  const calculateRequiredSize = (child: Node, parent: Node): { width: number; height: number } => {
    const childBBox = child.getBBox()
    const parentBBox = parent.getBBox()
    
    const requiredWidth = Math.max(
      MIN_CONTAINER_SIZE.width,
      childBBox.width + padding * 2,
      childBBox.x + childBBox.width - parentBBox.x + padding
    )
    
    const requiredHeight = Math.max(
      MIN_CONTAINER_SIZE.height,
      childBBox.height + padding * 2,
      childBBox.y + childBBox.height - parentBBox.y + padding
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
    previewingParent.value = parent
    
    console.log('[useEmbeddingPreview] 预览扩容:', {
      parentId: parent.id,
      newSize: requiredSize
    })
  }

  const restoreParentSize = (parent: Node) => {
    const originalSize = originalSizes.get(parent.id)
    if (originalSize) {
      parent.resize(originalSize.width, originalSize.height)
      originalSizes.delete(parent.id)
      console.log('[useEmbeddingPreview] 还原尺寸:', {
        parentId: parent.id,
        originalSize
      })
    }
    if (previewingParent.value === parent) {
      previewingParent.value = null
    }
  }

  const restoreAllPreviews = () => {
    originalSizes.forEach((_, parentId) => {
      const graph = getGraph()
      if (graph) {
        const parent = graph.getCellById(parentId) as Node
        if (parent) {
          restoreParentSize(parent)
        }
      }
    })
    originalSizes.clear()
    previewingParent.value = null
  }

  const handleNodeMove = ({ node }: { node: Node }) => {
    const nodeData = node.getData<DeviceNodeData | SystemNodeData>()
    if (nodeData?.type !== NodeType.DEVICE && nodeData?.type !== NodeType.SYSTEM) return
    
    const graph = getGraph()
    if (!graph) return
    
    const childBBox = node.getBBox()
    
    const allNodes = graph.getNodes()
    const emptyContainers = allNodes.filter(n => isEmptyContainer(n) && n.id !== node.id)
    
    let foundTarget = false
    
    for (const container of emptyContainers) {
      const containerBBox = container.getBBox()
      
      const graphContainer = graph.container
      const containerRect = graphContainer.getBoundingClientRect()
      const scale = graph.zoom()
      
      const childScreen = {
        left: containerRect.left + (childBBox.x - graph.translate().tx) * scale,
        right: containerRect.left + (childBBox.x + childBBox.width - graph.translate().tx) * scale,
        top: containerRect.top + (childBBox.y - graph.translate().ty) * scale,
        bottom: containerRect.top + (childBBox.y + childBBox.height - graph.translate().ty) * scale,
        width: childBBox.width * scale,
        height: childBBox.height * scale
      }
      
      const parentScreen = {
        left: containerRect.left + (containerBBox.x - graph.translate().tx) * scale,
        right: containerRect.left + (containerBBox.x + containerBBox.width - graph.translate().tx) * scale,
        top: containerRect.top + (containerBBox.y - graph.translate().ty) * scale,
        bottom: containerRect.top + (containerBBox.y + containerBBox.height - graph.translate().ty) * scale,
        width: containerBBox.width * scale,
        height: containerBBox.height * scale
      }
      
      const overlapRatio = calculateOverlapRatio(
        childScreen as DOMRect,
        parentScreen as DOMRect
      )
      
      if (overlapRatio >= overlapThreshold) {
        foundTarget = true
        const requiredSize = calculateRequiredSize(node, container)
        const currentSize = container.getSize()
        
        if (requiredSize.width > currentSize.width || requiredSize.height > currentSize.height) {
          expandParentPreview(container, requiredSize)
        }
        break
      }
    }
    
    if (!foundTarget && previewingParent.value) {
      const parent = previewingParent.value
      restoreParentSize(parent as Node)
    }
  }

  const handleNodeMoved = ({ node: _node }: { node: Node }) => {
    setTimeout(() => {
      restoreAllPreviews()
    }, 100)
  }

  const handleNodeEmbedded = ({ currentParent }: { node: Node; currentParent: Node | null }) => {
    if (currentParent && originalSizes.has(currentParent.id)) {
      originalSizes.delete(currentParent.id)
    }
    previewingParent.value = null
  }

  const enable = () => {
    const graph = getGraph()
    if (!graph) {
      console.warn('[useEmbeddingPreview] Graph 实例不存在')
      return
    }

    graph.on('node:move', handleNodeMove)
    graph.on('node:moved', handleNodeMoved)
    graph.on('node:embedded', handleNodeEmbedded)

    console.log('[useEmbeddingPreview] 已启用')
  }

  const disable = () => {
    const graph = getGraph()
    if (!graph) return

    graph.off('node:move', handleNodeMove)
    graph.off('node:moved', handleNodeMoved)
    graph.off('node:embedded', handleNodeEmbedded)

    restoreAllPreviews()

    console.log('[useEmbeddingPreview] 已禁用')
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
    previewingParent,
    enable,
    disable
  }
}
