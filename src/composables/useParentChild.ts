/**
 * 父子关系管理
 * @description 处理节点的入组、出组操作
 */

import type { Node } from '@antv/x6'
import { ZIndexManager } from './useZIndexManager'
import type { SystemNodeData } from '@/types/node'

/**
 * 父子关系管理器
 */
export class ParentChildManager {
  /**
   * 将设备节点加入容器（入组）
   * @param device 设备节点
   * @param container 容器节点
   * @returns 是否成功
   */
  static addToContainer(device: Node, container: Node): boolean {
    try {
      // 1. 检查是否已有父节点
      const currentParent = device.getParent()
      if (currentParent && currentParent.id === container.id) {
        console.warn('[ParentChild] 设备已在该容器中')
        return false
      }

      // 2. 如果有其他父节点，先出组
      if (currentParent) {
        this.removeFromContainer(device, currentParent)
      }

      // 3. 记录设备当前位置（绝对坐标）
      const devicePos = device.getPosition()
      console.log('[ParentChild] 设备当前位置（绝对）:', devicePos)
      console.log('[ParentChild] 容器位置（绝对）:', container.getPosition())

      // 4. 建立父子关系
      // 重要：X6 的 addChild 不会改变子节点的坐标值
      // 子节点的 getPosition() 仍然返回绝对坐标
      // 移动父节点时，子节点会自动跟随（内部 translate 机制）
      container.addChild(device)
      console.log('[ParentChild] addChild后设备位置:', device.getPosition())

      // 5. 更新 zIndex（子节点应该高于父节点）
      ZIndexManager.setNodeZIndex(device)

      // 6. 更新容器数据模型的 childrenIds
      const containerData = container.getData() as SystemNodeData
      if (containerData && containerData.childrenIds) {
        if (!containerData.childrenIds.includes(device.id!)) {
          containerData.childrenIds.push(device.id!)
          container.setData(containerData)
        }
      }

      console.log('[ParentChild] 入组成功:', {
        device: device.id,
        container: container.id,
        devicePos
      })

      return true
    } catch (error) {
      console.error('[ParentChild] 入组失败:', error)
      return false
    }
  }

  /**
   * 将设备节点从容器移出（出组）
   * @param device 设备节点
   * @param container 容器节点
   * @returns 是否成功
   */
  static removeFromContainer(device: Node, container: Node): boolean {
    try {
      // 1. 检查是否确实在该容器中
      const currentParent = device.getParent()
      if (!currentParent || currentParent.id !== container.id) {
        console.warn('[ParentChild] 设备不在该容器中')
        return false
      }

      // 2. 记录设备当前位置（绝对坐标，X6 子节点位置就是绝对坐标）
      const devicePos = device.getPosition()

      // 3. 移除父子关系
      container.removeChild(device)

      // 4. 恢复设备节点的 zIndex
      ZIndexManager.setNodeZIndex(device)

      // 5. 更新容器数据模型的 childrenIds
      const containerData = container.getData() as SystemNodeData
      if (containerData && containerData.childrenIds) {
        const index = containerData.childrenIds.indexOf(device.id!)
        if (index > -1) {
          containerData.childrenIds.splice(index, 1)
          container.setData(containerData)
        }
      }

      console.log('[ParentChild] 出组成功:', {
        device: device.id,
        container: container.id,
        devicePos
      })

      return true
    } catch (error) {
      console.error('[ParentChild] 出组失败:', error)
      return false
    }
  }

  /**
   * 检查设备节点是否在容器中
   * @param device 设备节点
   * @param container 容器节点
   * @returns 是否在容器中
   */
  static isInContainer(device: Node, container: Node): boolean {
    const parent = device.getParent()
    return parent !== null && parent.id === container.id
  }

  /**
   * 获取节点的所有子节点 ID
   * @param node 节点
   * @returns 子节点 ID 列表
   */
  static getChildrenIds(node: Node): string[] {
    const children = node.getChildren()
    if (!children || children.length === 0) return []
    return children.map(child => child.id!).filter(Boolean)
  }

  /**
   * 清空容器的所有子节点
   * @param container 容器节点
   */
  static clearContainer(container: Node): void {
    const children = container.getChildren()
    if (!children || children.length === 0) return

    // 依次移除所有子节点
    children.forEach(child => {
      this.removeFromContainer(child, container)
    })

    // 清空数据模型的 childrenIds
    const containerData = container.getData() as SystemNodeData
    if (containerData) {
      containerData.childrenIds = []
      container.setData(containerData)
    }
  }
}

/**
 * useParentChild Hook
 */
export function useParentChild() {
  return {
    addToContainer: ParentChildManager.addToContainer,
    removeFromContainer: ParentChildManager.removeFromContainer,
    isInContainer: ParentChildManager.isInContainer,
    getChildrenIds: ParentChildManager.getChildrenIds,
    clearContainer: ParentChildManager.clearContainer
  }
}
