/**
 * Dnd 拖拽功能 Hook
 */

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Dnd } from '@antv/x6'
import type { Node } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { nanoid } from 'nanoid'
import type { StencilItemConfig } from '@/constants/stencil'

/**
 * useDnd 选项
 */
export interface UseDndOptions {
  // 是否启用缩放
  scaled?: boolean
  // 是否启用动画
  animation?: boolean
  // 拖拽验证函数
  validateNode?: (droppingNode: Node, options: any) => boolean
}

/**
 * useDnd 返回值
 */
export interface UseDndReturn {
  // Dnd 实例
  dnd: Dnd | null
  // 是否正在拖拽
  isDragging: boolean
  // 开始拖拽
  startDrag: (config: StencilItemConfig, event: DragEvent) => void
  // 销毁 Dnd
  destroy: () => void
}

/**
 * Dnd 拖拽功能
 */
export function useDnd(options: UseDndOptions = {}): UseDndReturn {
  const graphStore = useGraphStore()
  const dnd = ref<Dnd | null>(null)
  const isDragging = ref(false)

  /**
   * 初始化 Dnd
   */
  const initDnd = () => {
    const graph = graphStore.graph
    if (!graph) {
      console.warn('[useDnd] Graph 实例不存在，无法初始化 Dnd')
      return
    }

    try {
      dnd.value = new Dnd({
        target: graph,
        scaled: options.scaled ?? true,
        animation: options.animation ?? true,
        validateNode: options.validateNode || (() => true)
      })

      console.log('[useDnd] Dnd 初始化成功')
    } catch (error) {
      console.error('[useDnd] Dnd 初始化失败:', error)
    }
  }

  /**
   * 开始拖拽
   */
  const startDrag = (config: StencilItemConfig, event: DragEvent) => {
    if (!dnd.value) {
      console.warn('[useDnd] Dnd 未初始化')
      return
    }

    const graph = graphStore.graph
    if (!graph) {
      console.warn('[useDnd] Graph 实例不存在')
      return
    }

    try {
      // 创建节点数据
      const nodeData = config.createData()
      const nodeId = nanoid()

      // 创建节点但不添加到画布，让 Dnd 来处理添加
      const node = graph.createNode({
        id: nodeId,
        shape: config.nodeType === 'device' ? 'device-node' : 'system-container',
        width: config.width,
        height: config.height,
        data: nodeData
      })

      console.log('[useDnd] 创建节点:', nodeId, config.label)

      // 启动拖拽
      dnd.value.start(node, event as any)
      isDragging.value = true

      console.log('[useDnd] 开始拖拽:', config.label)
    } catch (error) {
      console.error('[useDnd] 拖拽启动失败:', error)
    }
  }

  /**
   * 销毁 Dnd
   */
  const destroy = () => {
    if (dnd.value) {
      // Dnd 没有显式的 destroy 方法，设置为 null 即可
      dnd.value = null
      console.log('[useDnd] Dnd 已销毁')
    }
  }

  /**
   * 监听拖拽事件
   */
  const setupDragEvents = () => {
    const graph = graphStore.graph
    if (!graph) return

    // 拖拽结束事件
    graph.on('node:added', (args) => {
      console.log('[useDnd] 节点已添加:', args.node.id, args.node.getPosition())
      console.log('[useDnd] 节点数据:', args.node.getData())
      console.log('[useDnd] 画布总节点数:', graph.getNodes().length)
      
      // 调试：列出所有节点
      graph.getNodes().forEach(node => {
        console.log('  - 节点:', node.id, node.shape, node.getPosition(), node.isVisible())
      })
      
      isDragging.value = false
    })
    
    // 监听节点位置变化
    graph.on('node:change:position', (args) => {
      if (isDragging.value) {
        console.log('[useDnd] 拖拽中位置变化:', args.node.id, args.current)
      }
    })
  }

  /**
   * 组件挂载时初始化
   */
  onMounted(() => {
    // 等待 Graph 初始化完成
    if (graphStore.isInitialized) {
      initDnd()
      setupDragEvents()
    } else {
      // 监听 Graph 初始化完成
      const unwatch = graphStore.$subscribe((mutation, state) => {
        if (state.isInitialized && !dnd.value) {
          initDnd()
          setupDragEvents()
          unwatch()
        }
      })
    }
  })

  /**
   * 组件卸载时清理
   */
  onBeforeUnmount(() => {
    destroy()
  })

  return {
    dnd: dnd.value,
    isDragging: isDragging.value,
    startDrag,
    destroy
  }
}
