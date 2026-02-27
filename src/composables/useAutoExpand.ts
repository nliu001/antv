import { ref, onUnmounted } from 'vue'
import type { Graph, Node } from '@antv/x6'
import { throttle } from 'lodash-es'
import { calculateUnionBBox, isValidBBox } from '@/utils/bboxCalculator'
import { DEFAULT_EXPAND_CONFIG, type ExpandConfig } from '@/config/containerConfig'
import { NodeType } from '@/types/node'
import { useGraphStore } from '@/stores/graphStore'

export function useAutoExpand(initialGraph: Graph | null = null, config: Partial<ExpandConfig> = {}) {
  const expandConfig = { ...DEFAULT_EXPAND_CONFIG, ...config }

  let graph = initialGraph

  const isExpanding = ref(false)
  const isPaused = ref(false)
  const movingContainerId = ref<string | null>(null)

  const eventHandlers: Array<() => void> = []

  function expandContainer(container: Node) {
    if (!graph || !expandConfig.enabled) return
    if (isExpanding.value) return
    if (isPaused.value) return
    if (movingContainerId.value === container.id) return

    isExpanding.value = true

    try {
      const oldPos = container.getPosition()
      const oldSize = container.getSize()

      const children = container.getChildren()
      if (!children || children.length === 0) {
        container.resize(expandConfig.minWidth, expandConfig.minHeight)
        return
      }

      const childNodes = children.filter((child) => child.isNode()) as Node[]
      if (childNodes.length === 0) {
        container.resize(expandConfig.minWidth, expandConfig.minHeight)
        return
      }

      const unionBBox = calculateUnionBBox(childNodes, graph)
      if (!isValidBBox(unionBBox)) {
        return
      }

      const childWithPaddingX = unionBBox.x - expandConfig.padding
      const childWithPaddingY = unionBBox.y - expandConfig.padding
      
      const newX = Math.min(oldPos.x, childWithPaddingX)
      const newY = Math.min(oldPos.y, childWithPaddingY)

      const oldRight = oldPos.x + oldSize.width
      const oldBottom = oldPos.y + oldSize.height
      
      const childRight = unionBBox.x + unionBBox.width + expandConfig.padding
      const childBottom = unionBBox.y + unionBBox.height + expandConfig.padding
      
      const newRight = Math.max(oldRight, childRight)
      const newBottom = Math.max(oldBottom, childBottom)

      let newWidth = newRight - newX
      let newHeight = newBottom - newY
      
      newWidth = Math.max(newWidth, expandConfig.minWidth)
      newHeight = Math.max(newHeight, expandConfig.minHeight)

      const needMoveLeft = newX < oldPos.x
      const needMoveUp = newY < oldPos.y
      const positionChanged = needMoveLeft || needMoveUp

      if (positionChanged) {
        container.setPosition(newX, newY)
      }

      container.resize(newWidth, newHeight, { 
        absolute: true,
        silent: false 
      })
    } finally {
      isExpanding.value = false
    }
  }

  const throttledExpand = throttle(expandContainer, expandConfig.debounceDelay, {
    leading: true,
    trailing: true
  })

  function setGraph(newGraph: Graph) {
    graph = newGraph
  }

  function enable() {
    if (!graph) return

    const graphInstance = graph

    const containerMoveStartHandler = ({ node }: { node: Node }) => {
      const nodeData = node.getData()
      if (nodeData?.type === NodeType.SYSTEM) {
        movingContainerId.value = node.id
      }
    }
    graphInstance.on('node:move', containerMoveStartHandler)
    eventHandlers.push(() => graphInstance.off('node:move', containerMoveStartHandler))

    const containerMoveEndHandler = ({ node }: { node: Node }) => {
      if (movingContainerId.value === node.id) {
        movingContainerId.value = null
      }
    }
    graphInstance.on('node:moved', containerMoveEndHandler)
    eventHandlers.push(() => graphInstance.off('node:moved', containerMoveEndHandler))

    const positionHandler = ({ node }: { node: Node }) => {
      if (isExpanding.value) return

      if (!movingContainerId.value) {
        const parent = node.getParent()
        if (parent && parent.isNode()) {
          const parentData = parent.getData()
          if (parentData?.type === NodeType.SYSTEM) {
            throttledExpand(parent)
          }
        }
        return
      }

      let currentAncestor: Node | null = node.getParent() as Node | null
      while (currentAncestor) {
        if (currentAncestor.id === movingContainerId.value) {
          return
        }
        currentAncestor = currentAncestor.getParent() as Node | null
      }

      const parent = node.getParent()
      if (parent && parent.isNode()) {
        const parentData = parent.getData()
        if (parentData?.type === NodeType.SYSTEM) {
          throttledExpand(parent)
        }
      }
    }
    graphInstance.on('node:change:position', positionHandler)
    eventHandlers.push(() => graphInstance.off('node:change:position', positionHandler))

    const sizeHandler = ({ node }: { node: Node }) => {
      if (isExpanding.value) return

      if (movingContainerId.value) {
        let currentAncestor: Node | null = node.getParent() as Node | null
        while (currentAncestor) {
          if (currentAncestor.id === movingContainerId.value) {
            return
          }
          currentAncestor = currentAncestor.getParent() as Node | null
        }
      }

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
  }

  function disable() {
    eventHandlers.forEach((cleanup) => cleanup())
    eventHandlers.length = 0
    throttledExpand.cancel()
  }

  function manualExpand(container: Node) {
    throttledExpand.cancel()
    expandContainer(container)
  }

  function pause() {
    isPaused.value = true
  }

  function resume() {
    const graphStore = useGraphStore()
    if (graphStore.isLocked) {
      return
    }
    isPaused.value = false
  }

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
