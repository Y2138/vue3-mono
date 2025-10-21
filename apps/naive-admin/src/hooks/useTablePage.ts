import type { DataTableColumn, DataTableColumns } from 'naive-ui'
import { reactive, ref } from 'vue'
import { merge } from 'lodash-es'

interface IOptions<R> {
  /* 是否进页面立即请求，默认 true */
  immediate?: boolean
  /* 是否返回表头，默认 true */
  returnHeader?: boolean
  /* 自定义表头 */
  customHeaders?: Record<string, DataTableColumn<R>>
  customResHandleFn?: (data?: IPaginationResData<R[]>) => void
  pageConfig?: {
    pageSize: number
    pageSizes: number[]
  }
}
function dealWithTableColumns<T>(headers: Record<string, string>, customOptions?: Record<string, DataTableColumn<T>>): DataTableColumns<T> {
  const columns: DataTableColumns<T> = []
  for (const key of Object.keys(headers)) {
    let customColumnConfig = {}
    if (customOptions) {
      customColumnConfig = customOptions[key] || {}
    }
    const column: DataTableColumn<T> = {
      title: headers[key],
      key: key,
      ...customColumnConfig
    }
    columns.push(column)
  }
  return columns
}

const DEFAULT_PAGE_OPTIONS: Partial<IOptions<any>> = {
  immediate: true,
  returnHeader: true
}
// Q 是请求参数类型，R是响应参数类型（单条数据）
/**
 *
 * @param request 请求
 * @param paramsHandleFn 入参处理方法，在请求前调用获取到入参
 * @param options 可选项，配置column、自定义响应处理方法、自定义分页等
 * @returns
 */
const useTablePage = <Q extends IPaginationRequest, R>(request: IRequest<Q, IPaginationResData<R[]>>, paramsHandleFn: (pagination: IPaginationRequest) => Q, options?: IOptions<R>) => {
  const tableData = ref<R[]>([])
  const tableColumns = ref<DataTableColumns<R>>([])
  const loading = ref(false)
  const mergedOptions = merge(DEFAULT_PAGE_OPTIONS, options)
  const pagination = reactive({
    page: 1,
    pageSize: mergedOptions?.pageConfig?.pageSize ? mergedOptions.pageConfig.pageSize : 30,
    pageSizes: mergedOptions?.pageConfig?.pageSizes ? mergedOptions.pageConfig.pageSizes : [30, 50, 100],
    itemCount: 0,
    showSizePicker: true,
    onChange: handlePageChange,
    onUpdatePageSize: handlePageSizeChange
  })
  async function doTableRequest() {
    const params = paramsHandleFn({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    loading.value = true
    const [data, error] = await request(params)
    loading.value = false
    if (error || !data) {
      return
    }
    // table_data取值
    const { data: pageData } = data || {}
    tableData.value = pageData?.tableData || []
    pagination.itemCount = pageData?.pageData?.count || 0
    if (options?.returnHeader && pageData?.header) {
      tableColumns.value = dealWithTableColumns(pageData.header || {}, options?.customHeaders)
    }
    // 自定义处理方法
    if (options?.customResHandleFn) {
      options.customResHandleFn(pageData)
    }
  }
  function handlePageChange(page: number) {
    pagination.page = page
    doTableRequest()
  }
  function handlePageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    doTableRequest()
  }
  function refresh(firstPage = false) {
    if (firstPage) {
      pagination.page = 1
    }
    doTableRequest()
  }

  return {
    tableData,
    tableColumns,
    pagination,
    loading,
    refresh
  }
}

export default useTablePage
