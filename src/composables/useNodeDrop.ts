/**
 * 节点拖拽入组/出组检测
 * @description 处理设备节点拖拽时的入组和出组逻辑
 */

import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Node } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { NodeType } from '@/types/node'
import {
  isNodeInContainer,
  isNodeOutOfContainer
} from '@/utils/coordinateTransform'
import { ParentChildManager } from './useParentChild'
import {
  ENTER_GROUP_DELAY,
  LEAVE_GROUP_DELAY,
  LEAVE_OVERLAP_THRESHOLD,
  CONTAINER_HIGHLIGHT_STYLE,
  CONTAINER_NORMAL_STYLE
} from '@/constants/drag'

/**
 * useNodeDrop 选项
 */
export interface UseNodeDropOptions {
  // 入组延迟（毫秒）
  enterDelay?: number
  // 出组延迟（毫秒）
  leaveDelay?: number
  // 出组面积阈值
  leaveThreshold?: number
}

/**
 * useNodeDrop 返回值
 */
export interface UseNodeDropReturn {
  // 当前悬停的容器
  hoveredContainer: Node | null
  // 是否启用入组检测
  enableEnterDetection: () => void
  // 是否启用出组检测
  enableLeaveDetection: () => void
  // 销毁
  destroy: () => void
}

/**
 * 节点拖拽入组/出组检测
 */
export function useNodeDrop(options: UseNodeDropOptions = {}): UseNodeDropReturn {
  const graphStore = useGraphStore()
  const hoveredContainer = ref<Node | null>(null)
  
  // 入组定时器
  let enterTimer: number | null = null
  // 出组定时器
  let leaveTimer: number | null = null
  
  // 配置参数
  const enterDelay = options.enterDelay ?? ENTER_GROUP_DELAY
  const leaveDelay = options.leaveDelay ?? LEAVE_GROUP_DELAY
  const leaveThreshold = options.leaveThreshold ?? LEAVE_OVERLAP_THRESHOLD

  /**
   * 获取所有容器节点
   */
  const getAllContainers = (): Node[] => {
    const graph = graphStore.graph
    if (!graph) return []

    const nodes = graph.getNodes()
    return nodes.filter(node => {
      const data = node.getData() as any
      return data?.type === NodeType.SYSTEM
    })
  }

  /**
   * 高亮容器
   */
  const highlightContainer = (container: Node) => {
    container.attr('body', CONTAINER_HIGHLIGHT_STYLE)
  }

  /**
   * 取消容器高亮
   */
  const unhighlightContainer = (container: Node) => {
    container.attr('body', CONTAINER_NORMAL_STYLE)
  }

  /**
   * 清除入组定时器
   */
  const clearEnterTimer = () => {
    if (enterTimer) {
      clearTimeout(enterTimer)
      enterTimer = null
    }
  }

  /**
   * 清除出组定时器
   */
  const clearLeaveTimer = () => {
    if (leaveTimer) {
      clearTimeout(leaveTimer)
      leaveTimer = null
    }
  }

  /**
   * 处理设备节点移动（入组检测）
   */
  const handleNodeMove = (args: { node: Node; [key: string]: any }) => {
    const { node } = args

    // 只处理设备节点
    const nodeData = node.getData() as any
    if (nodeData?.type !== NodeType.DEVICE) {
      return
    }

    console.log('[useNodeDrop] 检测设备节点移动:', node.id, node.getPosition())

    // 如果已有父节点，不检测入组
    if (node.getParent()) {
      console.log('[useNodeDrop] 设备已有父节点，跳过入组检测')
      return
    }

    // 获取所有容器节点
    const containers = getAllContainers()
    console.log('[useNodeDrop] 画布上的容器数量:', containers.length)
    
    if (containers.length === 0) {
      console.log('[useNodeDrop] 没有容器，跳过检测')
      return
    }

    // 检测是否进入任何容器
    let targetContainer: Node | null = null
    for (const container of containers) {
      if (isNodeInContainer(node, container)) {
        targetContainer = container
        console.log('[useNodeDrop] ✅ 设备进入容器:', container.id)
        break
      }
    }

    // 如果进入了新容器
    if (targetContainer && targetContainer.id !== hoveredContainer.value?.id) {
      console.log('[useNodeDrop] 进入新容器:', targetContainer.id)
      
      // 清除之前的定时器和高亮
      clearEnterTimer()
      if (hoveredContainer.value) {
        unhighlightContainer(hoveredContainer.value)
      }

      // 设置新的悬停容器
      hoveredContainer.value = targetContainer

      // 启动入组定时器
      console.log(`[useNodeDrop] 启动入组定时器 (${enterDelay}ms)`)
      enterTimer = window.setTimeout(() => {
        if (hoveredContainer.value) {
          console.log('[useNodeDrop] 定时器触发，高亮容器:', hoveredContainer.value.id)
          highlightContainer(hoveredContainer.value)
        }
      }, enterDelay)
    }
    // 如果离开了容器
    else if (!targetContainer && hoveredContainer.value) {
      console.log('[useNodeDrop] 离开容器:', hoveredContainer.value.id)
      clearEnterTimer()
      unhighlightContainer(hoveredContainer.value)
      hoveredContainer.value = null
    }
  }

  /**
   * 处理设备节点放置（执行入组）
   */
  const handleNodeAdded = (args: { node: Node; [key: string]: any }) => {
    const { node } = args

    console.log('[useNodeDrop] 节点添加事件:', node.id, node.getPosition())

    // 只处理设备节点
    const nodeData = node.getData() as any
    console.log('[useNodeDrop] 节点数据:', nodeData)
    
    if (nodeData?.type !== NodeType.DEVICE) {
      console.log('[useNodeDrop] 跳过非设备节点')
      return
    }

    console.log('[useNodeDrop] 当前悬停容器:', hoveredContainer.value?.id)

    // 如果有悬停的容器，执行入组
    if (hoveredContainer.value) {
      console.log('[useNodeDrop] 执行入组:', {
        device: node.id,
        container: hoveredContainer.value.id
      })
      
      const success = ParentChildManager.addToContainer(node, hoveredContainer.value)
      
      if (success) {
        console.log('[useNodeDrop] ✅ 入组成功')
      } else {
        console.log('[useNodeDrop] ❌ 入组失败')
      }
      
      // 取消高亮
      unhighlightContainer(hoveredContainer.value)
      hoveredContainer.value = null
    } else {
      console.log('[useNodeDrop] 没有悬停容器，跳过入组')
    }

    // 清理定时器
    clearEnterTimer()
  }

  /**
   * 处理设备节点位置变化（出组检测）
   */
  const handleNodePositionChange = (args: { node: Node; [key: string]: any }) => {
    const { node } = args

    // 只处理设备节点
    const nodeData = node.getData() as any
    if (nodeData?.type !== NodeType.DEVICE) return

    // 只处理有父节点的设备
    const parent = node.getParent()
    if (!parent) return

    // 检测是否外溢
    if (isNodeOutOfContainer(node, parent, leaveThreshold)) {
      // 启动出组定时器
      if (!leaveTimer) {
        leaveTimer = window.setTimeout(() => {
          const currentParent = node.getParent()
          if (currentParent) {
            ParentChildManager.removeFromContainer(node, currentParent)
          }
          clearLeaveTimer()
        }, leaveDelay)
      }
    } else {
      // 如果重新进入容器，取消出组
      clearLeaveTimer()
    }
  }

  /**
   * 启用入组检测
   */
  const enableEnterDetection = () => {
    const graph = graphStore.graph
    if (!graph) {
      console.warn('[useNodeDrop] Graph 实例不存在')
      return
    }

    // 监听节点移动事件（拖拽中）
    graph.on('node:mousemove', handleNodeMove)
    
    // 监听节点添加事件（拖拽放置）
    graph.on('node:added', handleNodeAdded)
    
    // 监听鼠标松开事件（作为备用方案）
    graph.on('node:mouseup', (args) => {
      console.log('[useNodeDrop] 鼠标松开事件:', args.node.id, args.node.getPosition())
      const nodeData = args.node.getData() as any
      if (nodeData?.type === NodeType.DEVICE && hoveredContainer.value) {
        console.log('[useNodeDrop] 通过 mouseup 执行入组')
        handleNodeAdded({ node: args.node })
      }
    })

    console.log('[useNodeDrop] 入组检测已启用')
  }

  /**
   * 启用出组检测
   */
  const enableLeaveDetection = () => {
    const graph = graphStore.graph
    if (!graph) {
      console.warn('[useNodeDrop] Graph 实例不存在')
      return
    }

    // 监听节点位置变化事件
    graph.on('node:change:position', handleNodePositionChange)

    console.log('[useNodeDrop] 出组检测已启用')
  }

  /**
   * 销毁
   */
  const destroy = () => {
    const graph = graphStore.graph
    if (graph) {
      graph.off('node:mousemove', handleNodeMove)
      graph.off('node:added', handleNodeAdded)
      graph.off('node:mouseup')
      graph.off('node:change:position', handleNodePositionChange)
    }

    clearEnterTimer()
    clearLeaveTimer()

    if (hoveredContainer.value) {
      unhighlightContainer(hoveredContainer.value)
      hoveredContainer.value = null
    }

    console.log('[useNodeDrop] 已销毁')
  }

  /**
   * 组件挂载时初始化
   */
  onMounted(() => {
    if (graphStore.isInitialized) {
      enableEnterDetection()
      enableLeaveDetection()
    } else {
      const unwatch = graphStore.$subscribe((mutation, state) => {
        if (state.isInitialized) {
          enableEnterDetection()
          enableLeaveDetection()
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
    hoveredContainer: hoveredContainer.value,
    enableEnterDetection,
    enableLeaveDetection,
    destroy
  }
}
