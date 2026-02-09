/**
 * 节点数据类型定义
 * @description 定义设备节点和系统容器的数据模型
 */

/**
 * 节点类型
 */
export const NodeType = {
  DEVICE: 'device',
  SYSTEM: 'system'
} as const

export type NodeType = (typeof NodeType)[keyof typeof NodeType]

/**
 * 设备类型
 */
export const DeviceType = {
  SERVER: 'server',
  SWITCH: 'switch',
  ROUTER: 'router',
  FIREWALL: 'firewall',
  STORAGE: 'storage'
} as const

export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType]

/**
 * 节点状态
 */
export const NodeStatus = {
  NORMAL: 'normal',
  WARNING: 'warning',
  ERROR: 'error',
  OFFLINE: 'offline'
} as const

export type NodeStatus = (typeof NodeStatus)[keyof typeof NodeStatus]

/**
 * 设备节点数据
 */
export interface DeviceNodeData {
  // 节点类型
  type: typeof NodeType.DEVICE

  // 设备类型
  deviceType: DeviceType

  // 设备名称
  name: string

  // 设备状态
  status: NodeStatus

  // 设备 IP 地址
  ip?: string

  // 设备端口号
  port?: number

  // 是否手动布局（锁定位置）
  isManual: boolean

  // 业务自定义数据
  businessData?: Record<string, any>

  // 创建时间
  createdAt: string

  // 更新时间
  updatedAt: string
}

/**
 * 系统容器数据
 */
export interface SystemNodeData {
  // 节点类型
  type: typeof NodeType.SYSTEM

  // 系统名称
  name: string

  // 系统描述
  description?: string

  // 最小宽度
  minWidth: number

  // 最小高度
  minHeight: number

  // 内边距
  padding: number

  // 是否自动扩容
  autoExpand: boolean

  // 子节点 ID 列表
  childrenIds: string[]

  // 业务自定义数据
  businessData?: Record<string, any>

  // 创建时间
  createdAt: string

  // 更新时间
  updatedAt: string
}

/**
 * 节点数据联合类型
 */
export type NodeData = DeviceNodeData | SystemNodeData

/**
 * 节点创建配置
 */
export interface NodeCreateOptions {
  // 节点 ID（可选，不传则自动生成）
  id?: string

  // 节点位置
  position: { x: number; y: number }

  // 节点尺寸（容器节点必传）
  size?: { width: number; height: number }

  // 节点数据
  data: NodeData

  // 父节点 ID（可选）
  parentId?: string

  // 初始 zIndex（可选）
  zIndex?: number
}
