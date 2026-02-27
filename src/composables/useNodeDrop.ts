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
    const nodeData = node.getData<DeviceNodeData | SystemNodeData>()

    // 只处理设备节点或系统容器（支持嵌套）
    if (nodeData?.type !== NodeType.DEVICE && nodeData?.type !== NodeType.SYSTEM) {
      return
    }

    if (currentParent) {
      const parentData = currentParent.getData<SystemNodeData>()
      if (parentData?.type !== NodeType.SYSTEM) {
        return
      }

      const containerData = currentParent.getData<SystemNodeData>()
      if (containerData?.childrenIds && !containerData.childrenIds.includes(node.id!)) {
        containerData.childrenIds.push(node.id!)
        currentParent.setData(containerData)
      }

      ZIndexManager.setNodeZIndex(node)
      node.toFront({ deep: false })
    }
  }

  const handleNodePositionChange = (args: { node: Node }) => {
    const { node } = args

    const nodeData = node.getData<DeviceNodeData | SystemNodeData>()
    // 只处理设备节点或系统容器（支持嵌套）
    if (nodeData?.type !== NodeType.DEVICE && nodeData?.type !== NodeType.SYSTEM) return

    const parent = node.getParent()
    if (!isNode(parent)) return

    if (isCtrlPressed()) {
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
      return
    }

    graph.on('node:embedded', handleNodeEmbedded)
    graph.on('node:change:position', handleNodePositionChange)
  }

  const destroy = () => {
    const graph = graphStore.graph
    if (graph) {
      graph.off('node:embedded', handleNodeEmbedded)
      graph.off('node:change:position', handleNodePositionChange)
    }

    clearLeaveTimer()
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
