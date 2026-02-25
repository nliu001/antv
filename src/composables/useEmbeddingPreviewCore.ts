import { toRaw } from 'vue'
import type { Node, Graph } from '@antv/x6'
import { NodeType, type SystemNodeData } from '@/types/node'
import { DEFAULT_EXPAND_CONFIG } from '@/config/containerConfig'

interface OriginalSize {
  width: number
  height: number
}

const originalSizes = new Map<string, OriginalSize>()
let previewingParentId: string | null = null

export const EmbeddingPreviewCore = {
  getPreviewingParentId: () => previewingParentId,
  
  checkAndPreview: (
    graph: Graph,
    childBBox: { x: number; y: number; width: number; height: number },
    excludeNodeId?: string
  ) => {
    const rawGraph = toRaw(graph)
    
    const allNodes = rawGraph.getNodes()
    const emptyContainers = allNodes.filter(n => {
      const data = n.getData<SystemNodeData>()
      const isSystem = data?.type === NodeType.SYSTEM
      const children = n.getChildren()
      const isEmpty = !children || children.length === 0
      const isNotExcluded = n.id !== excludeNodeId
      
      return isSystem && isEmpty && isNotExcluded
    })

    if (emptyContainers.length === 0) {
      if (previewingParentId) {
        const parent = rawGraph.getCellById(previewingParentId) as Node
        if (parent) {
          EmbeddingPreviewCore.restoreSize(parent)
        }
      }
      return
    }

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
        const requiredSize = EmbeddingPreviewCore.calculateRequiredSize(childBBox)
        const currentSize = container.getSize()

        if (requiredSize.width > currentSize.width || requiredSize.height > currentSize.height) {
          EmbeddingPreviewCore.expandPreview(container, requiredSize)
        }
        break
      }
    }

    if (!foundTarget && previewingParentId) {
      const parent = rawGraph.getCellById(previewingParentId) as Node
      if (parent) {
        EmbeddingPreviewCore.restoreSize(parent)
      }
    }
  },

  calculateRequiredSize: (childBBox: { width: number; height: number }): { width: number; height: number } => {
    const padding = DEFAULT_EXPAND_CONFIG.padding
    
    const requiredWidth = Math.max(
      DEFAULT_EXPAND_CONFIG.minWidth,
      childBBox.width + padding * 2
    )
    
    const requiredHeight = Math.max(
      DEFAULT_EXPAND_CONFIG.minHeight,
      childBBox.height + padding * 2
    )
    
    return { width: requiredWidth, height: requiredHeight }
  },

  expandPreview: (parent: Node, requiredSize: { width: number; height: number }) => {
    if (!originalSizes.has(parent.id)) {
      const currentSize = parent.getSize()
      originalSizes.set(parent.id, {
        width: currentSize.width,
        height: currentSize.height
      })
    }

    parent.resize(requiredSize.width, requiredSize.height)
    previewingParentId = parent.id
  },

  restoreSize: (parent: Node) => {
    const originalSize = originalSizes.get(parent.id)
    if (originalSize) {
      parent.resize(originalSize.width, originalSize.height)
      originalSizes.delete(parent.id)
    }
    if (previewingParentId === parent.id) {
      previewingParentId = null
    }
  },

  restoreAll: (graph: Graph) => {
    const rawGraph = toRaw(graph)
    
    originalSizes.forEach((_, parentId) => {
      const parent = rawGraph.getCellById(parentId) as Node
      if (parent) {
        EmbeddingPreviewCore.restoreSize(parent)
      }
    })
    originalSizes.clear()
    previewingParentId = null
  },

  onEmbedded: (currentParent: Node | null) => {
    if (currentParent && originalSizes.has(currentParent.id)) {
      originalSizes.delete(currentParent.id)
    }
    previewingParentId = null
  }
}
