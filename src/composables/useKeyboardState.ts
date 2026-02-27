import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 键盘状态管理 Composable
 * 
 * 功能：
 * - 监听全局 Ctrl 键状态
 * - 处理窗口失焦自动重置
 * - 提供响应式状态和回调
 */
export function useKeyboardState() {
  // Ctrl 键按下状态
  const isCtrlPressed = ref(false)

  // 回调函数集合
  const ctrlPressCallbacks: Array<() => void> = []
  const ctrlReleaseCallbacks: Array<() => void> = []

  /**
   * 处理 keydown 事件
   */
  function handleKeyDown(event: KeyboardEvent) {
    // 检测 Ctrl 键（Windows/Linux）或 Meta 键（Mac）
    if (event.ctrlKey || event.metaKey) {
      if (!isCtrlPressed.value) {
        isCtrlPressed.value = true
        
        // 触发回调
        ctrlPressCallbacks.forEach(callback => callback())
      }
    }
  }

  /**
   * 处理 keyup 事件
   */
  function handleKeyUp(event: KeyboardEvent) {
    // 检查是否是 Ctrl/Meta 键松开
    if (event.key === 'Control' || event.key === 'Meta') {
      if (isCtrlPressed.value) {
        isCtrlPressed.value = false
        console.log('[useKeyboardState] Ctrl 键松开')
        
        // 触发回调
        ctrlReleaseCallbacks.forEach(callback => callback())
      }
    }
  }

  /**
   * 处理窗口失焦
   * 失焦时自动重置 Ctrl 状态，避免状态丢失
   */
  function handleBlur() {
    if (isCtrlPressed.value) {
      isCtrlPressed.value = false
      
      // 触发释放回调
      ctrlReleaseCallbacks.forEach(callback => callback())
    }
  }

  /**
   * 注册 Ctrl 按下回调
   */
  function onCtrlPress(callback: () => void) {
    ctrlPressCallbacks.push(callback)
  }

  /**
   * 注册 Ctrl 松开回调
   */
  function onCtrlRelease(callback: () => void) {
    ctrlReleaseCallbacks.push(callback)
  }

  // 组件挂载时添加监听器
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
  })

  // 组件卸载时清理监听器
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('blur', handleBlur)
  })

  return {
    isCtrlPressed,
    onCtrlPress,
    onCtrlRelease
  }
}
