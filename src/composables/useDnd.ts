import { ref, onMounted, onBeforeUnmount, toRaw } from 'vue'
import { Dnd, Graph } from '@antv/x6'
import type { Node } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { nanoid } from 'nanoid'
import type { StencilItemConfig } from '@/constants/stencil'
import { EmbeddingPreviewCore } from './useEmbeddingPreviewCore'

export interface UseDndOptions {
  scaled?: boolean
  dndContainer?: HTMLElement
  draggingContainer?: HTMLElement
  validateNode?: (droppingNode: Node, options: any) => boolean
}

export interface UseDndReturn {
  isDragging: boolean
  startDrag: (config: StencilItemConfig, event: DragEvent) => void
  destroy: () => void
}

export function useDnd(options: UseDndOptions = {}): UseDndReturn {
  const graphStore = useGraphStore()
  const dnd = ref<Dnd | null>(null)
  const isDragging = ref(false)
  const currentDragConfig = ref<StencilItemConfig | null>(null)

  const getRawGraph = (): Graph | null => {
    const graph = graphStore.graph
    if (!graph) return null
    return toRaw(graph) as Graph
  }

  const initDnd = () => {
    const rawGraph = getRawGraph()
    if (!rawGraph) {
      return
    }

    try {
      dnd.value = new Dnd({
        target: rawGraph,
        scaled: options.scaled ?? true,
        dndContainer: options.dndContainer,
        draggingContainer: options.draggingContainer,
        validateNode: options.validateNode || (() => true)
      })
    } catch (error) {
      // Dnd 初始化失败，静默处理
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !currentDragConfig.value) return
    
    const rawGraph = getRawGraph()
    if (!rawGraph) return
    
    // 将屏幕坐标转换为画布坐标
    const point = rawGraph.clientToLocal(e.clientX, e.clientY)
    
    // 计算节点中心位置（假设节点以鼠标位置为中心）
    const nodeWidth = currentDragConfig.value.width || 120
    const nodeHeight = currentDragConfig.value.height || 80
    
    const childBBox = {
      x: point.x - nodeWidth / 2,
      y: point.y - nodeHeight / 2,
      width: nodeWidth,
      height: nodeHeight
    }
    
    EmbeddingPreviewCore.checkAndPreview(rawGraph, childBBox)
  }

  const handleMouseUp = () => {
    if (isDragging.value) {
      const rawGraph = getRawGraph()
      if (rawGraph) {
        EmbeddingPreviewCore.restoreAll(rawGraph)
      }
      isDragging.value = false
      currentDragConfig.value = null
    }
  }

  const startDrag = (config: StencilItemConfig, event: DragEvent) => {
    if (!dnd.value) {
      return
    }

    const rawGraph = getRawGraph()
    if (!rawGraph) {
      return
    }

    if (graphStore.isLocked) {
      return
    }

    try {
      currentDragConfig.value = config
      const nodeData = config.createData()
      const nodeId = nanoid()

      const node = rawGraph.createNode({
        id: nodeId,
        shape: config.nodeType === 'device' ? 'device-node' : 'system-container',
        width: config.width,
        height: config.height,
        data: nodeData
      })

      dnd.value.start(node, event as MouseEvent)
      isDragging.value = true
    } catch (error) {
      // 拖拽启动失败，静默处理
    }
  }

  const destroy = () => {
    if (dnd.value) {
      dnd.value = null
    }
  }

  const setupDragEvents = () => {
    const rawGraph = getRawGraph()
    if (!rawGraph) return

    rawGraph.on('node:added', () => {
      isDragging.value = false
      currentDragConfig.value = null
    })

    // 节点嵌入时清除预览状态
    rawGraph.on('node:embedded', ({ currentParent }: { node: Node; currentParent: Node | null }) => {
      EmbeddingPreviewCore.onEmbedded(currentParent)
    })
  }

  onMounted(() => {
    if (graphStore.isInitialized) {
      initDnd()
      setupDragEvents()
    } else {
      const unwatch = graphStore.$subscribe((_mutation, state) => {
        if (state.isInitialized && !dnd.value) {
          initDnd()
          setupDragEvents()
          unwatch()
        }
      })
    }
    
    // 添加全局鼠标事件监听
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  })

  onBeforeUnmount(() => {
    destroy()
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    isDragging: isDragging.value,
    startDrag,
    destroy
  }
}
