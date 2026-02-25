import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Node, Graph } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { NodeType, type SystemNodeData, type DeviceNodeData } from '@/types/node'

const PREVIEW_PADDING = 20
const MIN_CONTAINER_SIZE = { width: 300, height: 200 }

interface OriginalSize {
  width: number
  height: number
}

export interface UseEmbeddingPreviewOptions {
  padding?: number
}

export function useEmbeddingPreview(options: UseEmbeddingPreviewOptions = {}) {
  const graphStore = useGraphStore()
  
  const padding = options.padding ?? PREVIEW_PADDING
  
  const originalSizes = new Map<string, OriginalSize>()
  const previewingParentId = ref<string | null>(null)

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

  const isOverlapping = (childBBox: { x: number; y: number; width: number; height: number }, parentBBox: { x: number; y: number; width: number; height: number }): boolean => {
    const centerX = childBBox.x + childBBox.width / 2
    const centerY = childBBox.y + childBBox.height / 2
    
    return (
      centerX >= parentBBox.x &&
      centerX <= parentBBox.x + parentBBox.width &&
      centerY >= parentBBox.y &&
      centerY <= parentBBox.y + parentBBox.height
    )
  }

  const calculateRequiredSize = (childBBox: { x: number; y: number; width: number; height: number }, parentBBox: { x: number; y: number; width: number; height: number }): { width: number; height: number } => {
    const rightEdge = childBBox.x + childBBox.width
    const bottomEdge = childBBox.y + childBBox.height
    
    const requiredWidth = Math.max(
      MIN_CONTAINER_SIZE.width,
      rightEdge - parentBBox.x + padding,
      parentBBox.width
    )
    
    const requiredHeight = Math.max(
      MIN_CONTAINER_SIZE.height,
      bottomEdge - parentBBox.y + padding,
      parentBBox.height
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

  const handleNodeMove = ({ node }: { node: Node }) => {
    const nodeData = node.getData<DeviceNodeData | SystemNodeData>()
    if (nodeData?.type !== NodeType.DEVICE && nodeData?.type !== NodeType.SYSTEM) return

    const graph = getGraph()
    if (!graph) return

    const childBBox = node.getBBox()

    const allNodes = graph.getNodes()
    const emptyContainers = allNodes.filter(n => isEmptyContainer(n) && n.id !== node.id)

    if (emptyContainers.length === 0) return

    let foundTarget = false

    for (const container of emptyContainers) {
      const containerBBox = container.getBBox()

      if (isOverlapping(childBBox, containerBBox)) {
        foundTarget = true
        const requiredSize = calculateRequiredSize(childBBox, containerBBox)
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
    previewingParentId,
    enable,
    disable
  }
}
