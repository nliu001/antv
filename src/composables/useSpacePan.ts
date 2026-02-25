import { ref, onMounted, onBeforeUnmount } from 'vue'
import { toRaw } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import type { Graph } from '@antv/x6'

export interface UseSpacePanOptions {
  enabled?: boolean
}

export interface UseSpacePanReturn {
  isSpacePressed: ReturnType<typeof ref<boolean>>
  enable: () => void
  disable: () => void
}

export function useSpacePan(options: UseSpacePanOptions = {}): UseSpacePanReturn {
  const graphStore = useGraphStore()
  
  const enabled = ref(options.enabled ?? true)
  const isSpacePressed = ref(false)
  const isPanning = ref(false)
  const lastPos = ref({ x: 0, y: 0 })
  const wasRubberbandEnabled = ref(false)

  const getGraph = (): Graph | null => {
    const graph = graphStore.graph
    if (!graph) return null
    return toRaw(graph) as Graph
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!enabled.value) return
    
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault()
      isSpacePressed.value = true
      
      const graph = getGraph()
      if (graph) {
        const container = graph.container
        container.style.cursor = 'grab'
        
        // 禁用框选功能，避免 Space+拖拽时出现选框
        if (graph.isRubberbandEnabled && graph.isRubberbandEnabled()) {
          wasRubberbandEnabled.value = true
          graph.disableRubberband()
        }
      }
      
      console.log('[useSpacePan] Space 键按下，进入抓取模式')
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!enabled.value) return
    
    if (e.code === 'Space') {
      isSpacePressed.value = false
      isPanning.value = false
      
      const graph = getGraph()
      if (graph) {
        const container = graph.container
        container.style.cursor = 'default'
        
        // 恢复框选功能
        if (wasRubberbandEnabled.value) {
          graph.enableRubberband()
          wasRubberbandEnabled.value = false
        }
      }
      
      console.log('[useSpacePan] Space 键松开，退出抓取模式')
    }
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (!enabled.value || !isSpacePressed.value) return
    
    if (e.button === 0) {
      e.preventDefault()
      e.stopPropagation()
      isPanning.value = true
      lastPos.value = { x: e.clientX, y: e.clientY }
      
      const graph = getGraph()
      if (graph) {
        const container = graph.container
        container.style.cursor = 'grabbing'
      }
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!enabled.value || !isPanning.value) return
    
    const graph = getGraph()
    if (!graph) return
    
    const dx = e.clientX - lastPos.value.x
    const dy = e.clientY - lastPos.value.y
    
    const currentTranslate = graph.translate()
    graph.translate(currentTranslate.tx + dx, currentTranslate.ty + dy)
    
    lastPos.value = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    if (!enabled.value) return
    
    if (isPanning.value) {
      isPanning.value = false
      
      const graph = getGraph()
      if (graph && isSpacePressed.value) {
        const container = graph.container
        container.style.cursor = 'grab'
      }
    }
  }

  const enable = () => {
    enabled.value = true
    console.log('[useSpacePan] 已启用')
  }

  const disable = () => {
    enabled.value = false
    isSpacePressed.value = false
    isPanning.value = false
    
    const graph = getGraph()
    if (graph) {
      const container = graph.container
      container.style.cursor = 'default'
      
      // 恢复框选功能
      if (wasRubberbandEnabled.value) {
        graph.enableRubberband()
        wasRubberbandEnabled.value = false
      }
    }
    
    console.log('[useSpacePan] 已禁用')
  }

  const setupEventListeners = () => {
    const graph = getGraph()
    if (!graph) {
      console.warn('[useSpacePan] Graph 实例不存在')
      return
    }

    const container = graph.container
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mouseleave', handleMouseUp)

    console.log('[useSpacePan] 事件监听器已设置')
  }

  const removeEventListeners = () => {
    const graph = getGraph()
    if (!graph) return

    const container = graph.container
    
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    container.removeEventListener('mousedown', handleMouseDown)
    container.removeEventListener('mousemove', handleMouseMove)
    container.removeEventListener('mouseup', handleMouseUp)
    container.removeEventListener('mouseleave', handleMouseUp)

    console.log('[useSpacePan] 事件监听器已移除')
  }

  onMounted(() => {
    if (graphStore.isInitialized) {
      setupEventListeners()
    } else {
      const unwatch = graphStore.$subscribe((_mutation, state) => {
        if (state.isInitialized) {
          setupEventListeners()
          unwatch()
        }
      })
    }
  })

  onBeforeUnmount(() => {
    removeEventListeners()
  })

  return {
    isSpacePressed,
    enable,
    disable,
  }
}
