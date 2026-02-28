import { onBeforeUnmount, toRaw } from 'vue'
import { Graph, Snapline, History, Selection, Keyboard, Clipboard, Transform, Export } from '@antv/x6'
import type { Node } from '@antv/x6'
import { useGraphStore } from '@/stores/graphStore'
import { NodeType, type SystemNodeData } from '@/types/node'

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
    }

    if (historyOptions.enabled) {
      graph.use(
        new History({
          enabled: true,
          stackSize: historyOptions.stackSize,
        })
      )
    }

    if (selectionOptions.enabled) {
      graph.use(
        new Selection({
          enabled: true,
          multiple: selectionOptions.multiple,
          rubberband: selectionOptions.rubberband,
          movable: selectionOptions.movable,
          showNodeSelectionBox: selectionOptions.showNodeSelectionBox,
          pointerEvents: 'none',
        })
      )
    }

    if (keyboardOptions.enabled) {
      graph.use(
        new Keyboard({
          enabled: true,
          global: keyboardOptions.global,
        })
      )
    }

    if (clipboardOptions.enabled) {
      graph.use(
        new Clipboard({
          enabled: true,
        })
      )
    }

    graph.use(
      new Transform({
        resizing: {
          enabled: (node: Node) => {
            const nodeData = node.getData<SystemNodeData & { _locked?: boolean }>()
            if (nodeData?._locked) {
              return false
            }
            return nodeData?.type === NodeType.SYSTEM
          },
          minWidth: 200,
          minHeight: 150,
          orthogonal: true,
          restrict: false,
          autoScroll: true,
          preserveAspectRatio: false,
          allowReverse: true,
        },
        rotating: false,
      })
    )

    graph.use(new Export())
  }

  const setupKeyboardShortcuts = (graph: Graph) => {
    graph.bindKey(['ctrl+z', 'meta+z'], () => {
      graph.undo()
    })

    graph.bindKey(['ctrl+y', 'meta+y', 'ctrl+shift+z', 'meta+shift+z'], () => {
      graph.redo()
    })

    graph.bindKey(['ctrl+c', 'meta+c'], () => {
      graph.copy(graph.getSelectedCells())
    })

    graph.bindKey(['ctrl+v', 'meta+v'], () => {
      graph.paste()
    })

    graph.bindKey(['ctrl+x', 'meta+x'], () => {
      graph.cut(graph.getSelectedCells())
    })

    graph.bindKey(['delete', 'backspace'], () => {
      if (graphStore.isLocked) return
      
      const cells = graph.getSelectedCells()
      if (cells.length > 0) {
        graph.removeCells(cells)
      }
    })

    graph.bindKey(['ctrl+a', 'meta+a'], () => {
      const nodes = graph.getNodes()
      graph.select(nodes)
    })
  }

  const init = () => {
    const graph = getGraph()
    if (!graph) {
      return
    }

    setupPlugins(graph)
    setupKeyboardShortcuts(graph)
  }

  const destroy = () => {
    // 清理资源
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
