<template>
  <div class="graph-toolbar" :class="`toolbar-${position}`">
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

      <!-- 分隔线 -->
      <div class="toolbar-divider"></div>

      <!-- 添加设备节点按钮 -->
      <el-tooltip content="添加设备节点" placement="left">
        <el-button :icon="Monitor" circle size="small" type="primary" @click="handleAddDevice" />
      </el-tooltip>

      <!-- 添加系统容器按钮 -->
      <el-tooltip content="添加系统容器" placement="left">
        <el-button :icon="Grid" circle size="small" type="success" @click="handleAddSystem" />
      </el-tooltip>

      <!-- 缩放比例显示 -->
      <div v-if="showZoomText" class="zoom-text">{{ zoomText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ZoomIn, ZoomOut, FullScreen, Refresh, Monitor, Grid } from '@element-plus/icons-vue'
import { useGraphStore } from '@/stores/graphStore'
import type { ToolbarPosition } from '@/types/graph'
import { DeviceType, NodeStatus } from '@/types/node'

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

// 使用 Graph Store
const graphStore = useGraphStore()

// 计算属性
const zoomText = computed(() => graphStore.zoomText)
const canZoomIn = computed(() => graphStore.canZoomIn)
const canZoomOut = computed(() => graphStore.canZoomOut)

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

/**
 * 节点计数器（用于生成名称）
 */
const deviceCounter = ref(1)
const systemCounter = ref(1)

/**
 * 添加设备节点
 */
const handleAddDevice = () => {
  const centerPoint = graphStore.centerPoint
  const position = {
    x: centerPoint.x + Math.random() * 100 - 50,
    y: centerPoint.y + Math.random() * 100 - 50
  }

  graphStore.addDeviceNode(position, {
    name: `设备节点 ${deviceCounter.value}`,
    deviceType: DeviceType.SERVER,
    status: NodeStatus.NORMAL
  })

  deviceCounter.value++
}

/**
 * 添加系统容器
 */
const handleAddSystem = () => {
  const centerPoint = graphStore.centerPoint
  const position = {
    x: centerPoint.x + Math.random() * 100 - 50,
    y: centerPoint.y + Math.random() * 100 - 50
  }

  graphStore.addSystemContainer(
    position,
    { width: 300, height: 200 },
    {
      name: `系统容器 ${systemCounter.value}`
    }
  )

  systemCounter.value++
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

.toolbar-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;

  .el-button {
    width: 36px;
    height: 36px;
    border: 1px solid #dcdfe6;
    flex-shrink: 0;  // 防止按钮被压缩
    margin: 0 !important;  // 强制重置 margin
    padding: 0 !important;  // 强制重置 padding

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
    display: flex;  // 确保 tooltip 容器也是 flex
    align-items: center;
    justify-content: center;
    margin: 0;  // 重置 tooltip 容器的 margin
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
</style>
