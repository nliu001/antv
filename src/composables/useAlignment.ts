import { toRaw } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import type { Node, Graph } from '@antv/x6'

export type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
export type DistributeMode = 'horizontal' | 'vertical'

export interface UseAlignmentReturn {
  alignLeft: () => void
  alignCenter: () => void
  alignRight: () => void
  alignTop: () => void
  alignMiddle: () => void
  alignBottom: () => void
  distributeHorizontally: () => void
  distributeVertically: () => void
}

export function useAlignment(): UseAlignmentReturn {
  const graphStore = useGraphStore()

  const getGraph = (): Graph | null => {
    const graph = graphStore.graph
    if (!graph) return null
    return toRaw(graph) as Graph
  }

  const getSelectedNodes = (): Node[] => {
    const graph = getGraph()
    if (!graph) {
      return []
    }
    
    const cells = graph.getSelectedCells()
    return cells.filter(cell => cell.isNode && cell.isNode()) as Node[]
  }

  const getNodesBBox = (nodes: ReturnType<typeof getSelectedNodes>) => {
    if (nodes.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    nodes.forEach(node => {
      const bbox = node.getBBox()
      minX = Math.min(minX, bbox.x)
      minY = Math.min(minY, bbox.y)
      maxX = Math.max(maxX, bbox.x + bbox.width)
      maxY = Math.max(maxY, bbox.y + bbox.height)
    })

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    }
  }

  const alignNodes = (mode: AlignMode) => {
    const nodes = getSelectedNodes()
    if (nodes.length < 2) {
      return
    }

    const bbox = getNodesBBox(nodes)
    if (!bbox) return

    nodes.forEach(node => {
      const nodeBBox = node.getBBox()
      let newX = nodeBBox.x
      let newY = nodeBBox.y

      switch (mode) {
        case 'left':
          newX = bbox.minX
          break
        case 'center':
          newX = bbox.centerX - nodeBBox.width / 2
          break
        case 'right':
          newX = bbox.maxX - nodeBBox.width
          break
        case 'top':
          newY = bbox.minY
          break
        case 'middle':
          newY = bbox.centerY - nodeBBox.height / 2
          break
        case 'bottom':
          newY = bbox.maxY - nodeBBox.height
          break
      }

      node.setPosition(newX, newY)
    })
  }

  const distributeNodes = (mode: DistributeMode) => {
    const nodes = getSelectedNodes()
    if (nodes.length < 3) {
      return
    }

    const bbox = getNodesBBox(nodes)
    if (!bbox) return

    const sortedNodes = [...nodes].sort((a, b) => {
      if (mode === 'horizontal') {
        return a.getBBox().x - b.getBBox().x
      }
      return a.getBBox().y - b.getBBox().y
    })

    if (mode === 'horizontal') {
      const totalWidth = sortedNodes.reduce((sum, node) => sum + node.getBBox().width, 0)
      const totalGap = bbox.width - totalWidth
      const gap = totalGap / (sortedNodes.length - 1)

      let currentX = bbox.minX
      sortedNodes.forEach(node => {
        const nodeBBox = node.getBBox()
        node.setPosition(currentX, nodeBBox.y)
        currentX += nodeBBox.width + gap
      })
    } else {
      const totalHeight = sortedNodes.reduce((sum, node) => sum + node.getBBox().height, 0)
      const totalGap = bbox.height - totalHeight
      const gap = totalGap / (sortedNodes.length - 1)

      let currentY = bbox.minY
      sortedNodes.forEach(node => {
        const nodeBBox = node.getBBox()
        node.setPosition(nodeBBox.x, currentY)
        currentY += nodeBBox.height + gap
      })
    }
  }

  const alignLeft = () => alignNodes('left')
  const alignCenter = () => alignNodes('center')
  const alignRight = () => alignNodes('right')
  const alignTop = () => alignNodes('top')
  const alignMiddle = () => alignNodes('middle')
  const alignBottom = () => alignNodes('bottom')
  const distributeHorizontally = () => distributeNodes('horizontal')
  const distributeVertically = () => distributeNodes('vertical')

  return {
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    distributeHorizontally,
    distributeVertically,
  }
}
