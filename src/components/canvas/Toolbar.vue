<template>
  <div class="graph-toolbar" :class="`toolbar-${position}`">
    <div class="toolbar-wrapper">
      <!-- 左侧工具按钮区域 -->
      <div class="toolbar-content">
        <!-- 放大按钮 -->
        <el-tooltip content="放大" placement="left">
          <el-button
            :icon="ZoomIn"
            circle
            size="small"
            :disabled="!canZoomIn"
            @click="handleZoomIn"
          />
        </el-tooltip>

        <!-- 缩小按钮 -->
        <el-tooltip content="缩小" placement="left">
          <el-button
            :icon="ZoomOut"
            circle
            size="small"
            :disabled="!canZoomOut"
            @click="handleZoomOut"
          />
        </el-tooltip>

        <!-- 适应画布按钮 -->
        <el-tooltip content="适应画布" placement="left">
          <el-button :icon="FullScreen" circle size="small" @click="handleZoomToFit" />
        </el-tooltip>

        <!-- 实际大小按钮 -->
        <el-tooltip content="实际大小 (100%)" placement="left">
          <el-button :icon="Refresh" circle size="small" @click="handleResetZoom" />
        </el-tooltip>

        <!-- 分隔线 - 对齐工具 -->
        <div class="toolbar-divider"></div>

        <!-- 对齐下拉菜单 -->
        <el-dropdown trigger="click" @command="handleAlignCommand" :disabled="selectedCount < 2">
          <el-button :icon="Operation" circle size="small" :disabled="selectedCount < 2" title="对齐与分布" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="alignLeft" :disabled="selectedCount < 2">
                <el-icon><Back /></el-icon> 左对齐
              </el-dropdown-item>
              <el-dropdown-item command="alignCenter" :disabled="selectedCount < 2">
                <el-icon><Switch /></el-icon> 垂直居中
              </el-dropdown-item>
              <el-dropdown-item command="alignRight" :disabled="selectedCount < 2">
                <el-icon><Right /></el-icon> 右对齐
              </el-dropdown-item>
              <el-dropdown-item divided command="alignTop" :disabled="selectedCount < 2">
                <el-icon><Top /></el-icon> 顶部对齐
              </el-dropdown-item>
              <el-dropdown-item command="alignMiddle" :disabled="selectedCount < 2">
                <el-icon><Minus /></el-icon> 水平居中
              </el-dropdown-item>
              <el-dropdown-item command="alignBottom" :disabled="selectedCount < 2">
                <el-icon><Bottom /></el-icon> 底部对齐
              </el-dropdown-item>
              <el-dropdown-item divided command="distributeHorizontally" :disabled="selectedCount < 3">
                <el-icon><DCaret /></el-icon> 水平等距分布
              </el-dropdown-item>
              <el-dropdown-item command="distributeVertically" :disabled="selectedCount < 3">
                <el-icon><CaretRight /></el-icon> 垂直等距分布
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 撤销/重做按钮 -->
        <el-tooltip content="撤销 (Ctrl+Z)" placement="left">
          <el-button :icon="RefreshLeft" circle size="small" :disabled="!canUndo" @click="handleUndo" />
        </el-tooltip>
        <el-tooltip content="重做 (Ctrl+Y)" placement="left">
          <el-button :icon="RefreshRight" circle size="small" :disabled="!canRedo" @click="handleRedo" />
        </el-tooltip>

        <!-- 分隔线 - 导出 -->
        <div class="toolbar-divider"></div>

        <!-- 锁定画布按钮 -->
        <el-tooltip :content="isLocked ? '解锁画布' : '锁定画布'" placement="left">
          <el-button 
            :icon="isLocked ? Unlock : Lock" 
            circle 
            size="small" 
            :type="isLocked ? 'warning' : 'default'"
            @click="handleToggleLock" 
          />
        </el-tooltip>

        <!-- 导出下拉菜单 -->
        <el-dropdown trigger="click" @command="handleExportCommand">
          <el-button :icon="Download" circle size="small" title="导出图片" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="exportPNG">
                <el-icon><Picture /></el-icon> 导出为 PNG
              </el-dropdown-item>
              <el-dropdown-item command="exportJPEG">
                <el-icon><PictureFilled /></el-icon> 导出为 JPEG
              </el-dropdown-item>
              <el-dropdown-item command="exportSVG">
                <el-icon><Document /></el-icon> 导出为 SVG
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 缩放比例显示 -->
        <div v-if="showZoomText" class="zoom-text">{{ zoomText }}</div>
      </div>

      <!-- 分隔线 -->
      <div class="toolbar-separator"></div>

      <!-- 右侧快捷键说明区域 -->
      <div class="shortcuts-panel">
        <div class="shortcuts-list">
          <div v-for="shortcut in shortcuts" :key="shortcut.key" class="shortcut-item">
            <span class="shortcut-keys">{{ shortcut.key }}</span>
            <span class="shortcut-desc">{{ shortcut.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import {
  ZoomIn, ZoomOut, FullScreen, Refresh,
  Operation, Back, Right, Top, Bottom, Switch, Minus,
  RefreshLeft, RefreshRight, DCaret, CaretRight,
  Download, Picture, PictureFilled, Document,
  Lock, Unlock
} from '@element-plus/icons-vue'
import { useGraphStore } from '@/stores/graphStore'
import { useAlignment } from '@/composables/useAlignment'
import type { ToolbarPosition } from '@/types/graph'

/**
 * Props 定义
 */
interface Props {
  // 工具栏位置（默认：top-right）
  position?: ToolbarPosition
  // 是否显示缩放比例文本
  showZoomText?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top-right',
  showZoomText: true
})

interface Emits {
  'export-png': []
  'export-jpeg': []
  'export-svg': []
  'toggle-lock': []
}

const emit = defineEmits<Emits>()
const graphStore = useGraphStore()

const isLocked = computed(() => graphStore.isLocked)

const handleToggleLock = () => {
  emit('toggle-lock')
}

// 使用对齐功能
const alignment = useAlignment()

// 响应式选中节点数量
const selectedCount = ref(0)

// 更新选中数量的函数
const updateSelectedCount = () => {
  const graph = graphStore.graph
  if (!graph) {
    selectedCount.value = 0
    return
  }
  selectedCount.value = graph.getSelectedCells().filter(cell => cell.isNode && cell.isNode()).length
}

// 监听选择变化
onMounted(() => {
  const graph = graphStore.graph
  if (graph) {
    graph.on('selection:changed', updateSelectedCount)
  } else {
    // 等待 graph 初始化完成
    const unwatch = graphStore.$subscribe((_mutation, state) => {
      if (state.isInitialized && state.graph) {
        state.graph.on('selection:changed', updateSelectedCount)
        unwatch()
      }
    })
  }
})

onBeforeUnmount(() => {
  const graph = graphStore.graph
  if (graph) {
    graph.off('selection:changed', updateSelectedCount)
  }
})

// 计算属性
const zoomText = computed(() => graphStore.zoomText)
const canZoomIn = computed(() => graphStore.canZoomIn)
const canZoomOut = computed(() => graphStore.canZoomOut)

const canUndo = computed(() => {
  const graph = graphStore.graph
  if (!graph) return false
  return graph.canUndo()
})

const canRedo = computed(() => {
  const graph = graphStore.graph
  if (!graph) return false
  return graph.canRedo()
})

/**
 * 快捷键列表
 */
const shortcuts = [
  { key: 'Ctrl+Z', description: '撤销' },
  { key: 'Ctrl+Y', description: '重做' },
  { key: 'Ctrl+C', description: '复制' },
  { key: 'Ctrl+V', description: '粘贴' },
  { key: 'Ctrl+X', description: '剪切' },
  { key: 'Ctrl+A', description: '全选' },
  { key: 'Delete', description: '删除' },
  { key: 'Space+拖拽', description: '平移画布' },
  { key: 'Ctrl+拖拽', description: '节点出组' },
  { key: 'Esc', description: '退出放置' },
]

/**
 * 放大画布
 */
const handleZoomIn = () => {
  graphStore.zoomIn(0.1)
}

/**
 * 缩小画布
 */
const handleZoomOut = () => {
  graphStore.zoomOut(0.1)
}

/**
 * 适应画布
 */
const handleZoomToFit = () => {
  graphStore.zoomToFit()
}

/**
 * 重置为实际大小 (100%)
 */
const handleResetZoom = () => {
  graphStore.zoomTo(1)
}

type AlignCommand = 
  | 'alignLeft' | 'alignCenter' | 'alignRight'
  | 'alignTop' | 'alignMiddle' | 'alignBottom'
  | 'distributeHorizontally' | 'distributeVertically'

const handleAlignCommand = (command: AlignCommand) => {
  switch (command) {
    case 'alignLeft':
      alignment.alignLeft()
      break
    case 'alignCenter':
      alignment.alignCenter()
      break
    case 'alignRight':
      alignment.alignRight()
      break
    case 'alignTop':
      alignment.alignTop()
      break
    case 'alignMiddle':
      alignment.alignMiddle()
      break
    case 'alignBottom':
      alignment.alignBottom()
      break
    case 'distributeHorizontally':
      alignment.distributeHorizontally()
      break
    case 'distributeVertically':
      alignment.distributeVertically()
      break
  }
}

const handleUndo = () => {
  const graph = graphStore.graph
  if (graph) {
    graph.undo()
  }
}

const handleRedo = () => {
  const graph = graphStore.graph
  if (graph) {
    graph.redo()
  }
}

const handleExportCommand = (command: string) => {
  switch (command) {
    case 'exportPNG':
      emit('export-png')
      break
    case 'exportJPEG':
      emit('export-jpeg')
      break
    case 'exportSVG':
      emit('export-svg')
      break
  }
}
</script>

<style scoped lang="scss">
.graph-toolbar {
  position: absolute;
  z-index: 100;
  padding: 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &.toolbar-top-right {
    top: 20px;
    right: 20px;
  }

  &.toolbar-top-left {
    top: 20px;
    left: 20px;
  }

  &.toolbar-bottom-right {
    bottom: 20px;
    right: 20px;
  }

  &.toolbar-bottom-left {
    bottom: 20px;
    left: 20px;
  }
}

.toolbar-wrapper {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: flex-start;
}

.toolbar-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;

  .el-button {
    width: 36px;
    height: 36px;
    border: 1px solid #dcdfe6;
    flex-shrink: 0;
    margin: 0 !important;
    padding: 0 !important;

    &:hover:not(:disabled) {
      color: #409eff;
      border-color: #409eff;
      background-color: #ecf5ff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .el-tooltip {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }
}

.toolbar-divider {
  width: 100%;
  height: 1px;
  background-color: #dcdfe6;
  margin: 4px 0;
}

.zoom-text {
  margin-top: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  background-color: #f5f7fa;
  border-radius: 4px;
  user-select: none;
}

.toolbar-separator {
  width: 1px;
  align-self: stretch;
  background-color: #e8e8e8;
  flex-shrink: 0;
}

.shortcuts-panel {
  min-width: 140px;
  padding-left: 4px;
}

.shortcuts-title {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ebeef5;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  line-height: 1.4;
}

.shortcut-keys {
  display: inline-block;
  min-width: 70px;
  padding: 2px 6px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  color: #606266;
  text-align: center;
  white-space: nowrap;
}

.shortcut-desc {
  color: #909399;
  flex: 1;
}
</style>
