<template>
  <div class="system-container" :class="{ 'is-selected': isSelected, 'is-empty': isEmpty }">
    <div class="container-header">
      <el-icon :size="20">
        <Folder />
      </el-icon>
      <span class="container-title" :title="nodeData?.name">{{ displayName }}</span>
      <span class="container-count" v-if="!isEmpty">({{ childrenCount }})</span>
    </div>
    <div class="container-body">
      <div v-if="isEmpty" class="empty-hint">拖拽设备至此处</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon } from 'element-plus'
import { Folder } from '@element-plus/icons-vue'
import type { Node, Graph } from '@antv/x6'
import type { SystemNodeData } from '@/types/node'

// 接收 @antv/x6-vue-shape 传递的 props
interface Props {
  node?: Node
  graph?: Graph
}

const props = defineProps<Props>()

// 获取节点数据
const nodeData = computed(() => props.node?.getData() as SystemNodeData | undefined)

// 子节点数量
const childrenCount = computed(() => nodeData.value?.childrenIds?.length || 0)

// 是否为空容器
const isEmpty = computed(() => childrenCount.value === 0)

// 显示名称（截断过长文本）
const displayName = computed(() => {
  const name = nodeData.value?.name || '未命名系统'
  return name.length > 15 ? name.substring(0, 15) + '...' : name
})

// 是否选中（通过 graph.isSelected 检查）
const isSelected = computed(() => {
  if (!props.graph || !props.node) return false
  return props.graph.isSelected(props.node)
})
</script>

<style scoped lang="scss">
.system-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgba(245, 247, 250, 0.5);
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  cursor: move;
  pointer-events: auto;

  &:hover {
    border-color: #409eff;
    background-color: rgba(236, 245, 255, 0.6);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  }

  &.is-selected {
    border: 3px dashed #409eff;
    box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
  }

  &.is-empty {
    .container-body {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.container-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid #e4e7ed;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  pointer-events: auto;

  .el-icon {
    color: #606266;
  }
}

.container-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.container-count {
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 2px 8px;
  border-radius: 10px;
}

.container-body {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  position: relative;
  pointer-events: none;
}

.empty-hint {
  color: #c0c4cc;
  font-size: 13px;
  text-align: center;
  user-select: none;
  pointer-events: none;
}
</style>
