/**
 * useGraph Composable
 * @description 管理 Graph 实例的生命周期和初始化逻辑
 */

import { ref, onMounted, onBeforeUnmount, isRef, watch } from 'vue'
import type { Ref } from 'vue'
import { Graph } from '@antv/x6'
import { ElMessage } from 'element-plus'
import { createGraphConfig } from '@/utils/graphConfig'
import { useGraphStore } from '@/stores/graphStore'
import { useAutoExpand } from '@/composables/useAutoExpand'
import { useKeyboardState } from '@/composables/useKeyboardState'
import { useNodeOutGroup } from '@/composables/useNodeOutGroup'
import { usePlugins } from '@/composables/usePlugins'
import { useDragVisual } from '@/composables/useDragVisual'
import { useSpacePan } from '@/composables/useSpacePan'
import { useAlignment } from '@/composables/useAlignment'
import { useEmbeddingPreview } from '@/composables/useEmbeddingPreview'
import { nodeApi } from '@/services/api'
import type { GraphOptions } from '@/types/graph'
import { useGraphPersistence } from '@/composables/useGraphPersistence'

/**
 * 防抖函数
 * @param fn - 需要防抖的函数
 * @param delay - 延迟时间（毫秒）
 */
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

/**
 * useGraph Hook
 * @param options - Graph 配置选项
 */
export function useGraph(options?: Partial<GraphOptions>) {
  const graphStore = useGraphStore()
  const graphPersistence = useGraphPersistence()
  
  // 支持外部传入容器引用，或创建内部引用
  const externalContainer = options?.container
  const containerRef: Ref<HTMLElement | null> = isRef(externalContainer) 
    ? externalContainer as Ref<HTMLElement | null>
    : ref<HTMLElement | null>(externalContainer || null)
  const resizeObserver = ref<ResizeObserver | null>(null)

  // 初始化自动扩容 Composable
  const autoExpand = useAutoExpand()

  // 初始化键盘状态管理
  const keyboardState = useKeyboardState()

  // 初始化节点出组管理
  const nodeOutGroup = useNodeOutGroup(null, () => keyboardState.isCtrlPressed.value)

  // 初始化插件管理
  const plugins = usePlugins({
    snapline: { enabled: true, tolerance: 10, resizing: true },
    history: { enabled: true, stackSize: 50 },
    selection: { enabled: true, multiple: true, rubberband: true, movable: true },
    keyboard: { enabled: true, global: false },
    clipboard: { enabled: true },
  })

  // 初始化拖拽视觉增强
  useDragVisual()

  // 初始化 Space+拖拽画布平移
  useSpacePan()

  // 初始化对齐分布功能
  const alignment = useAlignment()

  // 初始化嵌入预览（空容器自动扩容）
  useEmbeddingPreview()

  /**
   * 初始化 Graph 实例
   */
  const initGraph = () => {
    if (!containerRef.value) {
      return
    }

    try {
      graphStore.setLoading(true)

      // 创建 Graph 配置
      const config = createGraphConfig(containerRef.value, {
        width: options?.width,
        height: options?.height,
        showGrid: options?.showGrid
      })

      // 创建 Graph 实例
      const graph = new Graph(config)

      // 保存到 Store
      graphStore.setGraph(graph)

      // 监听缩放事件
      graph.on('scale', ({ sx }) => {
        graphStore.updateZoom(sx)
      })

      // 监听平移事件
      graph.on('translate', ({ tx, ty }) => {
        graphStore.updateCenterPoint(tx, ty)
      })

      // 监听画布点击事件
      graph.on('blank:click', () => {
        // 空白区域点击事件（后续步骤可能需要）
      })

      // 监听节点移动开始
      graph.on('node:move', () => {
        graphStore.setInteracting(true)
      })

      // 监听节点移动结束
      graph.on('node:moved', () => {
        graphStore.setInteracting(false)
      })

      // 设置 Graph 实例并启用自动扩容
      autoExpand.setGraph(graph)
      autoExpand.enable()

      // 设置 Graph 实例并启用出组监听
      nodeOutGroup.setGraph(graph)
      nodeOutGroup.enable()

      // 监听 Ctrl 键状态变化
      keyboardState.onCtrlPress(() => {
        autoExpand.pause()
      })

      keyboardState.onCtrlRelease(() => {
        autoExpand.resume()
      })

      // 初始化插件（Snapline、History、Selection、Keyboard、Clipboard）
      plugins.init()

      // 监听手动调整大小事件，暂停/恢复自动扩容
      graph.on('node:resize', () => {
        autoExpand.pause()
      })

      graph.on('node:resized', () => {
        autoExpand.resume()
      })

      watch(
        () => graphStore.isLocked,
        (isLocked) => {
          if (isLocked) {
            autoExpand.pause()
          } else {
            autoExpand.resume()
          }
        }
      )

      graph.on('node:moved', async ({ node }) => {
        if (!graphPersistence.currentGraphId.value) return
        const position = node.position()
        try {
          await nodeApi.update({
            id: node.id,
            graphId: graphPersistence.currentGraphId.value,
            x: position.x,
            y: position.y,
          })
        } catch (error) {
          // 节点位置同步失败，静默处理
        }
      })

      graph.on('node:resized', async ({ node }) => {
        if (!graphPersistence.currentGraphId.value) return
        const size = node.size()
        const position = node.position()
        try {
          await nodeApi.update({
            id: node.id,
            graphId: graphPersistence.currentGraphId.value,
            x: position.x,
            y: position.y,
            width: size.width,
            height: size.height,
          })
        } catch (error) {
          // 节点大小同步失败，静默处理
        }
      })

      graph.on('node:removed', async ({ node }) => {
        if (!graphPersistence.currentGraphId.value) return
        try {
          await nodeApi.delete(node.id, graphPersistence.currentGraphId.value)
        } catch (error) {
          // 节点删除同步失败，静默处理
        }
      })

      graph.on('node:added', async ({ node }) => {
        if (!graphPersistence.currentGraphId.value) {
          const graphName = 'Topology-' + new Date().toISOString().slice(0, 10)
          await graphPersistence.saveGraphEmpty(graphName)
        }
        
        await graphPersistence.saveNode(node)
      })

    } catch (error) {
      graphStore.setError(error as Error)
      ElMessage.error('画布初始化失败，请刷新页面重试')
    }
  }

  /**
   * 处理容器尺寸变化
   */
  const handleResize = debounce(() => {
    if (graphStore.graph && containerRef.value) {
      const { clientWidth, clientHeight } = containerRef.value
      graphStore.graph.resize(clientWidth, clientHeight)
    }
  }, 150)

  /**
   * 初始化容器尺寸监听
   */
  const initResizeObserver = () => {
    if (!containerRef.value) return

    resizeObserver.value = new ResizeObserver(handleResize)
    resizeObserver.value.observe(containerRef.value)
  }

  /**
   * 销毁 Graph 实例
   */
  const destroyGraph = () => {
    // 移除 ResizeObserver
    if (resizeObserver.value && containerRef.value) {
      resizeObserver.value.unobserve(containerRef.value)
      resizeObserver.value.disconnect()
      resizeObserver.value = null
    }

    // 销毁 Graph 实例
    if (graphStore.graph) {
      graphStore.graph.dispose()
    }

    // 重置 Store
    graphStore.reset()
  }

  // 生命周期钩子
  onMounted(() => {
    initGraph()
    initResizeObserver()
  })

  onBeforeUnmount(() => {
    destroyGraph()
  })

  return {
    containerRef,
    graph: graphStore.graph,
    isInitialized: () => graphStore.isInitialized,
    isLoading: () => graphStore.isLoading,
    error: () => graphStore.error,
    plugins,
    alignment,
  }
}
