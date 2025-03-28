export interface ColumnItem {
  id: number
  xid: string
  pcBanner: string
  h5Banner: string
  columnName: string
  columnIntro: string
  link: string
  status: number
  statusText: string
  createdAtText: string
  creatorName: string
}

export interface ColumnListResponse {
  data: {
    items: ColumnItem[]
    pagination: {
      pageIndex: number
      totalPages: number
      itemsPerPage: number
      totalItems: number
      currentItemCount: number
    }
    tableHeader: {
      id: string
      pcBanner: string
      columnName: string
      columnIntro: string
      link: string
      threadCount: string
      statusText: string
      createdAtText: string
      creatorName: string
    }
  }
} 