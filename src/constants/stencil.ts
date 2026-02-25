/**
 * 物料面板配置
 */

import { NodeType, DeviceType } from '@/types/node'
import type { DeviceNodeData, SystemNodeData } from '@/types/node'

/**
 * 物料项配置接口
 */
export interface StencilItemConfig {
  // 唯一标识
  id: string
  
  // 显示名称
  label: string
  
  // 图标名称（Element Plus Icon）
  icon: string
  
  // 节点类型
  nodeType: NodeType
  
  // 设备类型（仅设备节点）
  deviceType?: DeviceType
  
  // 节点宽度
  width: number
  
  // 节点高度
  height: number
  
  // 默认数据生成函数
  createData: () => Partial<DeviceNodeData | SystemNodeData>
}

/**
 * 物料分组配置
 */
export interface StencilGroup {
  // 分组名称
  name: string
  
  // 分组标题
  title: string
  
  // 分组图标
  icon?: string
  
  // 物料项列表
  items: StencilItemConfig[]
}

/**
 * 设备分组配置
 */
export const DEVICE_GROUP: StencilGroup = {
  name: 'device',
  title: '设备节点',
  icon: 'Monitor',
  items: [
    {
      id: 'device-server',
      label: '服务器',
      icon: 'Monitor',
      nodeType: NodeType.DEVICE,
      deviceType: DeviceType.SERVER,
      width: 120,
      height: 80,
      createData: () => ({
        type: NodeType.DEVICE,
        deviceType: DeviceType.SERVER,
        name: '服务器',
        status: 'normal' as const,
        isManual: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    {
      id: 'device-switch',
      label: '交换机',
      icon: 'Operation',
      nodeType: NodeType.DEVICE,
      deviceType: DeviceType.SWITCH,
      width: 120,
      height: 80,
      createData: () => ({
        type: NodeType.DEVICE,
        deviceType: DeviceType.SWITCH,
        name: '交换机',
        status: 'normal' as const,
        isManual: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    {
      id: 'device-router',
      label: '路由器',
      icon: 'Connection',
      nodeType: NodeType.DEVICE,
      deviceType: DeviceType.ROUTER,
      width: 120,
      height: 80,
      createData: () => ({
        type: NodeType.DEVICE,
        deviceType: DeviceType.ROUTER,
        name: '路由器',
        status: 'normal' as const,
        isManual: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    {
      id: 'device-firewall',
      label: '防火墙',
      icon: 'Shield',
      nodeType: NodeType.DEVICE,
      deviceType: DeviceType.FIREWALL,
      width: 120,
      height: 80,
      createData: () => ({
        type: NodeType.DEVICE,
        deviceType: DeviceType.FIREWALL,
        name: '防火墙',
        status: 'normal' as const,
        isManual: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    {
      id: 'device-storage',
      label: '存储设备',
      icon: 'Box',
      nodeType: NodeType.DEVICE,
      deviceType: DeviceType.STORAGE,
      width: 120,
      height: 80,
      createData: () => ({
        type: NodeType.DEVICE,
        deviceType: DeviceType.STORAGE,
        name: '存储设备',
        status: 'normal' as const,
        isManual: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  ]
}

/**
 * 容器分组配置
 */
export const CONTAINER_GROUP: StencilGroup = {
  name: 'container',
  title: '系统容器',
  icon: 'Grid',
  items: [
    {
      id: 'container-system',
      label: '系统容器',
      icon: 'Grid',
      nodeType: NodeType.SYSTEM,
      width: 300,
      height: 200,
      createData: () => ({
        type: NodeType.SYSTEM,
        name: '系统容器',
        description: '系统描述',
        minWidth: 200,
        minHeight: 150,
        padding: 20,
        autoExpand: true,
        childrenIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  ]
}

/**
 * 所有物料分组
 */
export const STENCIL_GROUPS: StencilGroup[] = [
  DEVICE_GROUP,
  CONTAINER_GROUP
]
