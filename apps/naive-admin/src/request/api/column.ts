import { apiCall } from '../api-adapter'
import type { ColumnListResponse } from '@/types/column'

// 获取专栏列表
export const api_getColumnList = async (params: { page: number; pageSize: number }) => {
  return apiCall<ColumnListResponse>('GET /api/column/column/index', params)
}

// 创建专栏
export const api_createColumn = async (params: {
  columnName: string
  columnIntro?: string
  pcBanner?: string
  h5Banner?: string
}) => {
  return apiCall('POST /column/column/create', params)
}

// 编辑专栏
export const api_editColumn = async (params: {
  xid: string
  columnName: string
  columnIntro?: string
  pcBanner?: string
  h5Banner?: string
}) => {
  return apiCall('POST /column/column/edit', params)
}

// 删除专栏
export const api_deleteColumn = async (params: { xid: string }) => {
  return apiCall('POST /column/column/delete', params)
}

// 上线专栏
export const api_onlineColumn = async (params: { xid: string }) => {
  return apiCall('POST /column/column/online', params)
}

// 下线专栏
export const api_offlineColumn = async (params: { xid: string }) => {
  return apiCall('POST /column/column/offline', params)
} 