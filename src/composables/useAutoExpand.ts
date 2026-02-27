import { ref, onUnmounted } from 'vue'
import type { Graph, Node } from '@antv/x6'
import { throttle } from 'lodash-es'
import { calculateUnionBBox, isValidBBox } from '@/utils/bboxCalculator'
import { DEFAULT_EXPAND_CONFIG, type ExpandConfig } from '@/config/containerConfig'
import { NodeType } from '@/types/node'
import { useGraphStore } from '@/stores/graphStore'

/**
 * 容器自动扩容 Composable
 * 
 * 核心功能：
 * 1. 监听子节点位置/尺寸变化
 * 2. 计算并集包围盒
 * 3. 自动调整容器位置和尺寸
 * 4. 使用 translate() 确保子节点跟随
 * 
 * 关键验证结论：
 * - 所有坐标均为绝对坐标（相对于画布）
 * - 必须使用 translate() 而非 setPosition()
 * - 参考：docs/04-容器自动扩容/X6坐标系统验证报告.md
 */
export function useAutoExpand(initialGraph: Graph | null = null, config: Partial<ExpandConfig> = {}) {
  // 合并配置
  const expandConfig = { ...DEFAULT_EXPAND_CONFIG, ...config }

  // Graph 实例引用（可能延迟初始化）
  let graph = initialGraph

  // 扩容状态标志（避免递归触发）
  const isExpanding = ref(false)

  // 暂停标志（Ctrl 键按下时暂停扩容）
  const isPaused = ref(false)

  // 事件处理器引用（用于清理）
  const eventHandlers: Array<() => void> = []

  /**
   * 扩容核心算法
   * 
   * 策略：固定容器左上角（可向左上扩展，不向右下收缩）
   * 
   * 规则：
   * 1. 容器左上角可以向左/上扩展（当子节点在外部时）
   * 2. 容器左上角不会向右/下收缩
   * 3. 保持最小尺寸约束（200x150）
   * 4. 初始入组时：保持容器原位置，只扩展尺寸
   * 
   * @param container 容器节点
   */
  function expandContainer(container: Node) {
    if (!graph || !expandConfig.enabled) return
    if (isExpanding.value) return // 防止递归触发
    if (isPaused.value) {
      return // Ctrl 键按下时跳过扩容
    }

    isExpanding.value = true

    try {
      // 1. 获取容器当前位置和尺寸
      const oldPos = container.getPosition()
      const oldSize = container.getSize()

      // 2. 获取所有子节点
      const children = container.getChildren()
      if (!children || children.length === 0) {
        // 空容器处理：保持位置不变，应用最小尺寸
        container.resize(expandConfig.minWidth, expandConfig.minHeight)
        return
      }

      // 过滤出节点类型的子元素（排除边）
      const childNodes = children.filter((child) => child.isNode()) as Node[]
      if (childNodes.length === 0) {
        container.resize(expandConfig.minWidth, expandConfig.minHeight)
        return
      }

      // 3. 计算并集包围盒（绝对坐标）
      const unionBBox = calculateUnionBBox(childNodes, graph)
      if (!isValidBBox(unionBBox)) {
        return
      }

      // 4. 计算容器新的左上角（可向左/上扩展，不向右/下收缩）
      // 添加 PADDING 后的子节点包围盒左上角
      const childWithPaddingX = unionBBox.x - expandConfig.padding
      const childWithPaddingY = unionBBox.y - expandConfig.padding
      
      // 容器新左上角 = min(当前左上角, 子节点包围盒-PADDING)
      const newX = Math.min(oldPos.x, childWithPaddingX)
      const newY = Math.min(oldPos.y, childWithPaddingY)

      // 5. 计算容器新的右下角（可扩展，不收缩）
      // 当前容器右下角
      const oldRight = oldPos.x + oldSize.width
      const oldBottom = oldPos.y + oldSize.height
      
      // 子节点包围盒右下角 + PADDING
      const childRight = unionBBox.x + unionBBox.width + expandConfig.padding
      const childBottom = unionBBox.y + unionBBox.height + expandConfig.padding
      
      // 容器新右下角 = max(当前右下角, 子节点包围盒+PADDING)
      const newRight = Math.max(oldRight, childRight)
      const newBottom = Math.max(oldBottom, childBottom)

      // 6. 计算新尺寸
      let newWidth = newRight - newX
      let newHeight = newBottom - newY
      
      // 应用最小尺寸约束
      newWidth = Math.max(newWidth, expandConfig.minWidth)
      newHeight = Math.max(newHeight, expandConfig.minHeight)

      // 7. 判断是否需要调整位置
      const needMoveLeft = newX < oldPos.x
      const needMoveUp = newY < oldPos.y
      const positionChanged = needMoveLeft || needMoveUp

      // 8. 应用位置调整（仅当需要向左/上扩展时）
      // ✅ 使用 setPosition() 不会触发子节点跟随
      if (positionChanged) {
        container.setPosition(newX, newY)
      }

      // 9. 应用尺寸调整（使用过渡动画）
      container.resize(newWidth, newHeight, { 
        absolute: true,
        silent: false 
      })
    } finally {
      isExpanding.value = false
    }
  }

  /**
   * 创建节流的扩容函数
   * 
   * 使用 throttle 替代 debounce，保证固定频率更新，避免卡顿感
   * leading: true - 第一次调用立即执行
   * trailing: true - 最后一次调用也会执行
   */
  const throttledExpand = throttle(expandContainer, expandConfig.debounceDelay, {
    leading: true,
    trailing: true
  })

  /**
   * 设置 Graph 实例
   * 
   * 用于 Graph 延迟初始化的场景
   * 
   * @param newGraph Graph 实例
   */
  function setGraph(newGraph: Graph) {
    graph = newGraph
  }

  /**
   * 启用自动扩容
   * 
   * 监听以下事件：
   * - node:change:position：子节点位置变化
   * - node:change:size：子节点尺寸变化
   * - node:removed：子节点删除
   */
  function enable() {
    if (!graph) return

    // 保存 graph 引用到局部常量，避免 TypeScript null 检查警告
    const graphInstance = graph

    // 监听子节点位置变化
    const positionHandler = ({ node }: { node: Node }) => {
      if (isExpanding.value) return // 跳过扩容触发的位置变化

      const parent = node.getParent()
      if (parent && parent.isNode()) {
        const parentData = parent.getData()
        // 仅处理系统容器
        if (parentData?.type === NodeType.SYSTEM) {
          throttledExpand(parent)
        }
      }
    }
    graphInstance.on('node:change:position', positionHandler)
    eventHandlers.push(() => graphInstance.off('node:change:position', positionHandler))

    // 监听子节点尺寸变化
    const sizeHandler = ({ node }: { node: Node }) => {
      if (isExpanding.value) return

      const parent = node.getParent()
      if (parent && parent.isNode()) {
        const parentData = parent.getData()
        if (parentData?.type === NodeType.SYSTEM) {
          throttledExpand(parent)
        }
      }
    }
    graphInstance.on('node:change:size', sizeHandler)
    eventHandlers.push(() => graphInstance.off('node:change:size', sizeHandler))

    // ❌ 移除 node:removed 监听器
    // 原因：子节点出组时不应触发容器收缩
    // 容器遵循"不向右下收缩"原则，即使子节点离开也保持当前尺寸
    // 详见：规范文档 P1 和日志分析报告
    // 
    // 问题复现：
    // 1. removeChild() 触发 node:removed 事件
    // 2. removeHandler 检测到 children.length === 0
    // 3. expandContainer() 收缩容器到最小尺寸
    // 4. 导致出组的子节点"消失"（被遮挡或超出视口）
    //
    // const removeHandler = ({ node }: { node: Node }) => {
    //   const parent = node.getParent()
    //   if (parent && parent.isNode()) {
    //     const parentData = parent.getData()
    //     if (parentData?.type === NodeType.SYSTEM) {
    //       throttledExpand(parent)
    //     }
    //   }
    // }
    // graphInstance.on('node:removed', removeHandler)
    // eventHandlers.push(() => graphInstance.off('node:removed', removeHandler))
  }

  /**
   * 禁用自动扩容
   */
  function disable() {
    // 清理所有事件监听器
    eventHandlers.forEach((cleanup) => cleanup())
    eventHandlers.length = 0

    // 取消待执行的节流函数
    throttledExpand.cancel()
  }

  /**
   * 手动触发容器扩容
   * 
   * @param container 容器节点
   */
  function manualExpand(container: Node) {
    // 取消节流，立即执行
    throttledExpand.cancel()
    expandContainer(container)
  }

  /**
   * 暂停自动扩容
   * 
   * 用于 Ctrl 键按下时禁用扩容
   */
  function pause() {
    isPaused.value = true
  }

  /**
   * 恢复自动扩容
   * 
   * Ctrl 键松开时恢复扩容（如果画布未锁定）
   */
  function resume() {
    const graphStore = useGraphStore()
    if (graphStore.isLocked) {
      return
    }
    isPaused.value = false
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    disable()
  })

  return {
    setGraph,
    enable,
    disable,
    manualExpand,
    pause,
    resume,
    isExpanding,
    isPaused
  }
}
