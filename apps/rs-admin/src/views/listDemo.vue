<template>
  <div>
    <SearchPanel inline>
      <WrapCol label="日期">
        <n-date-picker v-model:value="formModel.daterange" close-on-select type="daterange"></n-date-picker>
      </WrapCol>
      <WrapCol label="名称">
        <n-date-picker v-model:value="formModel.daterange" close-on-select type="daterange"></n-date-picker>
      </WrapCol>
      <WrapCol label="名称">
        <n-date-picker v-model:value="formModel.daterange" close-on-select type="daterange"></n-date-picker>
      </WrapCol>
    </SearchPanel>
      <!-- <n-form
        ref="formRef"
        inline
        label-width="auto"
        label-align="left"
        label-placement="left"
        :model="formModel"
        size="small">
        <n-form-item label="日期" path="date">
          <n-date-picker v-model:value="formModel.daterange" close-on-select type="daterange"></n-date-picker>
        </n-form-item>
        <n-form-item label="Name" path="name">
          <n-input v-model:value="formModel.name" />
        </n-form-item>
        <n-form-item label="Age" path="age">
          <n-input v-model:value="formModel.age" />
        </n-form-item>
        <n-form-item label="Address" path="address">
          <n-input v-model:value="formModel.address" />
        </n-form-item>
        <n-form-item>
          <n-button @click="firstPageRequest">查询</n-button>
        </n-form-item>
      </n-form> -->
    <n-data-table
      class="mt-2"
      :columns="tableColumns"
      :data="tableData"
      :pagination="pagination"
      >
    </n-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import useTablePage from '@/hooks/useTablePage'
import { get } from '@/request/axios'
import WrapCol from '@/components/wrapRow/wrapCol.vue'
const formRef = ref()
const formModel = ref({
  daterange: null,
  name: 'John',
  age: 18,
  address: 'New York No. 1 Lake Park'
})
interface IReq {
  type: string
  page: number
  page_size: number
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
const requestFn = (data: IReq) => get<IReq, IPaginationResData<IRes[]>>('/api/statistics/zhzww-vip/list', { data })
const dealParams = (): IReq => {
  return {
    type: 'date',
    page: pagination.page,
    page_size: pagination.pageSize
  }
}
const handleRes = () => {
  console.log('2501===>')
  const res: IPaginationResData<IRes[]> = {"table_data":[{"date":"2025-01","book_id":"578985","free_book_id":"1569173","api_book_id":"2709","client_id":"3","vip_amount":"8.00","vip_read_num":"470","vip_read_seconds":"6.95","is_vip":"1","latest_change_at":"2025-01-16 21:24:59","title":"星兽王","contract_type":"101","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"普通买断","is_vip_txt":"是","client_txt":"纵横中文网"},{"date":"2025-01","book_id":"100001","free_book_id":"-","api_book_id":"100001","client_id":"1","vip_amount":"10.00","vip_read_num":"100","vip_read_seconds":"0.03","is_vip":"0","latest_change_at":"2025-01-13 18:00:45","title":"大爱如烟","contract_type":"42","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"保底全版权2024版","is_vip_txt":"否","client_txt":"七猫中文网"},{"date":"2025-01","book_id":"100003","free_book_id":"-","api_book_id":"100003","client_id":"1","vip_amount":"20.00","vip_read_num":"200","vip_read_seconds":"0.06","is_vip":"0","latest_change_at":"2025-01-13 18:00:45","title":"总裁难追妻：就是杠上你！","contract_type":"2","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"纯分成","is_vip_txt":"否","client_txt":"七猫中文网"},{"date":"2025-01","book_id":"500029","free_book_id":"1665842","api_book_id":"500029","client_id":"2","vip_amount":"1.00","vip_read_num":"100","vip_read_seconds":"0.03","is_vip":"0","latest_change_at":"2025-01-13 00:00:00","title":"让你拍广告促消费，你笑翻全网？","contract_type":"2","is_full_cr":"0","is_direct_sign":"0","contract_type_text":"纯分成","is_vip_txt":"否","client_txt":"奇妙小说网"}],"page_data":{"count":"4","page":"1","page_size":"50"},"total_data":{"vip_amount":"39.00","date":"总计"},"header":{"date":"日期","book_id":"作品ID","free_book_id":"平台ID","api_book_id":"纵横ID","title":"作品名","client_txt":"源站","vip_amount":"单本会员书收益","vip_read_num":"会员阅读人数","vip_read_seconds":"会员阅读时长（H）","is_vip_txt":"是否为会员书","latest_change_at":"会员书库变更记录"}}
  tableData.value = res.table_data || []
  pagination.itemCount = res.page_data.count || 0
}
const {
  pagination,
  tableColumns,
  tableData,
  firstPageRequest } = useTablePage<IReq, IRes>(requestFn, dealParams, {
    returnHeader: true,
    customResHandleFn: handleRes
  })
firstPageRequest()
</script>

<style scoped>

</style>
