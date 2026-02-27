import { api } from '@/utils/request'
import type {
  ApiResponse,
  PageResult,
  GraphData,
  SaveGraphParams,
  DeviceTemplate,
  SystemTemplate,
  SaveNodeParams,
  UpdateNodeParams,
  NodeResponse,
} from '@/types/api'

export const graphApi = {
  getList(params: { page?: number; pageSize?: number }) {
    return api.get<ApiResponse<PageResult<GraphData>>>('/graph/list', params)
  },

  getById(id: string) {
    return api.get<ApiResponse<GraphData>>(`/graph/${id}`)
  },

  save(data: SaveGraphParams) {
    return api.post<ApiResponse<GraphData>>('/graph/save', data)
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/graph/delete/${id}`)
  },
}

export const nodeApi = {
  save(data: SaveNodeParams) {
    return api.post<ApiResponse<NodeResponse>>('/node/save', data)
  },

  update(data: UpdateNodeParams) {
    return api.put<ApiResponse<NodeResponse>>('/node/update', data)
  },

  delete(id: string, graphId: string) {
    return api.delete<ApiResponse<null>>(`/node/delete/${id}?graphId=${graphId}`)
  },
}

export const templateApi = {
  getDeviceTemplates() {
    return api.get<ApiResponse<DeviceTemplate[]>>('/templates/devices')
  },

  getSystemTemplates() {
    return api.get<ApiResponse<SystemTemplate[]>>('/templates/systems')
  },
}
