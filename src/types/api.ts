export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface GraphData {
  id: string
  name: string
  description?: string
  nodes: NodeData[]
  edges: EdgeData[]
  createdAt: string
  updatedAt: string
}

export interface NodeData {
  id: string
  type: 'device' | 'system'
  x: number
  y: number
  width: number
  height: number
  label: string
  data?: Record<string, any>
  parentId?: string
}

export interface EdgeData {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  label?: string
  data?: Record<string, any>
}

export interface SaveGraphParams {
  id?: string
  name: string
  description?: string
  nodes: NodeData[]
  edges: EdgeData[]
}

export interface DeviceTemplate {
  id: string
  name: string
  category: string
  icon: string
  width: number
  height: number
  defaultData: Record<string, any>
}

export interface SystemTemplate {
  id: string
  name: string
  category: string
  icon: string
  width: number
  height: number
  defaultData: Record<string, any>
}

export interface SaveNodeParams {
  graphId: string
  id?: string
  type: 'device' | 'system'
  x: number
  y: number
  width: number
  height: number
  label: string
  data?: Record<string, any>
  parentId?: string
}

export interface UpdateNodeParams {
  id: string
  graphId: string
  x?: number
  y?: number
  width?: number
  height?: number
  label?: string
  data?: Record<string, any>
  parentId?: string
}

export interface NodeResponse {
  id: string
  graphId: string
  type: 'device' | 'system'
  x: number
  y: number
  width: number
  height: number
  label: string
  data?: Record<string, any>
  parentId?: string
  createdAt: string
  updatedAt: string
}
