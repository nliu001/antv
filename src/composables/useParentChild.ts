import type { Node } from '@antv/x6'
import { ZIndexManager } from './useZIndexManager'
import type { SystemNodeData } from '@/types/node'

export class ParentChildManager {
  static addToContainer(device: Node, container: Node): boolean {
    try {
      const currentParent = device.getParent()
      if (currentParent && currentParent.id === container.id) {
        console.warn('[ParentChild] 设备已在该容器中')
        return false
      }

      if (currentParent && currentParent.isNode()) {
        this.removeFromContainer(device, currentParent as Node)
      }

      const devicePos = device.getPosition()
      console.log('[ParentChild] 设备当前位置（绝对）:', devicePos)
      console.log('[ParentChild] 容器位置（绝对）:', container.getPosition())

      container.addChild(device)
      console.log('[ParentChild] addChild后设备位置:', device.getPosition())

      ZIndexManager.setNodeZIndex(device)

      const containerData = container.getData<SystemNodeData>()
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

  static removeFromContainer(device: Node, container: Node): boolean {
    try {
      const currentParent = device.getParent()
      if (!currentParent || currentParent.id !== container.id) {
        console.warn('[ParentChild] 设备不在该容器中')
        return false
      }

      const devicePos = device.getPosition()
      console.log('[ParentChild] 出组前设备位置（绝对）:', devicePos)

      container.unembed(device)
      console.log('[ParentChild] 已解除父子关系 (unembed)')

      device.setPosition(devicePos.x, devicePos.y)
      console.log('[ParentChild] 出组后设备位置已恢复:', device.getPosition())

      ZIndexManager.setNodeZIndex(device)

      const containerData = container.getData<SystemNodeData>()
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

  static isInContainer(device: Node, container: Node): boolean {
    const parent = device.getParent()
    return parent !== null && parent.id === container.id
  }

  static getChildrenIds(node: Node): string[] {
    const children = node.getChildren()
    if (!children || children.length === 0) return []
    return children.map(child => child.id!).filter(Boolean)
  }

  static clearContainer(container: Node): void {
    const children = container.getChildren()
    if (!children || children.length === 0) return

    children.forEach(child => {
      if (child.isNode()) {
        this.removeFromContainer(child as Node, container)
      }
    })

    const containerData = container.getData<SystemNodeData>()
    if (containerData) {
      containerData.childrenIds = []
      container.setData(containerData)
    }
  }
}

export function useParentChild() {
  return {
    addToContainer: ParentChildManager.addToContainer,
    removeFromContainer: ParentChildManager.removeFromContainer,
    isInContainer: ParentChildManager.isInContainer,
    getChildrenIds: ParentChildManager.getChildrenIds,
    clearContainer: ParentChildManager.clearContainer
  }
}
