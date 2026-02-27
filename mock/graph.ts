import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

const Random = Mock.Random

const graphList: any[] = []
const nodeList: any[] = []

export default [
  {
    url: '/api/graph/list',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10 } = query
      return {
        code: 200,
        message: 'success',
        data: {
          list: graphList.slice((page - 1) * pageSize, page * pageSize),
          total: graphList.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      }
    },
  },
  {
    url: '/api/graph/:id',
    method: 'get',
    response: ({ query }: any) => {
      const { id } = query
      const graph = graphList.find(g => g.id === id)
      if (graph) {
        return {
          code: 200,
          message: 'success',
          data: graph,
        }
      }
      return {
        code: 404,
        message: 'Graph not found',
        data: null,
      }
    },
  },
  {
    url: '/api/graph/save',
    method: 'post',
    response: ({ body }: any) => {
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
          return {
            code: 200,
            message: 'success',
            data: graphList[index],
          }
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
      
      return {
        code: 200,
        message: 'success',
        data: newGraph,
      }
    },
  },
  {
    url: '/api/graph/delete/:id',
    method: 'delete',
    response: ({ query }: any) => {
      const { id } = query
      const index = graphList.findIndex(g => g.id === id)
      if (index !== -1) {
        graphList.splice(index, 1)
        return {
          code: 200,
          message: 'success',
          data: null,
        }
      }
      return {
        code: 404,
        message: 'Graph not found',
        data: null,
      }
    },
  },
  {
    url: '/api/templates/devices',
    method: 'get',
    response: () => {
      return {
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
    },
  },
  {
    url: '/api/templates/systems',
    method: 'get',
    response: () => {
      return {
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
    },
  },
  {
    url: '/api/node/save',
    method: 'post',
    response: ({ body }: any) => {
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
          return {
            code: 200,
            message: 'success',
            data: nodeList[index],
          }
        }
      }

      const newNode = {
        id: Random.guid(),
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

      return {
        code: 200,
        message: 'success',
        data: newNode,
      }
    },
  },
  {
    url: '/api/node/update',
    method: 'put',
    response: ({ body }: any) => {
      const { id, graphId, x, y, width, height, label, data, parentId } = body
      const node = nodeList.find(n => n.id === id && n.graphId === graphId)
      
      if (!node) {
        return {
          code: 404,
          message: 'Node not found',
          data: null,
        }
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

      return {
        code: 200,
        message: 'success',
        data: node,
      }
    },
  },
  {
    url: '/api/node/delete/:id',
    method: 'delete',
    response: ({ query }: any) => {
      const { id } = query
      const { graphId } = query
      const index = nodeList.findIndex(n => n.id === id && n.graphId === graphId)
      
      if (index !== -1) {
        nodeList.splice(index, 1)
        return {
          code: 200,
          message: 'success',
          data: null,
        }
      }
      return {
        code: 404,
        message: 'Node not found',
        data: null,
      }
    },
  },
] as MockMethod[]
