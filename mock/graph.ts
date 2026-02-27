/**
 * Mock API - 图形设计器后端服务模拟
 * @description 模拟后端 API 接口，用于开发环境测试
 */

import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

const Random = Mock.Random

/**
 * 图形数据存储
 * @description 模拟数据库中的图形表
 */
const graphList: any[] = []

/**
 * 节点数据存储
 * @description 模拟数据库中的节点表
 */
const nodeList: any[] = []

/**
 * 获取图形列表
 * @description 分页获取所有图形
 * @param query - 查询参数
 * @param query.page - 页码（默认 1）
 * @param query.pageSize - 每页数量（默认 10）
 * @returns 分页后的图形列表
 */
function getGraphList(query: any) {
  console.log('[Mock API] GET /api/graph/list', query)
  const { page = 1, pageSize = 10 } = query
  const result = {
    code: 200,
    message: 'success',
    data: {
      list: graphList.slice((page - 1) * pageSize, page * pageSize),
      total: graphList.length,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  }
  console.log('[Mock API] Response:', result)
  return result
}

/**
 * 根据 ID 获取图形详情
 * @description 获取指定图形的完整数据，包含所有关联节点
 * @param query - 查询参数
 * @param query.id - 图形 ID
 * @returns 图形详情（包含节点列表）或 404 错误
 */
function getGraphById(query: any) {
  console.log('[Mock API] GET /api/graph/:id', query)
  const { id } = query
  const graph = graphList.find(g => g.id === id)
  if (graph) {
    const graphNodes = nodeList.filter(n => n.graphId === id)
    const result = {
      code: 200,
      message: 'success',
      data: {
        ...graph,
        nodes: graphNodes,
      },
    }
    console.log('[Mock API] Response:', result)
    return result
  }
  const result = {
    code: 404,
    message: 'Graph not found',
    data: null,
  }
  console.log('[Mock API] Response:', result)
  return result
}

/**
 * 保存图形
 * @description 创建新图形或更新已有图形
 * @param body - 图形数据
 * @param body.id - 图形 ID（更新时必填）
 * @param body.name - 图形名称
 * @param body.description - 图形描述
 * @param body.nodes - 节点列表
 * @param body.edges - 边列表
 * @returns 保存后的图形数据
 */
function saveGraph(body: any) {
  console.log('[Mock API] POST /api/graph/save', body)
  const { id, name, description, nodes, edges } = body
  const now = new Date().toISOString()

  if (id) {
    const index = graphList.findIndex(g => g.id === id)
    if (index !== -1) {
      graphList[index] = {
        ...graphList[index],
        name,
        description,
        nodes,
        edges,
        updatedAt: now,
      }
      const result = {
        code: 200,
        message: 'success',
        data: graphList[index],
      }
      console.log('[Mock API] Response (updated):', result)
      return result
    }
  }

  const newGraph = {
    id: Random.guid(),
    name,
    description,
    nodes,
    edges,
    createdAt: now,
    updatedAt: now,
  }
  graphList.push(newGraph)
  const result = {
    code: 200,
    message: 'success',
    data: newGraph,
  }
  console.log('[Mock API] Response (created):', result)
  return result
}

/**
 * 删除图形
 * @description 根据 ID 删除指定图形
 * @param query - 查询参数
 * @param query.id - 图形 ID
 * @returns 成功返回 200，图形不存在返回 404
 */
function deleteGraph(query: any) {
  console.log('[Mock API] DELETE /api/graph/delete/:id', query)
  const { id } = query
  const index = graphList.findIndex(g => g.id === id)
  if (index !== -1) {
    graphList.splice(index, 1)
    const result = {
      code: 200,
      message: 'success',
      data: null,
    }
    console.log('[Mock API] Response:', result)
    return result
  }
  const result = {
    code: 404,
    message: 'Graph not found',
    data: null,
  }
  console.log('[Mock API] Response:', result)
  return result
}

/**
 * 获取设备模板列表
 * @description 获取所有可用的设备节点模板
 * @returns 设备模板列表（路由器、交换机、服务器、防火墙、存储设备）
 */
function getDeviceTemplates() {
  console.log('[Mock API] GET /api/templates/devices')
  const result = {
    code: 200,
    message: 'success',
    data: [
      {
        id: 'router',
        name: '路由器',
        category: 'network',
        icon: 'router',
        width: 120,
        height: 80,
        defaultData: { ip: '', ports: 8 },
      },
      {
        id: 'switch',
        name: '交换机',
        category: 'network',
        icon: 'switch',
        width: 120,
        height: 60,
        defaultData: { ip: '', ports: 24 },
      },
      {
        id: 'server',
        name: '服务器',
        category: 'compute',
        icon: 'server',
        width: 100,
        height: 100,
        defaultData: { ip: '', cpu: 8, memory: 32 },
      },
      {
        id: 'firewall',
        name: '防火墙',
        category: 'security',
        icon: 'firewall',
        width: 120,
        height: 80,
        defaultData: { ip: '', rules: [] },
      },
      {
        id: 'storage',
        name: '存储设备',
        category: 'storage',
        icon: 'storage',
        width: 100,
        height: 80,
        defaultData: { capacity: 1000, type: 'SSD' },
      },
    ],
  }
  console.log('[Mock API] Response:', result)
  return result
}

/**
 * 获取系统容器模板列表
 * @description 获取所有可用的系统容器节点模板
 * @returns 系统容器模板列表（网络区域、数据中心、云区域）
 */
function getSystemTemplates() {
  console.log('[Mock API] GET /api/templates/systems')
  const result = {
    code: 200,
    message: 'success',
    data: [
      {
        id: 'network-zone',
        name: '网络区域',
        category: 'zone',
        icon: 'cloud',
        width: 400,
        height: 300,
        defaultData: { zone: 'DMZ', security: 'high' },
      },
      {
        id: 'data-center',
        name: '数据中心',
        category: 'zone',
        icon: 'database',
        width: 500,
        height: 400,
        defaultData: { location: '', tier: 3 },
      },
      {
        id: 'cloud-region',
        name: '云区域',
        category: 'cloud',
        icon: 'cloud',
        width: 600,
        height: 400,
        defaultData: { provider: 'AWS', region: 'us-east-1' },
      },
    ],
  }
  console.log('[Mock API] Response:', result)
  return result
}

/**
 * 保存节点
 * @description 创建新节点或更新已有节点
 * @param body - 节点数据
 * @param body.graphId - 所属图形 ID
 * @param body.id - 节点 ID（更新时必填）
 * @param body.type - 节点类型（device/system）
 * @param body.x - X 坐标
 * @param body.y - Y 坐标
 * @param body.width - 宽度
 * @param body.height - 高度
 * @param body.label - 标签
 * @param body.data - 自定义数据
 * @param body.parentId - 父节点 ID
 * @returns 保存后的节点数据
 */
function saveNode(body: any) {
  console.log('[Mock API] POST /api/node/save', body)
  const { graphId, id, type, x, y, width, height, label, data, parentId } = body
  const now = new Date().toISOString()

  if (id) {
    const index = nodeList.findIndex(n => n.id === id)
    if (index !== -1) {
      nodeList[index] = {
        ...nodeList[index],
        x,
        y,
        width,
        height,
        label,
        data,
        parentId,
        updatedAt: now,
      }
      const result = {
        code: 200,
        message: 'success',
        data: nodeList[index],
      }
      console.log('[Mock API] Response (updated):', result)
      return result
    }
  }

  const newNode = {
    id: id || Random.guid(),
    graphId,
    type,
    x,
    y,
    width,
    height,
    label,
    data,
    parentId,
    createdAt: now,
    updatedAt: now,
  }
  nodeList.push(newNode)
  const result = {
    code: 200,
    message: 'success',
    data: newNode,
  }
  console.log('[Mock API] Response (created):', result)
  return result
}

/**
 * 更新节点
 * @description 更新指定节点的属性（部分更新）
 * @param body - 更新数据
 * @param body.id - 节点 ID（必填）
 * @param body.graphId - 所属图形 ID（必填）
 * @param body.x - X 坐标（可选）
 * @param body.y - Y 坐标（可选）
 * @param body.width - 宽度（可选）
 * @param body.height - 高度（可选）
 * @param body.label - 标签（可选）
 * @param body.data - 自定义数据（可选）
 * @param body.parentId - 父节点 ID（可选）
 * @returns 更新后的节点数据或 404 错误
 */
function updateNode(body: any) {
  console.log('[Mock API] PUT /api/node/update', body)
  const { id, graphId, x, y, width, height, label, data, parentId } = body
  const node = nodeList.find(n => n.id === id && n.graphId === graphId)

  if (!node) {
    const result = {
      code: 404,
      message: 'Node not found',
      data: null,
    }
    console.log('[Mock API] Response:', result)
    return result
  }

  const now = new Date().toISOString()
  Object.assign(node, {
    ...(x !== undefined && { x }),
    ...(y !== undefined && { y }),
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    ...(label !== undefined && { label }),
    ...(data !== undefined && { data }),
    ...(parentId !== undefined && { parentId }),
    updatedAt: now,
  })

  const result = {
    code: 200,
    message: 'success',
    data: node,
  }
  console.log('[Mock API] Response:', result)
  return result
}

/**
 * 删除节点
 * @description 根据 ID 删除指定节点
 * @param query - 查询参数
 * @param query.id - 节点 ID
 * @param query.graphId - 所属图形 ID
 * @returns 成功返回 200，节点不存在返回 404
 */
function deleteNode(query: any) {
  console.log('[Mock API] DELETE /api/node/delete/:id', query)
  const { id, graphId } = query
  const index = nodeList.findIndex(n => n.id === id && n.graphId === graphId)

  if (index !== -1) {
    nodeList.splice(index, 1)
    const result = {
      code: 200,
      message: 'success',
      data: null,
    }
    console.log('[Mock API] Response:', result)
    return result
  }
  const result = {
    code: 404,
    message: 'Node not found',
    data: null,
  }
  console.log('[Mock API] Response:', result)
  return result
}

/**
 * Mock API 路由配置
 * @description 定义所有模拟 API 接口的路由、方法和处理函数
 */
export default [
  {
    url: '/api/graph/list',
    method: 'get',
    response: ({ query }: any) => getGraphList(query),
  },
  {
    url: '/api/graph/:id',
    method: 'get',
    response: ({ query }: any) => getGraphById(query),
  },
  {
    url: '/api/graph/save',
    method: 'post',
    response: ({ body }: any) => saveGraph(body),
  },
  {
    url: '/api/graph/delete/:id',
    method: 'delete',
    response: ({ query }: any) => deleteGraph(query),
  },
  {
    url: '/api/templates/devices',
    method: 'get',
    response: () => getDeviceTemplates(),
  },
  {
    url: '/api/templates/systems',
    method: 'get',
    response: () => getSystemTemplates(),
  },
  {
    url: '/api/node/save',
    method: 'post',
    response: ({ body }: any) => saveNode(body),
  },
  {
    url: '/api/node/update',
    method: 'put',
    response: ({ body }: any) => updateNode(body),
  },
  {
    url: '/api/node/delete/:id',
    method: 'delete',
    response: ({ query }: any) => deleteNode(query),
  },
] as MockMethod[]
