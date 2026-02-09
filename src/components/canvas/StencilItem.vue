<template>
  <div
    class="stencil-item"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <el-icon :size="24" class="stencil-item__icon">
      <component :is="config.icon" />
    </el-icon>
    <span class="stencil-item__label">{{ config.label }}</span>
  </div>
</template>

<script setup lang="ts">
import type { StencilItemConfig } from '@/constants/stencil'

/**
 * Props
 */
interface Props {
  config: StencilItemConfig
}

const props = defineProps<Props>()

/**
 * Emits
 */
interface Emits {
  (e: 'dragStart', config: StencilItemConfig, event: DragEvent): void
  (e: 'dragEnd', config: StencilItemConfig, event: DragEvent): void
}

const emit = defineEmits<Emits>()

/**
 * 拖拽开始
 */
const handleDragStart = (event: DragEvent) => {
  // 设置拖拽数据
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/x-stencil-item', props.config.id)
  }
  
  emit('dragStart', props.config, event)
}

/**
 * 拖拽结束
 */
const handleDragEnd = (event: DragEvent) => {
  emit('dragEnd', props.config, event)
}
</script>

<style scoped>
.stencil-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.stencil-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stencil-item:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.stencil-item__icon {
  margin-bottom: 8px;
  color: #1890ff;
}

.stencil-item__label {
  font-size: 12px;
  color: #333;
  text-align: center;
  word-break: break-word;
}
</style>
