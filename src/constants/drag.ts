/**
 * 拖拽相关常量配置
 */

/**
 * 入组检测延迟（毫秒）
 * 防止快速拖拽时误触入组
 */
export const ENTER_GROUP_DELAY = 200

/**
 * 出组检测延迟（毫秒）
 */
export const LEAVE_GROUP_DELAY = 100

/**
 * 出组面积阈值（百分比）
 * 节点外溢容器超过此阈值才触发出组
 */
export const LEAVE_OVERLAP_THRESHOLD = 0.5

/**
 * 容器高亮样式
 */
export const CONTAINER_HIGHLIGHT_STYLE = {
  stroke: '#1890ff',
  strokeWidth: 3,
  fill: 'rgba(24, 144, 255, 0.05)'
}

/**
 * 容器正常样式
 */
export const CONTAINER_NORMAL_STYLE = {
  stroke: '#d9d9d9',
  strokeWidth: 2,
  fill: 'transparent'
}

/**
 * zIndex 层级常量
 */
export const Z_INDEX = {
  CONTAINER: 0,
  DEVICE: 10,
  SELECTED: 999,
  DRAGGING: 1000
}

/**
 * 拖拽节流延迟（毫秒）
 */
export const DRAG_THROTTLE_DELAY = 16

/**
 * 动画过渡时间（毫秒）
 */
export const ANIMATION_DURATION = 200
