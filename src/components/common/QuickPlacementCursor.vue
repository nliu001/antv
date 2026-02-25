<template>
  <Teleport to="body">
    <div 
      v-if="isActive && currentConfig"
      class="quick-placement-cursor"
      :style="cursorStyle"
    >
      <div class="cursor-preview">
        <el-icon class="preview-icon" :size="24">
          <component :is="currentConfig.icon" />
        </el-icon>
        <span class="preview-label">{{ currentConfig.label }}</span>
      </div>
      <div class="cursor-hint">
        <span>点击放置</span>
        <span class="hint-divider">|</span>
        <span>右键取消</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StencilItemConfig } from '@/constants/stencil'

interface Props {
  isActive: boolean
  currentConfig: StencilItemConfig | null
  cursorPosition: { x: number; y: number }
}

const props = defineProps<Props>()

const cursorStyle = computed(() => ({
  left: `${props.cursorPosition.x + 15}px`,
  top: `${props.cursorPosition.y + 15}px`
}))
</script>

<style scoped>
.quick-placement-cursor {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  animation: fadeIn 0.15s ease-out;
}

.cursor-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 2px solid var(--el-color-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-icon {
  color: var(--el-color-primary);
}

.preview-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.cursor-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.hint-divider {
  opacity: 0.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
