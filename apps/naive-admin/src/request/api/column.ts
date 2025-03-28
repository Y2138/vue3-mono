import { post, get } from '../axios'
import type { ColumnListResponse } from '@/types/column'

// 获取专栏列表
export const api_getColumnList = (params: { page: number; pageSize: number }) => {
  return get<ColumnListResponse>('/api/column/column/index', { params })
}

// 创建专栏
export const api_createColumn = (params: {
  columnName: string
  columnIntro?: string
  pcBanner?: string
  h5Banner?: string
}) => {
  return post('/column/column/create', { params })
}

// 编辑专栏
export const api_editColumn = (params: {
  xid: string
  columnName: string
  columnIntro?: string
  pcBanner?: string
  h5Banner?: string
}) => {
  return post('/column/column/edit', { params })
}

// 删除专栏
export const api_deleteColumn = (params: { xid: string }) => {
  return post('/column/column/delete', { params })
}

// 上线专栏
export const api_onlineColumn = (params: { xid: string }) => {
  return post('/column/column/online', { params })
}

// 下线专栏
export const api_offlineColumn = (params: { xid: string }) => {
  return post('/column/column/offline', { params })
} 