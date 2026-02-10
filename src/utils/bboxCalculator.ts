import type { Graph, Node } from '@antv/x6'

/**
 * 包围盒接口
 * 
 * 根据 X6 官方验证，所有坐标均为绝对坐标（相对于画布）
 * 参考：docs/04-容器自动扩容/X6坐标系统验证报告.md
 */
export interface BBox {
  /** 左上角 x 坐标（绝对坐标） */
  x: number
  /** 左上角 y 坐标（绝对坐标） */
  y: number
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
}

/**
 * 获取节点包围盒（绝对坐标）
 * 
 * 根据 X6 官方文档和 Q1 验证结果：
 * - node.getBBox() 返回的是绝对坐标（相对于画布）
 * - 不需要进行任何坐标转换
 * 
 * @param node X6 节点
 * @returns 包围盒（绝对坐标）
 */
export function getNodeBBox(node: Node): BBox {
  return node.getBBox()
}

/**
 * 计算多个节点的并集包围盒（绝对坐标）
 * 
 * 优先使用 X6 原生方法 graph.getCellsBBox()
 * 根据 Q2 验证结果：返回的是绝对坐标
 * 
 * @param nodes 节点数组
 * @param graph Graph 实例（优先使用原生方法）
 * @returns 并集包围盒（绝对坐标），如果节点为空则返回 null
 */
export function calculateUnionBBox(nodes: Node[], graph?: Graph): BBox | null {
  // 空数组检查
  if (nodes.length === 0) {
    return null
  }

  // 优先使用 X6 原生方法（性能更好）
  if (graph) {
    // ✅ 注意：getCellsBBox() 是 graph 实例方法，不是 Graph 静态方法
    // ✅ 返回的坐标是绝对坐标（相对于画布），不需要转换
    return graph.getCellsBBox(nodes)
  }

  // 手动计算（fallback）
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((node) => {
    const bbox = node.getBBox() // 绝对坐标
    minX = Math.min(minX, bbox.x)
    minY = Math.min(minY, bbox.y)
    maxX = Math.max(maxX, bbox.x + bbox.width)
    maxY = Math.max(maxY, bbox.y + bbox.height)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * 检查包围盒是否有效
 * 
 * @param bbox 包围盒
 * @returns 是否有效
 */
export function isValidBBox(bbox: BBox | null): bbox is BBox {
  return (
    bbox !== null &&
    Number.isFinite(bbox.x) &&
    Number.isFinite(bbox.y) &&
    bbox.width > 0 &&
    bbox.height > 0
  )
}

/**
 * 计算包围盒的右下角坐标
 * 
 * @param bbox 包围盒
 * @returns 右下角坐标 { x, y }
 */
export function getBBoxCorner(bbox: BBox): { x: number; y: number } {
  return {
    x: bbox.x + bbox.width,
    y: bbox.y + bbox.height
  }
}

/**
 * 扩展包围盒（添加内边距）
 * 
 * @param bbox 原始包围盒
 * @param padding 内边距
 * @returns 扩展后的包围盒
 */
export function expandBBox(bbox: BBox, padding: number): BBox {
  return {
    x: bbox.x - padding,
    y: bbox.y - padding,
    width: bbox.width + padding * 2,
    height: bbox.height + padding * 2
  }
}
