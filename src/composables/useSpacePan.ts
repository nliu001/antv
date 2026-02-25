import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useGraphStore } from '@/stores/graphStore'

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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!enabled.value) return
    
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault()
      isSpacePressed.value = true
      
      const graph = graphStore.graph
      if (graph) {
        const container = graph.container
        container.style.cursor = 'grab'
      }
      
      console.log('[useSpacePan] Space 键按下，进入抓取模式')
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!enabled.value) return
    
    if (e.code === 'Space') {
      isSpacePressed.value = false
      isPanning.value = false
      
      const graph = graphStore.graph
      if (graph) {
        const container = graph.container
        container.style.cursor = 'default'
      }
      
      console.log('[useSpacePan] Space 键松开，退出抓取模式')
    }
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (!enabled.value || !isSpacePressed.value) return
    
    if (e.button === 0) {
      e.preventDefault()
      isPanning.value = true
      lastPos.value = { x: e.clientX, y: e.clientY }
      
      const graph = graphStore.graph
      if (graph) {
        const container = graph.container
        container.style.cursor = 'grabbing'
      }
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!enabled.value || !isPanning.value) return
    
    const graph = graphStore.graph
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
      
      const graph = graphStore.graph
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
    
    const graph = graphStore.graph
    if (graph) {
      const container = graph.container
      container.style.cursor = 'default'
    }
    
    console.log('[useSpacePan] 已禁用')
  }

  const setupEventListeners = () => {
    const graph = graphStore.graph
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
    const graph = graphStore.graph
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
