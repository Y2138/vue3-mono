import { reactive, ref } from 'vue'
import type { DataTableColumns, DataTableColumn } from 'naive-ui'

interface IOptions<R> {
  returnHeader: boolean,
  customHeaders?: Record<string, DataTableColumn<R>>
  customResHandleFn?: (data?: IPaginationResData<R[]>) => void
  pageConfig?: {
    pageSize: number
    pageSizes: number[]
  }
}
function dealWithTableColumns<T = any>(
  headers: Record<string, string>,
  customOptions?: Record<string, DataTableColumn<T>>
) {
  const columns: DataTableColumns<T> = []
  Object.keys(headers).forEach(key => {
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
  })
  return columns
}
// Q 是请求参数类型，R是响应参数类型（单条数据）
/**
 *
 * @param request 请求
 * @param paramsHandleFn 入参处理方法，在请求前调用获取到入参
 * @param options 可选项，配置column、自定义响应处理方法、自定义分页等
 * @returns
 */
const useTablePage = <Q extends IPaginationRequest, R>(
  request: IRequest<Q, IPaginationResData<R[]>>,
  paramsHandleFn: () => Q,
  options?: IOptions<R>
) => {
  const tableData = ref<R[]>([])
  const tableColumns = ref<DataTableColumns<R>>([])
  const loading = ref(false)
  async function doTableRequest() {
    const params = paramsHandleFn()
    loading.value = true
    const res = await request(params)
    const [data, error] = res
    loading.value = false
    if (error || !data) {
      return
    }
    // table_data取值
    const { data: pageData } = data || {}
    tableData.value = pageData?.table_data || []
    pagination.itemCount = pageData?.page_data?.count || 0
    if (options && options.returnHeader && pageData?.header) {
      tableColumns.value = dealWithTableColumns(pageData.header || {}, options?.customHeaders)
    }
    // 自定义处理方法
    if (options && options.customResHandleFn) {
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
  function firstPageRequest() {
    pagination.page = 1
    doTableRequest()
  }
  const pagination = reactive({
    page: 1,
    pageSize: options?.pageConfig?.pageSize ? options.pageConfig.pageSize : 30,
    pageSizes: options?.pageConfig?.pageSizes ? options.pageConfig.pageSizes : [30, 50, 100],
    itemCount: 0,
    showSizePicker: true,
    onChange: handlePageChange,
    onUpdatePageSize: handlePageSizeChange
  })

  return {
    tableData,
    tableColumns,
    pagination,
    loading,
    firstPageRequest,
  }
}

export default useTablePage
