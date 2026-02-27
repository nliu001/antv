/**
 * Graph Store
 * @description 管理画布状态的 Pinia Store
 */

import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type { Graph, Node } from '@antv/x6'
import type { GraphState } from '@/types/graph'
import { createDeviceNode, createSystemContainer } from '@/utils/nodeFactory'
import type { DeviceNodeData, SystemNodeData } from '@/types/node'

export const useGraphStore = defineStore('graph', {
  state: (): GraphState => ({
    // Graph 实例
    graph: null,

    // 初始化状态
    isInitialized: false,
    isLoading: false,
    error: null,

    // 画布状态
    zoom: 1,
    centerPoint: {
      x: 0,
      y: 0
    },

    // 交互状态
    isInteracting: false,
    isPanning: false,
    isZooming: false,

    // 画布锁定状态
    isLocked: false
  }),

  getters: {
    /**
     * 获取格式化的缩放比例文本
     */
    zoomText(): string {
      return `${Math.round(this.zoom * 100)}%`
    },

    /**
     * 判断是否可以放大
     */
    canZoomIn(): boolean {
      return this.zoom < 3
    },

    /**
     * 判断是否可以缩小
     */
    canZoomOut(): boolean {
      return this.zoom > 0.2
    }
  },

  actions: {
    /**
     * 设置 Graph 实例
     * @param graph - Graph 实例
     */
    setGraph(graph: Graph) {
      // 使用 markRaw 避免 Vue 深度监听，提升性能
      this.graph = markRaw(graph)
      this.isInitialized = true
      this.isLoading = false
      this.error = null

      // 初始化缩放比例
      this.zoom = graph.zoom()
    },

    /**
     * 设置加载状态
     * @param loading - 是否加载中
     */
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    /**
     * 设置错误信息
     * @param error - 错误对象
     */
    setError(error: Error | null) {
      this.error = error
      this.isLoading = false
    },

    /**
     * 更新缩放比例
     * @param zoom - 新的缩放比例
     */
    updateZoom(zoom: number) {
      this.zoom = zoom
    },

    /**
     * 更新中心点坐标
     * @param x - x 坐标
     * @param y - y 坐标
     */
    updateCenterPoint(x: number, y: number) {
      this.centerPoint = { x, y }
    },

    /**
     * 设置交互状态
     * @param interacting - 是否正在交互
     */
    setInteracting(interacting: boolean) {
      this.isInteracting = interacting
    },

    /**
     * 设置平移状态
     * @param panning - 是否正在平移
     */
    setPanning(panning: boolean) {
      this.isPanning = panning
    },

    /**
     * 设置缩放状态
     * @param zooming - 是否正在缩放
     */
    setZooming(zooming: boolean) {
      this.isZooming = zooming
    },

    /**
     * 放大画布
     * @param factor - 缩放因子（默认 0.1）
     */
    zoomIn(factor = 0.1) {
      if (!this.graph) return

      const currentZoom = this.graph.zoom()
      const newZoom = Math.min(currentZoom + factor, 3)
      this.graph.zoomTo(newZoom)
      this.updateZoom(newZoom)
    },

    /**
     * 缩小画布
     * @param factor - 缩放因子（默认 0.1）
     */
    zoomOut(factor = 0.1) {
      if (!this.graph) return

      const currentZoom = this.graph.zoom()
      const newZoom = Math.max(currentZoom - factor, 0.2)
      this.graph.zoomTo(newZoom)
      this.updateZoom(newZoom)
    },

    /**
     * 缩放到指定比例
     * @param zoom - 目标缩放比例
     */
    zoomTo(zoom: number) {
      if (!this.graph) return

      const clampedZoom = Math.max(0.2, Math.min(zoom, 3))
      this.graph.zoomTo(clampedZoom)
      this.updateZoom(clampedZoom)
    },

    /**
     * 适应画布
     * @description 自动调整缩放和位置，使所有节点可见
     */
    zoomToFit() {
      if (!this.graph) return

      // 调用 X6 原生方法
      this.graph.zoomToFit({ padding: 20 })
      this.updateZoom(this.graph.zoom())
    },

    /**
     * 居中显示内容
     */
    centerContent() {
      if (!this.graph) return

      this.graph.centerContent()
      const center = this.graph.getGraphArea().getCenter()
      this.updateCenterPoint(center.x, center.y)
    },

    /**
     * 清空画布
     */
    clearGraph() {
      if (!this.graph) return

      this.graph.clearCells()
    },

    /**
     * 重置状态
     */
    reset() {
      this.graph = null
      this.isInitialized = false
      this.isLoading = false
      this.error = null
      this.zoom = 1
      this.centerPoint = { x: 0, y: 0 }
      this.isInteracting = false
      this.isPanning = false
      this.isZooming = false
    },

    /**
     * 添加设备节点
     * @param position 节点位置
     * @param data 节点数据
     */
    addDeviceNode(
      position: { x: number; y: number },
      data: Partial<DeviceNodeData>
    ): Node | null {
      if (!this.graph) return null

      const nodeConfig = createDeviceNode({
        position,
        data
      })

      const node = this.graph.addNode(nodeConfig)
      console.log('[GraphStore] Device node added:', node.id)
      return node
    },

    /**
     * 添加系统容器
     * @param position 节点位置
     * @param size 容器尺寸
     * @param data 节点数据
     */
    addSystemContainer(
      position: { x: number; y: number },
      size: { width: number; height: number },
      data: Partial<SystemNodeData>
    ): Node | null {
      if (!this.graph) return null

      const nodeConfig = createSystemContainer({
        position,
        size,
        data
      })

      const node = this.graph.addNode(nodeConfig)
      console.log('[GraphStore] System container added:', node.id)
      return node
    },

    /**
     * 删除节点
     * @param nodeId 节点 ID
     */
    removeNode(nodeId: string) {
      if (!this.graph) return

      const node = this.graph.getCellById(nodeId)
      if (node) {
        this.graph.removeNode(nodeId)
        console.log('[GraphStore] Node removed:', nodeId)
      }
    },

    /**
     * 获取所有节点
     */
    getAllNodes(): Node[] {
      if (!this.graph) return []
      return this.graph.getNodes()
    },

    /**
     * 获取节点数据
     * @param nodeId 节点 ID
     */
    getNodeData(nodeId: string) {
      if (!this.graph) return null

      const node = this.graph.getCellById(nodeId) as Node
      return node?.getData()
    },

    /**
     * 更新节点数据
     * @param nodeId 节点 ID
     * @param data 新数据
     */
    updateNodeData(nodeId: string, data: any) {
      if (!this.graph) return

      const node = this.graph.getCellById(nodeId) as Node
      if (node) {
        node.setData({ ...node.getData(), ...data, updatedAt: new Date().toISOString() })
        console.log('[GraphStore] Node data updated:', nodeId)
      }
    },

    /**
     * 锁定画布
     * @description 禁止节点移动和编辑，但允许选择和画布平移
     */
    lockGraph() {
      if (!this.graph) return

      this.isLocked = true
      
      ;(this.graph as any).disableSelectionMovable()
      this.graph.disableClipboard()
      this.graph.disableHistory()

      console.log('[GraphStore] 画布已锁定（节点不可移动，画布可平移）')
    },

    /**
     * 解锁画布
     * @description 恢复所有编辑操作
     */
    unlockGraph() {
      if (!this.graph) return

      this.isLocked = false
      
      ;(this.graph as any).enableSelectionMovable()
      this.graph.enableClipboard()
      this.graph.enableHistory()

      console.log('[GraphStore] 画布已解锁')
    },

    /**
     * 切换画布锁定状态
     */
    toggleLock() {
      if (this.isLocked) {
        this.unlockGraph()
      } else {
        this.lockGraph()
      }
    }
  }
})
