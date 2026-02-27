import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import type { StencilItemConfig } from '@/constants/stencil'
import type { Graph } from '@antv/x6'

export interface UseQuickPlacementReturn {
  isActive: ReturnType<typeof ref<boolean>>
  currentConfig: ReturnType<typeof ref<StencilItemConfig | null>>
  cursorPosition: ReturnType<typeof ref<{ x: number; y: number }>>
  startPlacement: (config: StencilItemConfig) => void
  stopPlacement: () => void
  placeNode: (clientX: number, clientY: number) => void
}

export function useQuickPlacement(): UseQuickPlacementReturn {
  const graphStore = useGraphStore()

  const isActive = ref(false)
  const currentConfig = ref<StencilItemConfig | null>(null)
  const cursorPosition = ref({ x: 0, y: 0 })

  const getGraph = (): Graph | null => {
    const graph = graphStore.graph
    if (!graph) return null
    return graph as Graph
  }

  const startPlacement = (config: StencilItemConfig) => {
    isActive.value = true
    currentConfig.value = config
    console.log('[useQuickPlacement] 进入放置模式:', config.label)
  }

  const stopPlacement = () => {
    isActive.value = false
    currentConfig.value = null
    console.log('[useQuickPlacement] 退出放置模式')
  }

  const placeNode = (clientX: number, clientY: number) => {
    if (!isActive.value || !currentConfig.value) return

    const graph = getGraph()
    if (!graph) return

    if (graphStore.isLocked) {
      console.warn('[useQuickPlacement] 画布已锁定，禁止添加新节点')
      return
    }

    // 将屏幕坐标转换为画布坐标
    const canvasPoint = graph.clientToLocal(clientX, clientY)
    
    // 计算节点中心位置
    const nodeWidth = currentConfig.value.width || 120
    const nodeHeight = currentConfig.value.height || 80
    const position = {
      x: canvasPoint.x - nodeWidth / 2,
      y: canvasPoint.y - nodeHeight / 2
    }

    // 根据节点类型创建
    if (currentConfig.value.nodeType === 'device') {
      graphStore.addDeviceNode(position, {
        name: currentConfig.value.label,
        deviceType: currentConfig.value.deviceType
      })
    } else if (currentConfig.value.nodeType === 'system') {
      graphStore.addSystemContainer(
        position,
        { width: nodeWidth, height: nodeHeight },
        { name: currentConfig.value.label }
      )
    }

    console.log('[useQuickPlacement] 放置节点:', currentConfig.value.label, 'at', position)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isActive.value) return
    cursorPosition.value = { x: e.clientX, y: e.clientY }
  }

  const handleCanvasClick = (e: MouseEvent) => {
    if (!isActive.value) return
    if (e.button !== 0) return // 只响应左键

    const graph = getGraph()
    if (!graph) return

    // 检查点击是否在画布容器内
    const container = graph.container
    const rect = container.getBoundingClientRect()
    
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
      e.preventDefault()
      placeNode(e.clientX, e.clientY)
    }
  }

  const handleRightClick = (e: MouseEvent) => {
    if (!isActive.value) return
    e.preventDefault()
    stopPlacement()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isActive.value) return
    if (e.key === 'Escape') {
      stopPlacement()
    }
  }

  onMounted(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleCanvasClick)
    window.addEventListener('contextmenu', handleRightClick)
    window.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('click', handleCanvasClick)
    window.removeEventListener('contextmenu', handleRightClick)
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    isActive,
    currentConfig,
    cursorPosition,
    startPlacement,
    stopPlacement,
    placeNode
  }
}
