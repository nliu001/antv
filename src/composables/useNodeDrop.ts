import { onMounted, onBeforeUnmount } from 'vue'
import type { Node, Cell } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { NodeType, type DeviceNodeData, type SystemNodeData } from '@/types/node'
import { isNodeOutOfContainer } from '@/utils/coordinateTransform'
import { ParentChildManager } from './useParentChild'
import { ZIndexManager } from './useZIndexManager'
import {
  LEAVE_GROUP_DELAY,
  LEAVE_OVERLAP_THRESHOLD
} from '@/constants/drag'

export interface UseNodeDropOptions {
  leaveDelay?: number
  leaveThreshold?: number
  isCtrlPressed?: () => boolean
}

export interface UseNodeDropReturn {
  destroy: () => void
}

function isNode(cell: Cell | null | undefined): cell is Node {
  return cell !== null && cell !== undefined && cell.isNode()
}

export function useNodeDrop(options: UseNodeDropOptions = {}): UseNodeDropReturn {
  const graphStore = useGraphStore()

  let leaveTimer: ReturnType<typeof setTimeout> | null = null

  const leaveDelay = options.leaveDelay ?? LEAVE_GROUP_DELAY
  const leaveThreshold = options.leaveThreshold ?? LEAVE_OVERLAP_THRESHOLD
  const isCtrlPressed = options.isCtrlPressed ?? (() => false)

  const clearLeaveTimer = () => {
    if (leaveTimer) {
      clearTimeout(leaveTimer)
      leaveTimer = null
    }
  }

  const handleNodeEmbedded = ({ node, currentParent }: { node: Node; currentParent: Node | null }) => {
    const nodeData = node.getData<DeviceNodeData>()
    console.log('[useNodeDrop] node:embedded 事件触发:', {
      nodeId: node.id,
      nodeType: nodeData?.type,
      parentId: currentParent?.id
    })

    if (nodeData?.type !== NodeType.DEVICE) {
      console.log('[useNodeDrop] 跳过非设备节点')
      return
    }

    if (currentParent) {
      const parentData = currentParent.getData<SystemNodeData>()
      if (parentData?.type !== NodeType.SYSTEM) {
        console.log('[useNodeDrop] 父节点不是系统容器，跳过')
        return
      }

      const containerData = currentParent.getData<SystemNodeData>()
      if (containerData?.childrenIds && !containerData.childrenIds.includes(node.id!)) {
        containerData.childrenIds.push(node.id!)
        currentParent.setData(containerData)
      }

      ZIndexManager.setNodeZIndex(node)
      node.toFront({ deep: false })

      console.log('[useNodeDrop] ✅ 入组完成:', {
        device: node.id,
        container: currentParent.id,
        nodeZIndex: node.getZIndex()
      })
    }
  }

  const handleNodePositionChange = (args: { node: Node }) => {
    const { node } = args

    const nodeData = node.getData<DeviceNodeData>()
    if (nodeData?.type !== NodeType.DEVICE) return

    const parent = node.getParent()
    if (!isNode(parent)) return

    if (isCtrlPressed()) {
      console.log('[useNodeDrop] Ctrl 键按下，跳过自动出组检测')
      clearLeaveTimer()
      return
    }

    if (isNodeOutOfContainer(node, parent, leaveThreshold)) {
      if (!leaveTimer) {
        leaveTimer = window.setTimeout(() => {
          const currentParent = node.getParent()
          if (isNode(currentParent)) {
            ParentChildManager.removeFromContainer(node, currentParent)
          }
          clearLeaveTimer()
        }, leaveDelay)
      }
    } else {
      clearLeaveTimer()
    }
  }

  const enable = () => {
    const graph = graphStore.graph
    if (!graph) {
      console.warn('[useNodeDrop] Graph 实例不存在')
      return
    }

    graph.on('node:embedded', handleNodeEmbedded)
    graph.on('node:change:position', handleNodePositionChange)

    console.log('[useNodeDrop] 已启用（使用 X6 内置 embedding 机制）')
  }

  const destroy = () => {
    const graph = graphStore.graph
    if (graph) {
      graph.off('node:embedded', handleNodeEmbedded)
      graph.off('node:change:position', handleNodePositionChange)
    }

    clearLeaveTimer()

    console.log('[useNodeDrop] 已销毁')
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
    destroy()
  })

  return {
    destroy
  }
}
