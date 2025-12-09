<template>
  <SearchPanel :cols="4" :formModel="formModel" :searchLoading="loading" searchOnUpdate @search="refresh" @reset="handleReset">
    <template #top>
      <n-radio-group v-model:value="formModel.type" class="mb-4 bg-blue-500 text-white rounded" @update:value="handleRadioChange">
        <n-radio-button value="date" class="hover:bg-blue-600 rounded">日汇总</n-radio-button>
        <n-radio-button value="month" class="hover:bg-blue-600 rounded">月汇总</n-radio-button>
        <n-radio-button value="year" class="hover:bg-blue-600 rounded">年汇总</n-radio-button>
      </n-radio-group>
    </template>
    <WrapCol label="创建时间">
      <n-date-picker v-if="formModel.type === 'date'" v-model:formatted-value="formModel.daterange" close-on-select type="daterange" clearable value-format="yyyy-MM-dd"> </n-date-picker>
      <n-date-picker v-else-if="formModel.type === 'month'" v-model:formatted-value="formModel.daterange" type="monthrange" clearable value-format="yyyyMM"> </n-date-picker>
      <n-date-picker v-else-if="formModel.type === 'year'" v-model:formatted-value="formModel.start_date" type="year" clearable value-format="yyyy"> </n-date-picker>
    </WrapCol>
    <WrapCol label="所属部门">
      <n-select v-model:value="formModel.dept" :options="departmentOptions"></n-select>
    </WrapCol>
    <WrapCol label="编辑">
      <n-input v-model:value="formModel.keywords" :options="editorOptions"></n-input>
    </WrapCol>
    <WrapCol></WrapCol>
  </SearchPanel>
  <n-data-table class="mt-2" :columns="tableColumns" :data="tableData" :pagination="pagination"> </n-data-table>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import useTablePage from '@/hooks/useTablePage'
import { post } from '@/request/axios'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { format } from 'date-fns'
import { usePageLoading } from '@/hooks/usePageLoading'
interface IFormModel {
  type: 'date' | 'month' | 'year'
  daterange: null | [string, string]
  dept: string | null
  keywords: string
  start_date: string
}
interface IReq extends Partial<Omit<IFormModel, 'daterange'>> {
  start_date?: string
  end_date?: string
  page: number
  pageSize: number
}
interface IRes {
  date: string
  book_id: string
  free_book_id: string
  api_book_id: string
  client_id: string
  vip_amount: string
  vip_read_num: string
  vip_read_seconds: string
  is_vip: string
  latest_change_at: string
  title: string
  contract_type: string
  is_full_cr: string
  is_direct_sign: string
  contract_type_text: string
}

usePageLoading()

const formModel = ref<IFormModel>({
  type: 'date' as 'date' | 'month' | 'year',
  daterange: null as null | [string, string],
  keywords: '',
  dept: null,
  start_date: ''
})
const departmentOptions = ref<SelectMixedOption[]>([{ label: '全部', value: undefined }])
const editorOptions = ref([{ label: '全部', value: undefined }])
function handleReset() {
  formModel.value.daterange = null
  formModel.value.keywords = ''
  refresh(true)
}
function handleRadioChange(type: string) {
  switch (type) {
    case 'date':
      formModel.value.daterange = null
      break
    case 'month':
      formModel.value.daterange = [format(Date.now(), 'yyyyMM'), format(Date.now(), 'yyyyMM')]
      break
    case 'year':
      formModel.value.start_date = format(Date.now(), 'yyyy')
      break
    default:
      break
  }
  refresh(true)
}

const requestFn = (data: IReq) => post<IReq, IRes[]>('/statistics/zhzww-vip/list', { params: data })
const dealParams = (): IReq => {
  const { daterange, ...rest } = formModel.value
  const params: IReq = {
    ...rest,
    page: pagination.page,
    pageSize: pagination.pageSize
  }
  if (['date', 'month'].includes(formModel.value.type) && daterange && daterange.length) {
    const [start, end] = daterange
    params.start_date = start
    params.end_date = end
  }
  return params
}
// const handleRes = () => {
//   console.log('2501===>')
//   const res: IPaginationResData<IRes[]> = {"table_data":[{"date":"2025-01","book_id":"578985","free_book_id":"1569173","api_book_id":"2709","client_id":"3","vip_amount":"8.00","vip_read_num":"470","vip_read_seconds":"6.95","is_vip":"1","latest_change_at":"2025-01-16 21:24:59","title":"星兽王","contract_type":"101","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"普通买断","is_vip_txt":"是","client_txt":"纵横中文网"},{"date":"2025-01","book_id":"100001","free_book_id":"-","api_book_id":"100001","client_id":"1","vip_amount":"10.00","vip_read_num":"100","vip_read_seconds":"0.03","is_vip":"0","latest_change_at":"2025-01-13 18:00:45","title":"大爱如烟","contract_type":"42","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"保底全版权2024版","is_vip_txt":"否","client_txt":"七猫中文网"},{"date":"2025-01","book_id":"100003","free_book_id":"-","api_book_id":"100003","client_id":"1","vip_amount":"20.00","vip_read_num":"200","vip_read_seconds":"0.06","is_vip":"0","latest_change_at":"2025-01-13 18:00:45","title":"总裁难追妻：就是杠上你！","contract_type":"2","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"纯分成","is_vip_txt":"否","client_txt":"七猫中文网"},{"date":"2025-01","book_id":"500029","free_book_id":"1665842","api_book_id":"500029","client_id":"2","vip_amount":"1.00","vip_read_num":"100","vip_read_seconds":"0.03","is_vip":"0","latest_change_at":"2025-01-13 00:00:00","title":"让你拍广告促消费，你笑翻全网？","contract_type":"2","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"纯分成","is_vip_txt":"否","client_txt":"奇妙小说网"}],"page_data":{"count":"4","page":"1","page_size":"50"},"total_data":{"vip_amount":"39.00","date":"总计"},"header":{"date":"日期","book_id":"作品ID","free_book_id":"平台ID","api_book_id":"纵横ID","title":"作品名","client_txt":"源站","vip_amount":"单本会员书收益","vip_read_num":"会员阅读人数","vip_read_seconds":"会员阅读时长（H）","is_vip_txt":"是否为会员书","latest_change_at":"会员书库变更记录"}}
//   tableData.value = res.table_data || []
//   pagination.itemCount = res.page_data.count || 0
// }
const { pagination, tableColumns, tableData, loading, refresh } = useTablePage<IReq, IRes>(requestFn, dealParams, {
  returnHeader: true
  // customResHandleFn: handleRes
})
// 首次请求
</script>
