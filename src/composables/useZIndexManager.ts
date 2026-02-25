import type { Node, Cell } from '@antv/x6'
import { Z_INDEX } from '@/constants/drag'
import { NodeType, type DeviceNodeData, type SystemNodeData } from '@/types/node'

function isNode(cell: Cell | null | undefined): cell is Node {
  return cell !== null && cell !== undefined && cell.isNode()
}

const ORIGINAL_ZINDEX_KEY = '__originalZIndex__'

export class ZIndexManager {
  static getNodeZIndex(node: Node): number {
    const nodeData = node.getData<DeviceNodeData | SystemNodeData>()
    const nodeType = nodeData?.type

    if (nodeType === NodeType.SYSTEM) {
      return Z_INDEX.CONTAINER
    }

    if (nodeType === NodeType.DEVICE) {
      const parent = node.getParent()
      if (isNode(parent)) {
        const parentZIndex = parent.getZIndex() || Z_INDEX.CONTAINER
        return parentZIndex + Z_INDEX.DEVICE
      }
      return Z_INDEX.DEVICE
    }

    return Z_INDEX.DEVICE
  }

  static setNodeZIndex(node: Node, zIndex?: number): void {
    const finalZIndex = zIndex ?? this.getNodeZIndex(node)
    node.setZIndex(finalZIndex)
  }

  static bringToFront(node: Node): void {
    node.setZIndex(Z_INDEX.DRAGGING)
  }

  static sendToBack(node: Node): void {
    node.setZIndex(Z_INDEX.CONTAINER)
  }

  static updateChildrenZIndex(parent: Node): void {
    const children = parent.getChildren()
    if (!children || children.length === 0) return

    const parentZIndex = parent.getZIndex() || Z_INDEX.CONTAINER

    children.forEach((child) => {
      if (isNode(child)) {
        child.setZIndex(parentZIndex + Z_INDEX.DEVICE)
        this.updateChildrenZIndex(child)
      }
    })
  }

  static resetAllZIndex(nodes: Node[]): void {
    nodes.forEach((node) => {
      this.setNodeZIndex(node)
      this.updateChildrenZIndex(node)
    })
  }

  static getOriginalZIndex(node: Node): number {
    const data = node.getData<Record<string, unknown>>()
    const stored = data?.[ORIGINAL_ZINDEX_KEY]
    return typeof stored === 'number' ? stored : this.getNodeZIndex(node)
  }

  static saveOriginalZIndex(node: Node): void {
    const currentZIndex = node.getZIndex() || this.getNodeZIndex(node)
    const data = node.getData<Record<string, unknown>>() || {}
    node.setData({ ...data, [ORIGINAL_ZINDEX_KEY]: currentZIndex })
  }

  static restoreOriginalZIndex(node: Node): void {
    const originalZIndex = this.getOriginalZIndex(node)
    node.setZIndex(originalZIndex)
    const data = node.getData<Record<string, unknown>>() || {}
    const { [ORIGINAL_ZINDEX_KEY]: _, ...rest } = data
    node.setData(rest)
  }
}

export function useZIndexManager() {
  return {
    getNodeZIndex: ZIndexManager.getNodeZIndex,
    setNodeZIndex: ZIndexManager.setNodeZIndex,
    bringToFront: ZIndexManager.bringToFront,
    sendToBack: ZIndexManager.sendToBack,
    updateChildrenZIndex: ZIndexManager.updateChildrenZIndex,
    resetAllZIndex: ZIndexManager.resetAllZIndex,
    getOriginalZIndex: ZIndexManager.getOriginalZIndex,
    saveOriginalZIndex: ZIndexManager.saveOriginalZIndex,
    restoreOriginalZIndex: ZIndexManager.restoreOriginalZIndex
  }
}
