/**
 * 节点注册工具
 * @description 注册自定义节点类型到 X6
 */

import { register } from '@antv/x6-vue-shape'
import DeviceNode from '@/components/nodes/DeviceNode.vue'
import SystemContainer from '@/components/nodes/SystemContainer.vue'
import { DEVICE_NODE_CONFIG, SYSTEM_CONTAINER_CONFIG } from '@/config/nodeConfig'

/**
 * 注册设备节点
 */
export function registerDeviceNode() {
  register({
    shape: 'device-node',
    width: DEVICE_NODE_CONFIG.width,
    height: DEVICE_NODE_CONFIG.height,
    component: DeviceNode,
    attrs: DEVICE_NODE_CONFIG.attrs,
    ports: {
      items: []
    }
  })
}

/**
 * 注册系统容器
 */
export function registerSystemContainer() {
  register({
    shape: 'system-container',
    width: SYSTEM_CONTAINER_CONFIG.width,
    height: SYSTEM_CONTAINER_CONFIG.height,
    component: SystemContainer,
    attrs: SYSTEM_CONTAINER_CONFIG.attrs,
    zIndex: SYSTEM_CONTAINER_CONFIG.zIndex
  })
}

/**
 * 注册所有节点类型
 */
export function registerAllNodes() {
  registerDeviceNode()
  registerSystemContainer()
  console.log('[NodeRegistry] All node types registered successfully')
}
