/**
 * zIndex 层级管理器
 * @description 管理节点的 z 轴层级顺序
 */

import type { Node } from '@antv/x6'
import { Z_INDEX } from '@/constants/drag'
import { NodeType } from '@/types/node'

/**
 * zIndex 管理器类
 */
export class ZIndexManager {
  /**
   * 获取节点应有的 zIndex
   * @param node 节点
   * @returns zIndex 值
   */
  static getNodeZIndex(node: Node): number {
    const nodeData = node.getData() as any
    const nodeType = nodeData?.type

    // 根据节点类型返回默认 zIndex
    if (nodeType === NodeType.SYSTEM) {
      return Z_INDEX.CONTAINER
    }

    if (nodeType === NodeType.DEVICE) {
      // 如果有父节点，应该高于父节点
      const parent = node.getParent()
      if (parent) {
        const parentZIndex = parent.getZIndex() || Z_INDEX.CONTAINER
        return parentZIndex + Z_INDEX.DEVICE
      }
      return Z_INDEX.DEVICE
    }

    // 默认返回设备层级
    return Z_INDEX.DEVICE
  }

  /**
   * 设置节点的 zIndex
   * @param node 节点
   * @param zIndex zIndex 值（可选，不传则自动计算）
   */
  static setNodeZIndex(node: Node, zIndex?: number): void {
    const finalZIndex = zIndex ?? this.getNodeZIndex(node)
    node.setZIndex(finalZIndex)
  }

  /**
   * 将节点置于顶层
   * @param node 节点
   */
  static bringToFront(node: Node): void {
    node.setZIndex(Z_INDEX.DRAGGING)
  }

  /**
   * 将节点置于底层
   * @param node 节点
   */
  static sendToBack(node: Node): void {
    node.setZIndex(Z_INDEX.CONTAINER)
  }

  /**
   * 更新子树的 zIndex
   * @param parent 父节点
   */
  static updateChildrenZIndex(parent: Node): void {
    const children = parent.getChildren()
    if (!children || children.length === 0) return

    const parentZIndex = parent.getZIndex() || Z_INDEX.CONTAINER

    children.forEach((child) => {
      // 子节点应该高于父节点
      child.setZIndex(parentZIndex + Z_INDEX.DEVICE)
      
      // 递归更新子节点的子节点
      this.updateChildrenZIndex(child)
    })
  }

  /**
   * 重置所有节点的 zIndex
   * @param nodes 节点列表
   */
  static resetAllZIndex(nodes: Node[]): void {
    nodes.forEach((node) => {
      this.setNodeZIndex(node)
      this.updateChildrenZIndex(node)
    })
  }

  /**
   * 获取节点的原始 zIndex（拖拽前保存）
   * @param node 节点
   * @returns 原始 zIndex
   */
  static getOriginalZIndex(node: Node): number {
    const stored = node.store.get('originalZIndex')
    return stored !== undefined ? stored : this.getNodeZIndex(node)
  }

  /**
   * 保存节点的原始 zIndex
   * @param node 节点
   */
  static saveOriginalZIndex(node: Node): void {
    const currentZIndex = node.getZIndex() || this.getNodeZIndex(node)
    node.store.set('originalZIndex', currentZIndex)
  }

  /**
   * 恢复节点的原始 zIndex
   * @param node 节点
   */
  static restoreOriginalZIndex(node: Node): void {
    const originalZIndex = this.getOriginalZIndex(node)
    node.setZIndex(originalZIndex)
    node.store.delete('originalZIndex')
  }
}

/**
 * useZIndexManager Hook
 */
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
