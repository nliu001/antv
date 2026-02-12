<script setup lang="ts">
import GraphCanvas from './components/canvas/GraphCanvas.vue'
import Toolbar from './components/canvas/Toolbar.vue'
import Stencil from './components/canvas/Stencil.vue'
import { useDnd } from '@/composables/useDnd'
import { useNodeDrop } from '@/composables/useNodeDrop'
import { useKeyboardState } from '@/composables/useKeyboardState'
import type { StencilItemConfig } from '@/constants/stencil'

// 初始化键盘状态管理
const keyboard = useKeyboardState()

// 初始化 Dnd 拖拽功能
const { startDrag } = useDnd({
  scaled: true,
  animation: true
})

// 初始化入组/出组检测
useNodeDrop({
  enterDelay: 200,
  leaveDelay: 100,
  leaveThreshold: 0.5,
  // ⭐ 传递 Ctrl 键状态检查函数
  isCtrlPressed: () => keyboard.isCtrlPressed.value
})

/**
 * 处理物料项拖拽开始
 */
const handleStencilDragStart = (config: StencilItemConfig, event: DragEvent) => {
  console.log('开始拖拽:', config.label)
  startDrag(config, event)
}

/**
 * 处理物料项拖拽结束
 */
const handleStencilDragEnd = (config: StencilItemConfig, event: DragEvent) => {
  console.log('结束拖拽:', config.label)
}
</script>

<template>
  <div class="app-container">
    <!-- 物料面板 -->
    <Stencil
      @item-drag-start="handleStencilDragStart"
      @item-drag-end="handleStencilDragEnd"
    />

    <!-- 画布区域 -->
    <div class="canvas-area">
      <GraphCanvas />
      <Toolbar position="top-right" :show-zoom-text="true" />
    </div>
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
