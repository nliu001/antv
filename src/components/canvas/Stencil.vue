<template>
  <div class="stencil-panel">
    <!-- 标题栏 -->
    <div class="stencil-panel__header">
      <el-icon :size="18">
        <Grid />
      </el-icon>
      <span class="stencil-panel__title">物料面板</span>
    </div>

    <!-- 物料分组 -->
    <div class="stencil-panel__content">
      <el-collapse v-model="activeGroups">
        <el-collapse-item
          v-for="group in groups"
          :key="group.name"
          :name="group.name"
        >
          <!-- 分组标题 -->
          <template #title>
            <div class="stencil-group__title">
              <el-icon :size="16">
                <component :is="group.icon || 'Grid'" />
              </el-icon>
              <span>{{ group.title }}</span>
            </div>
          </template>

          <!-- 物料项列表 -->
          <div class="stencil-group__items">
            <StencilItem
              v-for="item in group.items"
              :key="item.id"
              :config="item"
              :active-id="activeItemId"
              @drag-start="handleItemDragStart"
              @drag-end="handleItemDragEnd"
              @click="handleItemClick"
            />
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Grid } from '@element-plus/icons-vue'
import StencilItem from './StencilItem.vue'
import { STENCIL_GROUPS } from '@/constants/stencil'
import type { StencilItemConfig } from '@/constants/stencil'

/**
 * Props
 */
interface Props {
  groups?: typeof STENCIL_GROUPS
  activeItemId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  groups: () => STENCIL_GROUPS,
  activeItemId: null
})

/**
 * Emits
 */
interface Emits {
  (e: 'itemDragStart', config: StencilItemConfig, event: DragEvent): void
  (e: 'itemDragEnd', config: StencilItemConfig, event: DragEvent): void
  (e: 'itemClick', config: StencilItemConfig): void
}

const emit = defineEmits<Emits>()

/**
 * 默认展开的分组（数组支持多个分组同时展开）
 */
const activeGroups = ref<string[]>(['device', 'container'])

/**
 * 物料项拖拽开始
 */
const handleItemDragStart = (config: StencilItemConfig, event: DragEvent) => {
  emit('itemDragStart', config, event)
}

/**
 * 物料项拖拽结束
 */
const handleItemDragEnd = (config: StencilItemConfig, event: DragEvent) => {
  emit('itemDragEnd', config, event)
}

/**
 * 物料项点击（进入快速放置模式）
 */
const handleItemClick = (config: StencilItemConfig) => {
  emit('itemClick', config)
}
</script>

<style scoped>
.stencil-panel {
  width: 240px;
  height: 100%;
  background-color: #fafafa;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stencil-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.stencil-panel__title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.stencil-panel__content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.stencil-group__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.stencil-group__items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 8px 0;
}

/* 自定义滚动条样式 */
.stencil-panel__content::-webkit-scrollbar {
  width: 6px;
}

.stencil-panel__content::-webkit-scrollbar-thumb {
  background-color: #d9d9d9;
  border-radius: 3px;
}

.stencil-panel__content::-webkit-scrollbar-thumb:hover {
  background-color: #bfbfbf;
}

/* Element Plus Collapse 自定义样式 */
:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  background-color: #fff;
  border: none;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 8px;
}

:deep(.el-collapse-item__wrap) {
  background-color: transparent;
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 0 4px;
}
</style>
