/**
 * 容器自动扩容配置
 * 
 * 根据验证结果和官方文档，所有坐标均为绝对坐标（相对于画布）
 * 参考：docs/04-容器自动扩容/X6坐标系统验证报告.md
 */

/**
 * 扩容配置接口
 */
export interface ExpandConfig {
  /** 内边距（四周留白），单位：px */
  padding: number
  /** 最小宽度，单位：px */
  minWidth: number
  /** 最小高度，单位：px */
  minHeight: number
  /** 位置调整阈值（小于此值不调整，避免抖动），单位：px */
  positionThreshold: number
  /** 防抖延迟，单位：ms */
  debounceDelay: number
  /** 是否启用自动扩容 */
  enabled: boolean
}

/**
 * 默认扩容配置
 * 
 * 基于方案文档 6.1.2 关键参数
 */
export const DEFAULT_EXPAND_CONFIG: ExpandConfig = {
  // 内边距：容器边缘与子节点之间的留白
  padding: 40,

  // 最小尺寸：空容器或子节点很小时的最小尺寸
  minWidth: 300,
  minHeight: 200,

  // 位置调整阈值：避免微小偏移导致的容器抖动
  positionThreshold: 5,

  // 防抖延迟：平衡响应速度和计算频率
  debounceDelay: 100,

  // 默认启用自动扩容
  enabled: true
}

/**
 * 创建自定义扩容配置
 * 
 * @param config 部分配置项
 * @returns 完整的扩容配置
 */
export function createExpandConfig(config?: Partial<ExpandConfig>): ExpandConfig {
  return {
    ...DEFAULT_EXPAND_CONFIG,
    ...config
  }
}
