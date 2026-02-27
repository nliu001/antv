import type { Node } from '@antv/x6'
import { ZIndexManager } from './useZIndexManager'
import type { SystemNodeData } from '@/types/node'

export class ParentChildManager {
  static addToContainer(device: Node, container: Node): boolean {
    try {
      const currentParent = device.getParent()
      if (currentParent && currentParent.id === container.id) {
        return false
      }

      if (currentParent && currentParent.isNode()) {
        this.removeFromContainer(device, currentParent as Node)
      }

      container.addChild(device)

      ZIndexManager.setNodeZIndex(device)

      const containerData = container.getData<SystemNodeData>()
      if (containerData && containerData.childrenIds) {
        if (!containerData.childrenIds.includes(device.id!)) {
          containerData.childrenIds.push(device.id!)
          container.setData(containerData)
        }
      }

      return true
    } catch (error) {
      return false
    }
  }

  static removeFromContainer(device: Node, container: Node): boolean {
    try {
      const currentParent = device.getParent()
      if (!currentParent || currentParent.id !== container.id) {
        return false
      }

      const devicePos = device.getPosition()

      container.unembed(device)

      device.setPosition(devicePos.x, devicePos.y)

      ZIndexManager.setNodeZIndex(device)

      const containerData = container.getData<SystemNodeData>()
      if (containerData && containerData.childrenIds) {
        const index = containerData.childrenIds.indexOf(device.id!)
        if (index > -1) {
          containerData.childrenIds.splice(index, 1)
          container.setData(containerData)
        }
      }

      return true
    } catch (error) {
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
