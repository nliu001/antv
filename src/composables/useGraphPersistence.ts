import { ref, computed } from 'vue'
import { graphApi, nodeApi } from '@/services/api'
import { useGraphStore } from '@/stores/graphStore'
import { ElMessage } from 'element-plus'
import type { Node } from '@antv/x6'
import { NodeType } from '@/types/node'

const currentGraphId = ref<string | null>(null)
const isSaving = ref(false)
const isLoading = ref(false)

export function useGraphPersistence() {
  const graphStore = useGraphStore()

  const graph = computed(() => graphStore.graph)

  const collectNodesData = (): any[] => {
    if (!graph.value) return []
    
    return graph.value.getNodes().map(node => {
      const position = node.position()
      const size = node.size()
      const data = node.getData()
      
      return {
        id: node.id,
        type: data.type === NodeType.DEVICE ? 'device' : 'system',
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        label: data.label || '',
        data: data,
        parentId: node.getParent()?.id || undefined,
      }
    })
  }

  const collectEdgesData = (): any[] => {
    if (!graph.value) return []
    
    return graph.value.getEdges().map(edge => {
      return {
        id: edge.id,
        source: edge.getSourceCellId() || '',
        target: edge.getTargetCellId() || '',
        sourcePort: edge.getSourcePortId(),
        targetPort: edge.getTargetPortId(),
        label: edge.getLabels()[0]?.attrs?.text?.text || '',
        data: edge.getData(),
      }
    })
  }

  const saveGraph = async (name: string = 'Untitled', description?: string) => {
    if (!graph.value) {
      ElMessage.warning('画布未初始化')
      return null
    }

    isSaving.value = true
    try {
      const nodes = collectNodesData()
      const edges = collectEdgesData()

      const response = await graphApi.save({
        id: currentGraphId.value || undefined,
        name,
        description,
        nodes,
        edges,
      })

      if (response.code === 200) {
        currentGraphId.value = response.data.id
        console.log('[useGraphPersistence] 画布保存成功:', response.data.id)
        ElMessage.success('画布保存成功')
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      console.error('[useGraphPersistence] 画布保存失败:', error)
      ElMessage.error('画布保存失败: ' + error.message)
      return null
    } finally {
      isSaving.value = false
    }
  }

  const loadGraph = async (graphId: string) => {
    if (!graph.value) {
      ElMessage.warning('画布未初始化')
      return false
    }

    isLoading.value = true
    try {
      const response = await graphApi.getById(graphId)

      if (response.code === 200 && response.data) {
        graph.value.clearCells()
        currentGraphId.value = response.data.id

        const graphData = response.data as any
        
        if (graphData.nodes && Array.isArray(graphData.nodes)) {
          graphData.nodes.forEach((nodeData: any) => {
            const shape = nodeData.type === 'device' ? 'device-node' : 'system-container'
            graph.value!.addNode({
              id: nodeData.id,
              shape,
              x: nodeData.x,
              y: nodeData.y,
              width: nodeData.width,
              height: nodeData.height,
              data: nodeData.data || {
                type: nodeData.type === 'device' ? NodeType.DEVICE : NodeType.SYSTEM,
                label: nodeData.label,
              },
            })
          })
        }

        if (graphData.edges && Array.isArray(graphData.edges)) {
          graphData.edges.forEach((edgeData: any) => {
            graph.value!.addEdge({
              id: edgeData.id,
              source: edgeData.source,
              target: edgeData.target,
              sourcePort: edgeData.sourcePort,
              targetPort: edgeData.targetPort,
              labels: edgeData.label ? [{ attrs: { text: { text: edgeData.label } } }] : [],
              data: edgeData.data,
            })
          })
        }

        console.log('[useGraphPersistence] 画布加载成功:', graphId)
        ElMessage.success('画布加载成功')
        return true
      } else {
        throw new Error(response.message || '画布不存在')
      }
    } catch (error: any) {
      console.error('[useGraphPersistence] 画布加载失败:', error)
      ElMessage.error('画布加载失败: ' + error.message)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const saveNode = async (node: Node) => {
    if (!currentGraphId.value) {
      console.warn('[useGraphPersistence] 未加载画布，跳过节点保存')
      return null
    }

    try {
      const position = node.position()
      const size = node.size()
      const data = node.getData()

      const response = await nodeApi.save({
        graphId: currentGraphId.value,
        id: node.id,
        type: data.type === NodeType.DEVICE ? 'device' : 'system',
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        label: data.label || '',
        data: data,
        parentId: node.getParent()?.id || undefined,
      })

      if (response.code === 200) {
        console.log('[useGraphPersistence] 节点保存成功:', node.id)
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      console.error('[useGraphPersistence] 节点保存失败:', error)
      return null
    }
  }

  const updateNode = async (nodeId: string, updates: Partial<{
    x: number
    y: number
    width: number
    height: number
    label: string
    data: any
    parentId: string
  }>) => {
    if (!currentGraphId.value) {
      console.warn('[useGraphPersistence] 未加载画布，跳过节点更新')
      return null
    }

    try {
      const response = await nodeApi.update({
        id: nodeId,
        graphId: currentGraphId.value,
        ...updates,
      })

      if (response.code === 200) {
        console.log('[useGraphPersistence] 节点更新成功:', nodeId)
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      console.error('[useGraphPersistence] 节点更新失败:', error)
      return null
    }
  }

  const deleteNode = async (nodeId: string) => {
    if (!currentGraphId.value) {
      console.warn('[useGraphPersistence] 未加载画布，跳过节点删除')
      return false
    }

    try {
      const response = await nodeApi.delete(nodeId, currentGraphId.value)

      if (response.code === 200) {
        console.log('[useGraphPersistence] 节点删除成功:', nodeId)
        return true
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      console.error('[useGraphPersistence] 节点删除失败:', error)
      return false
    }
  }

  const clearGraph = () => {
    if (graph.value) {
      graph.value.clearCells()
    }
    currentGraphId.value = null
    console.log('[useGraphPersistence] 画布已清空')
  }

  return {
    currentGraphId,
    isSaving,
    isLoading,
    saveGraph,
    loadGraph,
    saveNode,
    updateNode,
    deleteNode,
    clearGraph,
  }
}
