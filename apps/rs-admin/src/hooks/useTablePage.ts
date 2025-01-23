import { reactive, ref } from 'vue'
import type { DataTableColumns, DataTableColumn } from 'naive-ui'

interface IOptions<R> {
  returnHeader: boolean,
  customHeaders?: Record<string, DataTableColumn<R>>
  customResHandleFn?: (data?: IPaginationResData<R[]>) => void
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
    const [data, error] = await request(params)
    loading.value = false
    // 本地测试用
    // const res: IPaginationResData<R[]> = {"table_data":[{"date":"2025-01","book_id":"578985","free_book_id":"1569173","api_book_id":"2709","client_id":"3","vip_amount":"8.00","vip_read_num":"470","vip_read_seconds":"6.95","is_vip":"1","latest_change_at":"2025-01-16 21:24:59","title":"星兽王","contract_type":"101","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"普通买断","is_vip_txt":"是","client_txt":"纵横中文网"},{"date":"2025-01","book_id":"100001","free_book_id":"-","api_book_id":"100001","client_id":"1","vip_amount":"10.00","vip_read_num":"100","vip_read_seconds":"0.03","is_vip":"0","latest_change_at":"2025-01-13 18:00:45","title":"大爱如烟","contract_type":"42","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"保底全版权2024版","is_vip_txt":"否","client_txt":"七猫中文网"},{"date":"2025-01","book_id":"100003","free_book_id":"-","api_book_id":"100003","client_id":"1","vip_amount":"20.00","vip_read_num":"200","vip_read_seconds":"0.06","is_vip":"0","latest_change_at":"2025-01-13 18:00:45","title":"总裁难追妻：就是杠上你！","contract_type":"2","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"纯分成","is_vip_txt":"否","client_txt":"七猫中文网"},{"date":"2025-01","book_id":"500029","free_book_id":"1665842","api_book_id":"500029","client_id":"2","vip_amount":"1.00","vip_read_num":"100","vip_read_seconds":"0.03","is_vip":"0","latest_change_at":"2025-01-13 00:00:00","title":"让你拍广告促消费，你笑翻全网？","contract_type":"2","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"纯分成","is_vip_txt":"否","client_txt":"奇妙小说网"}],"page_data":{"count":"4","page":"1","page_size":"50"},"total_data":{"vip_amount":"39.00","date":"总计"},"header":{"date":"日期","book_id":"作品ID","free_book_id":"平台ID","api_book_id":"纵横ID","title":"作品名","client_txt":"源站","vip_amount":"单本会员书收益","vip_read_num":"会员阅读人数","vip_read_seconds":"会员阅读时长（H）","is_vip_txt":"是否为会员书","latest_change_at":"会员书库变更记录"}}
    // tableData.value = res.table_data || []
    // pagination.itemCount = res.page_data.count || 0
    // tableColumns.value = dealWithTableColumns(res.header || {}, options?.customHeaders)


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
    console.log('2222')
    pagination.page = page
    doTableRequest()
  }
  function handlePageSizeChange(pageSize: number) {
    console.log('3333')
    pagination.pageSize = pageSize
    doTableRequest()
  }
  function firstPageRequest() {
    pagination.page = 1
    doTableRequest()
  }
  const pagination = reactive({
    page: 1,
    pageSize: 2,
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
