import { ref, onMounted, onBeforeUnmount, toRaw } from 'vue'
import { Dnd, Graph } from '@antv/x6'
import type { Node } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { nanoid } from 'nanoid'
import type { StencilItemConfig } from '@/constants/stencil'

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

  const getRawGraph = (): Graph | null => {
    const graph = graphStore.graph
    if (!graph) return null
    return toRaw(graph) as Graph
  }

  const initDnd = () => {
    const rawGraph = getRawGraph()
    if (!rawGraph) {
      console.warn('[useDnd] Graph 实例不存在，无法初始化 Dnd')
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

      console.log('[useDnd] Dnd 初始化成功')
    } catch (error) {
      console.error('[useDnd] Dnd 初始化失败:', error)
    }
  }

  const startDrag = (config: StencilItemConfig, event: DragEvent) => {
    if (!dnd.value) {
      console.warn('[useDnd] Dnd 未初始化')
      return
    }

    const rawGraph = getRawGraph()
    if (!rawGraph) {
      console.warn('[useDnd] Graph 实例不存在')
      return
    }

    try {
      const nodeData = config.createData()
      const nodeId = nanoid()

      const node = rawGraph.createNode({
        id: nodeId,
        shape: config.nodeType === 'device' ? 'device-node' : 'system-container',
        width: config.width,
        height: config.height,
        data: nodeData
      })

      console.log('[useDnd] 创建节点:', nodeId, config.label)

      dnd.value.start(node, event as MouseEvent)
      isDragging.value = true

      console.log('[useDnd] 开始拖拽:', config.label)
    } catch (error) {
      console.error('[useDnd] 拖拽启动失败:', error)
    }
  }

  const destroy = () => {
    if (dnd.value) {
      dnd.value = null
      console.log('[useDnd] Dnd 已销毁')
    }
  }

  const setupDragEvents = () => {
    const rawGraph = getRawGraph()
    if (!rawGraph) return

    rawGraph.on('node:added', (args) => {
      console.log('[useDnd] 节点已添加:', args.node.id, args.node.getPosition())
      console.log('[useDnd] 节点数据:', args.node.getData())
      console.log('[useDnd] 画布总节点数:', rawGraph.getNodes().length)

      rawGraph.getNodes().forEach(node => {
        console.log('  - 节点:', node.id, node.shape, node.getPosition(), node.isVisible())
      })

      isDragging.value = false
    })

    rawGraph.on('node:change:position', (args) => {
      if (isDragging.value) {
        console.log('[useDnd] 拖拽中位置变化:', args.node.id, args.current)
      }
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
  })

  onBeforeUnmount(() => {
    destroy()
  })

  return {
    isDragging: isDragging.value,
    startDrag,
    destroy
  }
}
