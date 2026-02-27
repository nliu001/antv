/**
 * 坐标转换工具
 * @description 处理绝对坐标、相对坐标、包围盒检测等几何运算
 */

import type { Node } from '@antv/x6'

/**
 * 点坐标接口
 */
export interface Point {
  x: number
  y: number
}

/**
 * 包围盒接口
 */
export interface BBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 将绝对坐标转换为相对于父节点的坐标
 * @param absolutePos 绝对坐标
 * @param parentPos 父节点坐标
 * @returns 相对坐标
 */
export function toLocalCoordinate(
  absolutePos: Point,
  parentPos: Point
): Point {
  return {
    x: absolutePos.x - parentPos.x,
    y: absolutePos.y - parentPos.y
  }
}

/**
 * 将相对坐标转换为绝对坐标
 * @param localPos 相对坐标
 * @param parentPos 父节点坐标
 * @returns 绝对坐标
 */
export function toGlobalCoordinate(
  localPos: Point,
  parentPos: Point
): Point {
  return {
    x: localPos.x + parentPos.x,
    y: localPos.y + parentPos.y
  }
}

/**
 * 检测点是否在包围盒内
 * @param point 点坐标
 * @param bbox 包围盒
 * @returns 是否在包围盒内
 */
export function isPointInBBox(point: Point, bbox: BBox): boolean {
  return (
    point.x >= bbox.x &&
    point.x <= bbox.x + bbox.width &&
    point.y >= bbox.y &&
    point.y <= bbox.y + bbox.height
  )
}

/**
 * 获取节点中心点坐标
 * @param node 节点
 * @returns 中心点坐标
 */
export function getNodeCenter(node: Node): Point {
  const position = node.getPosition()
  const size = node.getSize()
  return {
    x: position.x + size.width / 2,
    y: position.y + size.height / 2
  }
}

/**
 * 获取节点包围盒
 * @param node 节点
 * @returns 包围盒
 */
export function getNodeBBox(node: Node): BBox {
  const position = node.getPosition()
  const size = node.getSize()
  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height
  }
}

/**
 * 计算两个包围盒的重叠面积
 * @param bbox1 包围盒1
 * @param bbox2 包围盒2
 * @returns 重叠面积
 */
export function calculateOverlapArea(bbox1: BBox, bbox2: BBox): number {
  const xOverlap = Math.max(
    0,
    Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width) -
      Math.max(bbox1.x, bbox2.x)
  )
  const yOverlap = Math.max(
    0,
    Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height) -
      Math.max(bbox1.y, bbox2.y)
  )
  return xOverlap * yOverlap
}

/**
 * 计算包围盒面积
 * @param bbox 包围盒
 * @returns 面积
 */
export function calculateBBoxArea(bbox: BBox): number {
  return bbox.width * bbox.height
}

/**
 * 计算两个包围盒的重叠比例
 * @param bbox1 包围盒1
 * @param bbox2 包围盒2
 * @returns 重叠比例 (0-1)
 */
export function calculateOverlapRatio(bbox1: BBox, bbox2: BBox): number {
  const overlapArea = calculateOverlapArea(bbox1, bbox2)
  const bbox1Area = calculateBBoxArea(bbox1)
  
  if (bbox1Area === 0) return 0
  
  return overlapArea / bbox1Area
}

/**
 * 检测节点是否在容器内（基于中心点）
 * @param node 节点
 * @param container 容器节点
 * @returns 是否在容器内
 */
export function isNodeInContainer(node: Node, container: Node): boolean {
  const nodeCenter = getNodeCenter(node)
  const containerBBox = getNodeBBox(container)
  
  return isPointInBBox(nodeCenter, containerBBox)
}

/**
 * 检测节点是否外溢容器（基于重叠面积）
 * @param node 节点
 * @param container 容器节点
 * @param threshold 外溢阈值 (0-1)，默认 0.5
 * @returns 是否外溢
 */
export function isNodeOutOfContainer(
  node: Node,
  container: Node,
  threshold: number = 0.5
): boolean {
  // X6 的子节点 getPosition() 返回的就是绝对坐标
  // 不需要额外的坐标转换
  const nodeBBox = getNodeBBox(node)
  const containerBBox = getNodeBBox(container)
  const overlapRatio = calculateOverlapRatio(nodeBBox, containerBBox)
  const isOut = overlapRatio < threshold
  
  return isOut
}

/**
 * 计算节点相对于父节点的坐标
 * @param node 子节点
 * @param parent 父节点
 * @returns 相对坐标
 */
export function getRelativePosition(node: Node, parent: Node): Point {
  const nodePos = node.getPosition()
  const parentPos = parent.getPosition()
  return toLocalCoordinate(nodePos, parentPos)
}

/**
 * 设置节点相对于父节点的坐标
 * @param node 子节点
 * @param parent 父节点
 * @param localPos 相对坐标
 */
export function setRelativePosition(
  node: Node,
  parent: Node,
  localPos: Point
): void {
  const parentPos = parent.getPosition()
  const absolutePos = toGlobalCoordinate(localPos, parentPos)
  node.setPosition(absolutePos)
}

/**
 * 检测节点是否与其他节点重叠
 * @param node 节点
 * @param otherNodes 其他节点列表
 * @param threshold 重叠阈值，默认 0（只要有重叠就返回 true）
 * @returns 是否重叠
 */
export function hasOverlap(
  node: Node,
  otherNodes: Node[],
  threshold: number = 0
): boolean {
  const nodeBBox = getNodeBBox(node)
  
  for (const other of otherNodes) {
    if (other.id === node.id) continue
    
    const otherBBox = getNodeBBox(other)
    const overlapArea = calculateOverlapArea(nodeBBox, otherBBox)
    
    if (overlapArea > threshold) {
      return true
    }
  }
  
  return false
}
