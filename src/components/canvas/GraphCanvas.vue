<template>
  <div class="graph-canvas-wrapper">
    <div ref="containerRef" class="graph-canvas-container" :style="containerStyle"></div>
    <div v-if="isLoading" class="graph-loading">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>画布加载中...</span>
    </div>
    <div v-if="error" class="graph-error">
      <el-icon>
        <CircleClose />
      </el-icon>
      <span>画布初始化失败</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Loading, CircleClose } from '@element-plus/icons-vue'
import { useGraph } from '@/composables/useGraph'
import { useGraphStore } from '@/stores/graphStore'
import type { Ref } from 'vue'

/**
 * Props 定义
 */
interface Props {
  // 画布高度（默认：100%）
  height?: string | number
  // 画布宽度（默认：100%）
  width?: string | number
  // 是否显示网格（默认：true）
  showGrid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '100%',
  width: '100%',
  showGrid: true
})

/**
 * Emits 定义
 */
const emit = defineEmits<{
  'graph-ready': [graph: unknown]
  'zoom-change': [zoom: number]
  'canvas-click': [event: MouseEvent]
}>()

// 容器引用 - 供模板绑定
const containerRef: Ref<HTMLElement | null> = ref(null)

// 使用 Graph Hook，传入容器引用
useGraph({
  width: typeof props.width === 'number' ? props.width : undefined,
  height: typeof props.height === 'number' ? props.height : undefined,
  showGrid: props.showGrid,
  container: containerRef
})

// 使用 Graph Store
const graphStore = useGraphStore()

// 计算容器样式
const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

// 监听状态
const isLoading = computed(() => graphStore.isLoading)
const error = computed(() => graphStore.error)

// 当 Graph 初始化完成时触发事件
if (graphStore.isInitialized && graphStore.graph) {
  emit('graph-ready', graphStore.graph)
}

// 监听缩放变化
const unwatchZoom = graphStore.$subscribe((mutation, state) => {
  if (mutation.type === 'direct' && 'zoom' in mutation.events) {
    emit('zoom-change', state.zoom)
  }
})

// 组件卸载时取消监听
onBeforeUnmount(() => {
  unwatchZoom()
})
</script>

<style scoped lang="scss">
.graph-canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.graph-canvas-container {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
}

.graph-loading,
.graph-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #606266;

  .el-icon {
    font-size: 32px;
  }
}

.graph-error {
  color: #f56c6c;
}

/* 对齐线样式 */
:deep(.my-snapline) {
  stroke: #1890ff;
  stroke-width: 1;
  stroke-dasharray: 5, 5;
  opacity: 0.8;
}

/* 网格线样式优化 */
:deep(.x6-graph-svg) {
  .x6-grid-mesh line {
    stroke: #d0d0d0;
    stroke-width: 1;
  }
}
</style>
