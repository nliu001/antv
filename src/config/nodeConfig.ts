/**
 * 节点默认配置
 * @description 定义设备节点和系统容器的默认配置项
 */

import { DeviceType, NodeStatus } from '@/types/node'

/**
 * 设备节点默认配置
 */
export const DEVICE_NODE_CONFIG = {
  // 默认尺寸
  width: 120,
  height: 80,

  // 默认样式
  attrs: {
    body: {
      fill: '#ffffff',
      stroke: '#d9d9d9',
      strokeWidth: 1,
      rx: 4,
      ry: 4
    }
  },

  // 默认数据
  defaultData: {
    deviceType: DeviceType.SERVER,
    status: NodeStatus.NORMAL,
    isManual: false
  }
}

/**
 * 系统容器默认配置
 */
export const SYSTEM_CONTAINER_CONFIG = {
  // 默认尺寸
  width: 200,
  height: 150,

  // 默认样式
  attrs: {
    body: {
      fill: 'transparent',
      stroke: '#d9d9d9',
      strokeWidth: 2,
      strokeDasharray: '5,5', // 虚线
      rx: 8,
      ry: 8
    }
  },

  // 默认数据
  defaultData: {
    minWidth: 200,
    minHeight: 150,
    padding: 20,
    autoExpand: true,
    childrenIds: []
  },

  // 默认层级
  zIndex: 0
}

/**
 * 设备类型图标映射
 */
export const DEVICE_ICON_MAP = {
  [DeviceType.SERVER]: 'Monitor',
  [DeviceType.SWITCH]: 'Connection',
  [DeviceType.ROUTER]: 'Share',
  [DeviceType.FIREWALL]: 'Lock',
  [DeviceType.STORAGE]: 'FolderOpened'
} as const

/**
 * 节点状态颜色映射
 */
export const NODE_STATUS_COLOR_MAP = {
  [NodeStatus.NORMAL]: '#52c41a',
  [NodeStatus.WARNING]: '#faad14',
  [NodeStatus.ERROR]: '#f5222d',
  [NodeStatus.OFFLINE]: '#d9d9d9'
} as const

/**
 * 节点状态文本映射
 */
export const NODE_STATUS_TEXT_MAP = {
  [NodeStatus.NORMAL]: '正常',
  [NodeStatus.WARNING]: '警告',
  [NodeStatus.ERROR]: '错误',
  [NodeStatus.OFFLINE]: '离线'
} as const
