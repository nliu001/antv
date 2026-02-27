<script setup lang="ts">
import GraphCanvas from './components/canvas/GraphCanvas.vue'
import Toolbar from './components/canvas/Toolbar.vue'
import Stencil from './components/canvas/Stencil.vue'
import QuickPlacementCursor from './components/common/QuickPlacementCursor.vue'
import { useDnd } from '@/composables/useDnd'
import { useNodeDrop } from '@/composables/useNodeDrop'
import { useKeyboardState } from '@/composables/useKeyboardState'
import { useQuickPlacement } from '@/composables/useQuickPlacement'
import { useGraphExport } from '@/composables/useGraphExport'
import { useGraphPersistence } from '@/composables/useGraphPersistence'
import { useGraphStore } from '@/stores/graphStore'
import { useMockTest } from '@/composables/useMockTest'
import { ElMessage } from 'element-plus'
import type { StencilItemConfig } from '@/constants/stencil'

// 初始化键盘状态管理
const keyboard = useKeyboardState()

// 初始化 Graph Store
const graphStore = useGraphStore()

// 初始化 Mock 测试
const mockTest = useMockTest()

// 初始化画布持久化
const graphPersistence = useGraphPersistence()

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

// 初始化导出功能
const graphExport = useGraphExport()

/**
 * 处理物料项拖拽开始
 */
const handleStencilDragStart = (config: StencilItemConfig, event: DragEvent) => {
  // 拖拽开始时退出快速放置模式
  quickPlacement.stopPlacement()
  startDrag(config, event)
}

/**
 * 处理物料项拖拽结束
 */
const handleStencilDragEnd = (_config: StencilItemConfig, _event: DragEvent) => {
  // 拖拽结束处理
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

/**
 * 处理导出为 PNG
 */
const handleExportPNG = () => {
  graphExport.exportAsPNG()
}

/**
 * 处理导出为 JPEG
 */
const handleExportJPEG = () => {
  graphExport.exportAsJPEG()
}

/**
 * 处理导出为 SVG
 */
const handleExportSVG = () => {
  graphExport.exportAsSVG()
}

/**
 * 处理画布锁定/解锁
 */
const handleToggleLock = () => {
  graphStore.toggleLock()
}

/**
 * 处理 Mock 测试
 */
const handleMockTest = async () => {
  await mockTest.runAllTests()
}

/**
 * 处理保存画布
 */
const handleSaveGraph = async () => {
  await graphPersistence.saveGraph('My Topology', 'Saved from designer')
}

/**
 * 处理加载画布
 */
const handleLoadGraph = async () => {
  if (graphPersistence.currentGraphId.value) {
    await graphPersistence.loadGraph(graphPersistence.currentGraphId.value)
  } else {
    ElMessage.info('请先保存画布后再加载')
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
      <Toolbar 
        position="top-right" 
        :show-zoom-text="true"
        @export-png="handleExportPNG"
        @export-jpeg="handleExportJPEG"
        @export-svg="handleExportSVG"
        @toggle-lock="handleToggleLock"
        @mock-test="handleMockTest"
        @save-graph="handleSaveGraph"
        @load-graph="handleLoadGraph"
      />
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
