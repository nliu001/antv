import { onUnmounted } from 'vue'
import type { Graph, Node } from '@antv/x6'
import { ParentChildManager } from './useParentChild'
import { calculateOverlapRatio } from '@/utils/coordinateTransform'
import { NodeType } from '@/types/node'

/**
 * 节点出组管理 Composable
 * 
 * 功能：
 * - 监听节点拖动结束事件
 * - 检查 Ctrl 键状态
 * - 计算重叠率
 * - 判定是否自动出组
 */
export function useNodeOutGroup(graph: Graph | null = null, isCtrlPressed: () => boolean) {
  let graphInstance = graph
  const eventHandlers: Array<() => void> = []

  /**
   * 设置 Graph 实例
   */
  function setGraph(newGraph: Graph) {
    graphInstance = newGraph
    console.log('[useNodeOutGroup] Graph 实例已设置')
  }

  /**
   * 计算节点与其父容器的重叠率
   * 
   * @param node 子节点
   * @param parent 父容器节点
   * @returns 重叠率（0-1）
   */
  function getOverlapRatio(node: Node, parent: Node): number {
    const nodeBBox = node.getBBox()
    const parentBBox = parent.getBBox()
    
    const ratio = calculateOverlapRatio(nodeBBox, parentBBox)
    console.log(`[useNodeOutGroup] 重叠率计算: node=${node.id}, parent=${parent.id}, ratio=${(ratio * 100).toFixed(1)}%`)
    
    return ratio
  }

  /**
   * 检查并执行出组操作
   * 
   * @param node 节点
   * @returns 是否执行了出组
   */
  function checkAndOutGroup(node: Node): boolean {
    // 1. 检查是否按住 Ctrl 键
    if (!isCtrlPressed()) {
      return false
    }

    // 2. 获取父节点
    const parent = node.getParent()
    if (!parent || !parent.isNode()) {
      return false
    }

    // 3. 仅处理系统容器
    const parentData = parent.getData()
    if (parentData?.type !== NodeType.SYSTEM) {
      return false
    }

    // 4. 计算重叠率
    const overlapRatio = getOverlapRatio(node, parent as Node)

    // 5. 判定是否出组（重叠率 = 0%，即完全脱离）
    if (overlapRatio === 0) {
      console.log(`[useNodeOutGroup] 触发出组: node=${node.id}, parent=${parent.id}`)
      
      // 执行出组
      const success = ParentChildManager.removeFromContainer(node, parent as Node)
      
      if (success) {
        console.log(`[useNodeOutGroup] 出组成功 ✅`)
        // TODO: 播放出组动画
        return true
      } else {
        console.error(`[useNodeOutGroup] 出组失败 ❌`)
        return false
      }
    } else {
      console.log(`[useNodeOutGroup] 未满足出组条件: 重叠率=${(overlapRatio * 100).toFixed(1)}% > 0%`)
      return false
    }
  }

  /**
   * 启用出组监听
   */
  function enable() {
    if (!graphInstance) {
      console.warn('[useNodeOutGroup] Graph 实例未设置，无法启用')
      return
    }

    const graph = graphInstance

    // 监听节点拖动结束事件
    const mouseUpHandler = ({ node }: { node: Node }) => {
      // 检查是否是设备节点
      const nodeData = node.getData()
      if (nodeData?.type !== NodeType.DEVICE) {
        return
      }

      console.log(`[useNodeOutGroup] 检测到节点拖动结束: ${node.id}`)
      
      // 检查并执行出组
      checkAndOutGroup(node)
    }

    graph.on('node:mouseup', mouseUpHandler)
    eventHandlers.push(() => graph.off('node:mouseup', mouseUpHandler))

    console.log('[useNodeOutGroup] 出组监听已启用')
  }

  /**
   * 禁用出组监听
   */
  function disable() {
    eventHandlers.forEach(cleanup => cleanup())
    eventHandlers.length = 0
    console.log('[useNodeOutGroup] 出组监听已禁用')
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    disable()
  })

  return {
    setGraph,
    enable,
    disable,
    checkAndOutGroup
  }
}
