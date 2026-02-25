import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Node, Graph } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { NodeType, type SystemNodeData, type DeviceNodeData } from '@/types/node'
import { EmbeddingPreviewCore } from './useEmbeddingPreviewCore'

export interface UseEmbeddingPreviewOptions {
  padding?: number
}

export function useEmbeddingPreview(_options: UseEmbeddingPreviewOptions = {}) {
  const graphStore = useGraphStore()
  
  const previewingParentId = ref<string | null>(null)

  const getGraph = (): Graph | null => {
    const graph = graphStore.graph
    if (!graph) return null
    return graph as Graph
  }

  const handleNodeMoving = ({ node }: { node: Node }) => {
    const nodeData = node.getData<DeviceNodeData | SystemNodeData>()
    
    if (nodeData?.type !== NodeType.DEVICE && nodeData?.type !== NodeType.SYSTEM) {
      return
    }

    const graph = getGraph()
    if (!graph) return

    const childBBox = node.getBBox()
    
    EmbeddingPreviewCore.checkAndPreview(graph, childBBox, node.id)
    previewingParentId.value = EmbeddingPreviewCore.getPreviewingParentId()
  }

  const handleNodeMoved = () => {
    setTimeout(() => {
      const graph = getGraph()
      if (graph) {
        EmbeddingPreviewCore.restoreAll(graph)
        previewingParentId.value = null
      }
    }, 100)
  }

  const handleNodeEmbedded = ({ currentParent }: { node: Node; currentParent: Node | null }) => {
    EmbeddingPreviewCore.onEmbedded(currentParent)
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

    EmbeddingPreviewCore.restoreAll(graph)
    previewingParentId.value = null
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
