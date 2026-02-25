/**
 * 节点工厂函数
 * @description 创建设备节点和系统容器的工厂方法
 */

import { nanoid } from 'nanoid'
import type { NodeCreateOptions, DeviceNodeData, SystemNodeData } from '@/types/node'
import { NodeType, DeviceType, NodeStatus } from '@/types/node'
import { DEVICE_NODE_CONFIG, SYSTEM_CONTAINER_CONFIG } from '@/config/nodeConfig'

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `node_${nanoid(10)}`
}

/**
 * 获取当前时间戳字符串
 */
function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * 创建设备节点配置
 * @param options 节点创建选项
 * @returns 节点配置对象
 */
export function createDeviceNode(options: Partial<Omit<NodeCreateOptions, 'data'>> & { data: Partial<DeviceNodeData> }) {
  const timestamp = getTimestamp()
  const nodeId = options.id || generateId()

  // 合并默认数据
  const nodeData: DeviceNodeData = {
    type: NodeType.DEVICE,
    deviceType: options.data.deviceType || DeviceType.SERVER,
    name: options.data.name || '新建设备',
    status: options.data.status || NodeStatus.NORMAL,
    ip: options.data.ip,
    port: options.data.port,
    isManual: options.data.isManual ?? false,
    businessData: options.data.businessData,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  return {
    id: nodeId,
    shape: 'device-node',
    x: options.position?.x || 0,
    y: options.position?.y || 0,
    width: DEVICE_NODE_CONFIG.width,
    height: DEVICE_NODE_CONFIG.height,
    data: nodeData,
    zIndex: options.zIndex || 10
  }
}

/**
 * 创建系统容器配置
 * @param options 节点创建选项
 * @returns 节点配置对象
 */
export function createSystemContainer(options: Partial<Omit<NodeCreateOptions, 'data'>> & { data: Partial<SystemNodeData> }) {
  const timestamp = getTimestamp()
  const nodeId = options.id || generateId()

  // 计算尺寸
  const width = options.size?.width || SYSTEM_CONTAINER_CONFIG.width
  const height = options.size?.height || SYSTEM_CONTAINER_CONFIG.height

  // 合并默认数据
  const nodeData: SystemNodeData = {
    type: NodeType.SYSTEM,
    name: options.data.name || '新建系统',
    description: options.data.description,
    minWidth: options.data.minWidth || SYSTEM_CONTAINER_CONFIG.defaultData.minWidth,
    minHeight: options.data.minHeight || SYSTEM_CONTAINER_CONFIG.defaultData.minHeight,
    padding: options.data.padding || SYSTEM_CONTAINER_CONFIG.defaultData.padding,
    autoExpand: options.data.autoExpand ?? SYSTEM_CONTAINER_CONFIG.defaultData.autoExpand,
    childrenIds: options.data.childrenIds || [],
    businessData: options.data.businessData,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  return {
    id: nodeId,
    shape: 'system-container',
    x: options.position?.x || 0,
    y: options.position?.y || 0,
    width,
    height,
    data: nodeData,
    zIndex: options.zIndex || SYSTEM_CONTAINER_CONFIG.zIndex
  }
}
