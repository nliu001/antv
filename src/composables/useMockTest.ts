import { ref } from 'vue'
import { graphApi, templateApi } from '@/services/api'
import { ElMessage } from 'element-plus'

export function useMockTest() {
  const isLoading = ref(false)
  const testResults = ref<string[]>([])

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

  const runAllTests = async () => {
    testResults.value = []
    addResult('🚀 Starting mock service tests...')
    await testGetDeviceTemplates()
    await testGetSystemTemplates()
    await testSaveGraph()
    await testGetGraphList()
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
    runAllTests,
  }
}
