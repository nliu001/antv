<script setup lang="ts">
import GraphCanvas from './components/canvas/GraphCanvas.vue'
import Toolbar from './components/canvas/Toolbar.vue'
import Stencil from './components/canvas/Stencil.vue'
import QuickPlacementCursor from './components/common/QuickPlacementCursor.vue'
import { useDnd } from '@/composables/useDnd'
import { useNodeDrop } from '@/composables/useNodeDrop'
import { useKeyboardState } from '@/composables/useKeyboardState'
import { useQuickPlacement } from '@/composables/useQuickPlacement'
import type { StencilItemConfig } from '@/constants/stencil'

// 初始化键盘状态管理
const keyboard = useKeyboardState()

// 初始化 Dnd 拖拽功能
const { startDrag } = useDnd({
  scaled: true
})

// 初始化入组/出组检测
useNodeDrop({
  leaveDelay: 100,
  leaveThreshold: 0.5,
  // ⭐ 传递 Ctrl 键状态检查函数
  isCtrlPressed: () => keyboard.isCtrlPressed.value
})

// 初始化快速放置模式
const quickPlacement = useQuickPlacement()

/**
 * 处理物料项拖拽开始
 */
const handleStencilDragStart = (config: StencilItemConfig, event: DragEvent) => {
  console.log('开始拖拽:', config.label)
  // 拖拽开始时退出快速放置模式
  quickPlacement.stopPlacement()
  startDrag(config, event)
}

/**
 * 处理物料项拖拽结束
 */
const handleStencilDragEnd = (config: StencilItemConfig, _event: DragEvent) => {
  console.log('结束拖拽:', config.label)
}

/**
 * 处理物料项点击（进入快速放置模式）
 */
const handleStencilItemClick = (config: StencilItemConfig) => {
  // 如果已经选中同一个，则退出
  if (quickPlacement.isActive.value && quickPlacement.currentConfig.value?.id === config.id) {
    quickPlacement.stopPlacement()
  } else {
    quickPlacement.startPlacement(config)
  }
}
</script>

<template>
  <div class="app-container">
    <!-- 物料面板 -->
    <Stencil
      :active-item-id="quickPlacement.currentConfig.value?.id"
      @item-drag-start="handleStencilDragStart"
      @item-drag-end="handleStencilDragEnd"
      @item-click="handleStencilItemClick"
    />

    <!-- 画布区域 -->
    <div class="canvas-area">
      <GraphCanvas />
      <Toolbar position="top-right" :show-zoom-text="true" />
    </div>

    <!-- 快速放置鼠标跟随预览 -->
    <QuickPlacementCursor
      :is-active="quickPlacement.isActive.value ?? false"
      :current-config="quickPlacement.currentConfig.value ?? null"
      :cursor-position="quickPlacement.cursorPosition.value ?? { x: 0, y: 0 }"
    />
  </div>
</template>

<style>
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.app-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.canvas-area {
  position: relative;
  flex: 1;
  width: 0;
  height: 100%;
}
</style>
