import { onBeforeUnmount, toRaw } from 'vue'
import { Graph, Snapline, History, Selection, Keyboard, Clipboard } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'

export interface UsePluginsOptions {
  snapline?: {
    enabled?: boolean
    tolerance?: number
    sharp?: boolean
    resizing?: boolean
  }
  history?: {
    enabled?: boolean
    stackSize?: number
  }
  selection?: {
    enabled?: boolean
    multiple?: boolean
    rubberband?: boolean
    movable?: boolean
    showNodeSelectionBox?: boolean
  }
  keyboard?: {
    enabled?: boolean
    global?: boolean
  }
  clipboard?: {
    enabled?: boolean
  }
}

export interface UsePluginsReturn {
  enableSnapline: () => void
  disableSnapline: () => void
  enableHistory: () => void
  disableHistory: () => void
  enableSelection: () => void
  disableSelection: () => void
  enableKeyboard: () => void
  disableKeyboard: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  copy: () => void
  paste: () => void
  cut: () => void
  init: () => void
}

export function usePlugins(options: UsePluginsOptions = {}): UsePluginsReturn {
  const graphStore = useGraphStore()

  const snaplineOptions = {
    enabled: options.snapline?.enabled ?? true,
    tolerance: options.snapline?.tolerance ?? 10,
    sharp: options.snapline?.sharp ?? false,
    resizing: options.snapline?.resizing ?? true,
  }

  const historyOptions = {
    enabled: options.history?.enabled ?? true,
    stackSize: options.history?.stackSize ?? 50,
  }

  const selectionOptions = {
    enabled: options.selection?.enabled ?? true,
    multiple: options.selection?.multiple ?? true,
    rubberband: options.selection?.rubberband ?? true,
    movable: options.selection?.movable ?? true,
    showNodeSelectionBox: options.selection?.showNodeSelectionBox ?? true,
  }

  const keyboardOptions = {
    enabled: options.keyboard?.enabled ?? true,
    global: options.keyboard?.global ?? false,
  }

  const clipboardOptions = {
    enabled: options.clipboard?.enabled ?? true,
  }

  const getGraph = (): Graph | null => {
    const graph = graphStore.graph
    if (!graph) return null
    return toRaw(graph) as Graph
  }

  const enableSnapline = () => {
    const graph = getGraph()
    if (!graph) return
    graph.enableSnapline()
  }

  const disableSnapline = () => {
    const graph = getGraph()
    if (!graph) return
    graph.disableSnapline()
  }

  const enableHistory = () => {
    const graph = getGraph()
    if (!graph) return
    graph.enableHistory()
  }

  const disableHistory = () => {
    const graph = getGraph()
    if (!graph) return
    graph.disableHistory()
  }

  const enableSelection = () => {
    const graph = getGraph()
    if (!graph) return
    graph.enableSelection()
  }

  const disableSelection = () => {
    const graph = getGraph()
    if (!graph) return
    graph.disableSelection()
  }

  const enableKeyboard = () => {
    const graph = getGraph()
    if (!graph) return
    graph.enableKeyboard()
  }

  const disableKeyboard = () => {
    const graph = getGraph()
    if (!graph) return
    graph.disableKeyboard()
  }

  const undo = () => {
    const graph = getGraph()
    if (!graph) return
    graph.undo()
  }

  const redo = () => {
    const graph = getGraph()
    if (!graph) return
    graph.redo()
  }

  const canUndo = (): boolean => {
    const graph = getGraph()
    if (!graph) return false
    return graph.canUndo()
  }

  const canRedo = (): boolean => {
    const graph = getGraph()
    if (!graph) return false
    return graph.canRedo()
  }

  const copy = () => {
    const graph = getGraph()
    if (!graph) return
    graph.copy(graph.getSelectedCells())
  }

  const paste = () => {
    const graph = getGraph()
    if (!graph) return
    graph.paste()
  }

  const cut = () => {
    const graph = getGraph()
    if (!graph) return
    graph.cut(graph.getSelectedCells())
  }

  const setupPlugins = (graph: Graph) => {
    if (snaplineOptions.enabled) {
      graph.use(
        new Snapline({
          enabled: true,
          tolerance: snaplineOptions.tolerance,
          sharp: snaplineOptions.sharp,
          resizing: snaplineOptions.resizing,
        })
      )
      console.log('[usePlugins] Snapline 插件已启用')
    }

    if (historyOptions.enabled) {
      graph.use(
        new History({
          enabled: true,
          stackSize: historyOptions.stackSize,
        })
      )
      console.log('[usePlugins] History 插件已启用')
    }

    if (selectionOptions.enabled) {
      graph.use(
        new Selection({
          enabled: true,
          multiple: selectionOptions.multiple,
          rubberband: selectionOptions.rubberband,
          movable: selectionOptions.movable,
          showNodeSelectionBox: selectionOptions.showNodeSelectionBox,
        })
      )
      console.log('[usePlugins] Selection 插件已启用')
    }

    if (keyboardOptions.enabled) {
      graph.use(
        new Keyboard({
          enabled: true,
          global: keyboardOptions.global,
        })
      )
      console.log('[usePlugins] Keyboard 插件已启用')
    }

    if (clipboardOptions.enabled) {
      graph.use(
        new Clipboard({
          enabled: true,
        })
      )
      console.log('[usePlugins] Clipboard 插件已启用')
    }
  }

  const setupKeyboardShortcuts = (graph: Graph) => {
    graph.bindKey(['ctrl+z', 'meta+z'], () => {
      graph.undo()
      console.log('[usePlugins] 执行撤销')
    })

    graph.bindKey(['ctrl+y', 'meta+y', 'ctrl+shift+z', 'meta+shift+z'], () => {
      graph.redo()
      console.log('[usePlugins] 执行重做')
    })

    graph.bindKey(['ctrl+c', 'meta+c'], () => {
      graph.copy(graph.getSelectedCells())
      console.log('[usePlugins] 执行复制')
    })

    graph.bindKey(['ctrl+v', 'meta+v'], () => {
      graph.paste()
      console.log('[usePlugins] 执行粘贴')
    })

    graph.bindKey(['ctrl+x', 'meta+x'], () => {
      graph.cut(graph.getSelectedCells())
      console.log('[usePlugins] 执行剪切')
    })

    graph.bindKey(['delete', 'backspace'], () => {
      const cells = graph.getSelectedCells()
      if (cells.length > 0) {
        graph.removeCells(cells)
        console.log('[usePlugins] 删除选中节点:', cells.length)
      }
    })

    graph.bindKey(['ctrl+a', 'meta+a'], () => {
      const nodes = graph.getNodes()
      graph.select(nodes)
      console.log('[usePlugins] 全选节点:', nodes.length)
    })

    console.log('[usePlugins] 快捷键已绑定')
  }

  const init = () => {
    const graph = getGraph()
    if (!graph) {
      console.warn('[usePlugins] Graph 实例不存在')
      return
    }

    setupPlugins(graph)
    setupKeyboardShortcuts(graph)
  }

  const destroy = () => {
    console.log('[usePlugins] 已销毁')
  }

  onBeforeUnmount(() => {
    destroy()
  })

  return {
    enableSnapline,
    disableSnapline,
    enableHistory,
    disableHistory,
    enableSelection,
    disableSelection,
    enableKeyboard,
    disableKeyboard,
    undo,
    redo,
    canUndo,
    canRedo,
    copy,
    paste,
    cut,
    init,
  }
}
