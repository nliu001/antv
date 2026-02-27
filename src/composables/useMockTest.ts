import { ref } from 'vue'
import { graphApi, templateApi, nodeApi } from '@/services/api'
import { ElMessage } from 'element-plus'

export function useMockTest() {
  const isLoading = ref(false)
  const testResults = ref<string[]>([])
  let savedNodeId: string | null = null
  let savedGraphId: string | null = null

  const addResult = (message: string) => {
    testResults.value.push(`[${new Date().toLocaleTimeString()}] ${message}`)
  }

  const testGetDeviceTemplates = async () => {
    isLoading.value = true
    try {
      addResult('Testing GET /api/templates/devices...')
      const response = await templateApi.getDeviceTemplates()
      if (response.code === 200) {
        addResult(`✅ Success: Found ${response.data.length} device templates`)
        console.log('Device templates:', response.data)
      } else {
        addResult(`❌ Failed: ${response.message}`)
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`)
    } finally {
      isLoading.value = false
    }
  }

  const testGetSystemTemplates = async () => {
    isLoading.value = true
    try {
      addResult('Testing GET /api/templates/systems...')
      const response = await templateApi.getSystemTemplates()
      if (response.code === 200) {
        addResult(`✅ Success: Found ${response.data.length} system templates`)
        console.log('System templates:', response.data)
      } else {
        addResult(`❌ Failed: ${response.message}`)
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`)
    } finally {
      isLoading.value = false
    }
  }

  const testSaveGraph = async () => {
    isLoading.value = true
    try {
      addResult('Testing POST /api/graph/save...')
      const response = await graphApi.save({
        name: 'Test Graph',
        description: 'A test graph from mock service',
        nodes: [
          {
            id: 'node-1',
            type: 'device',
            x: 100,
            y: 100,
            width: 120,
            height: 80,
            label: 'Router 1',
          },
        ],
        edges: [],
      })
      if (response.code === 200) {
        savedGraphId = response.data.id
        addResult(`✅ Success: Graph saved with ID ${response.data.id}`)
        console.log('Saved graph:', response.data)
      } else {
        addResult(`❌ Failed: ${response.message}`)
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`)
    } finally {
      isLoading.value = false
    }
  }

  const testGetGraphList = async () => {
    isLoading.value = true
    try {
      addResult('Testing GET /api/graph/list...')
      const response = await graphApi.getList({ page: 1, pageSize: 10 })
      if (response.code === 200) {
        addResult(`✅ Success: Found ${response.data.total} graphs`)
        console.log('Graph list:', response.data)
      } else {
        addResult(`❌ Failed: ${response.message}`)
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`)
    } finally {
      isLoading.value = false
    }
  }

  const testSaveNode = async () => {
    if (!savedGraphId) {
      addResult('⚠️ Skipped: No graph ID available, run save graph test first')
      return
    }
    isLoading.value = true
    try {
      addResult('Testing POST /api/node/save...')
      const response = await nodeApi.save({
        graphId: savedGraphId,
        type: 'device',
        x: 200,
        y: 150,
        width: 100,
        height: 80,
        label: 'Test Server',
        data: { ip: '192.168.1.1' },
      })
      if (response.code === 200) {
        savedNodeId = response.data.id
        addResult(`✅ Success: Node saved with ID ${response.data.id}`)
        console.log('Saved node:', response.data)
      } else {
        addResult(`❌ Failed: ${response.message}`)
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`)
    } finally {
      isLoading.value = false
    }
  }

  const testUpdateNode = async () => {
    if (!savedNodeId || !savedGraphId) {
      addResult('⚠️ Skipped: No node ID available, run save node test first')
      return
    }
    isLoading.value = true
    try {
      addResult('Testing PUT /api/node/update...')
      const response = await nodeApi.update({
        id: savedNodeId,
        graphId: savedGraphId,
        x: 300,
        y: 250,
        label: 'Updated Server',
      })
      if (response.code === 200) {
        addResult(`✅ Success: Node updated - new position (${response.data.x}, ${response.data.y})`)
        console.log('Updated node:', response.data)
      } else {
        addResult(`❌ Failed: ${response.message}`)
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`)
    } finally {
      isLoading.value = false
    }
  }

  const testDeleteNode = async () => {
    if (!savedNodeId || !savedGraphId) {
      addResult('⚠️ Skipped: No node ID available, run save node test first')
      return
    }
    isLoading.value = true
    try {
      addResult('Testing DELETE /api/node/delete/:id...')
      const response = await nodeApi.delete(savedNodeId, savedGraphId)
      if (response.code === 200) {
        addResult(`✅ Success: Node deleted`)
        savedNodeId = null
      } else {
        addResult(`❌ Failed: ${response.message}`)
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`)
    } finally {
      isLoading.value = false
    }
  }

  const runAllTests = async () => {
    testResults.value = []
    addResult('🚀 Starting mock service tests...')
    await testGetDeviceTemplates()
    await testGetSystemTemplates()
    await testSaveGraph()
    await testGetGraphList()
    await testSaveNode()
    await testUpdateNode()
    await testDeleteNode()
    addResult('✨ All tests completed!')
    ElMessage.success('Mock service tests completed!')
  }

  return {
    isLoading,
    testResults,
    testGetDeviceTemplates,
    testGetSystemTemplates,
    testSaveGraph,
    testGetGraphList,
    testSaveNode,
    testUpdateNode,
    testDeleteNode,
    runAllTests,
  }
}
