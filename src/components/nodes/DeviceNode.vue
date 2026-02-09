<template>
  <div class="device-node" :class="{ 'is-selected': isSelected, 'is-error': isError }">
    <div class="device-icon">
      <el-icon :size="32">
        <component :is="iconComponent" />
      </el-icon>
    </div>
    <div class="device-name" :title="nodeData?.name">{{ displayName }}</div>
    <div class="device-status">
      <span class="status-dot" :style="{ backgroundColor: statusColor }"></span>
      <span class="status-text">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon } from 'element-plus'
import { Monitor, Connection, Share, Lock, FolderOpened } from '@element-plus/icons-vue'
import type { Node, Graph } from '@antv/x6'
import type { DeviceNodeData } from '@/types/node'
import { DEVICE_ICON_MAP, NODE_STATUS_COLOR_MAP, NODE_STATUS_TEXT_MAP } from '@/config/nodeConfig'
import { NodeStatus } from '@/types/node'

// 接收 @antv/x6-vue-shape 传递的 props
interface Props {
  node?: Node
  graph?: Graph
}

const props = defineProps<Props>()

// 获取节点数据
const nodeData = computed(() => props.node?.getData() as DeviceNodeData | undefined)

// 图标组件映射
const iconComponentMap = {
  Monitor,
  Connection,
  Share,
  Lock,
  FolderOpened
}

// 计算图标组件
const iconComponent = computed(() => {
  const deviceType = nodeData.value?.deviceType
  if (!deviceType) return Monitor
  const iconName = DEVICE_ICON_MAP[deviceType]
  return iconComponentMap[iconName] || Monitor
})

// 状态颜色
const statusColor = computed(() => {
  const status = nodeData.value?.status || NodeStatus.NORMAL
  return NODE_STATUS_COLOR_MAP[status]
})

// 状态文本
const statusText = computed(() => {
  const status = nodeData.value?.status || NodeStatus.NORMAL
  return NODE_STATUS_TEXT_MAP[status]
})

// 显示名称（截断过长文本）
const displayName = computed(() => {
  const name = nodeData.value?.name || '未命名设备'
  return name.length > 10 ? name.substring(0, 10) + '...' : name
})

// 是否选中（通过 graph.isSelected 检查）
const isSelected = computed(() => {
  if (!props.graph || !props.node) return false
  return props.graph.isSelected(props.node)
})

// 是否错误状态
const isError = computed(() => nodeData.value?.status === NodeStatus.ERROR)
</script>

<style scoped lang="scss">
.device-node {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  cursor: move;

  &:hover {
    border-color: #409eff;
    background-color: #ecf5ff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }

  &.is-selected {
    border: 2px solid #409eff;
    box-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
  }

  &.is-error {
    animation: error-blink 1s infinite;
  }
}

.device-icon {
  color: #606266;
  margin-bottom: 4px;
}

.device-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  text-align: center;
  margin-bottom: 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-text {
  color: #909399;
}

@keyframes error-blink {
  0%,
  100% {
    border-color: #f5222d;
  }
  50% {
    border-color: #ff7875;
  }
}
</style>
