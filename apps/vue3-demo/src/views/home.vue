<template>
  <FormRoot
    v-model="formModel"
    :configs="configs"
    label-width="180px"
    options-api="/testaaaa"
    :extra-options="mockExtraOptions as unknown as Record<string, any[]>"
  >
    <template #price_append>
      元/千字
    </template>
    <template #except_total_words_min>
      <div class="flex">
        <el-input v-model="formModel.except_total_words_max" type="number">
          <template #append>万</template>  
        </el-input>
        <span>-</span>
        <el-input v-model="formModel.except_total_words_min" type="number">
          <template #append>万</template>  
        </el-input>
      </div>
    </template>
    <template #contract_term_type_formSuffix>
      <span>年</span>
    </template>
  </FormRoot>
  <ElButton @click="handleSubmit">提交</ElButton>
  <!-- <ElButton @click="handleChange">外部改变form值</ElButton>
    <el-button @click="handleAdd">组件test add</el-button>
    <el-button @click="handleGet">组件home get</el-button>
    <p>Home: {{ curCount }}</p>
    <Test></Test> -->
</template>
<script setup lang="ts">
import FormRoot from '../components/dForm/root.vue'
import { ElButton, ElInput } from 'element-plus'
import { ref } from 'vue'
import { type FormItemProps, FormValidRules } from '../components/dForm/types'
// import Test from './test.vue'
import { mockExtraOptions } from '../components/dict/mockOptions'
defineOptions({
  name: 'My-Home',
})
const formModel = ref({
  id: '1965',
  book_id: '203198',
  title: '我有一剑笑万古',
  alias: '',
  book_level: '1',
  first_scripts_time: '2020-08-05',
  contract_type: '42',
  sign_type: '1',
  contract_no: '',
  except_month_words: '22',
  except_total_words_min: '2',
  except_total_words_max: '222',
  guarding_right_proportion: '0.30',
  memo: '',
  author_sign_time: '',
  book_length_type: '2',
  is_jump: false,
  client_id: '1',
  client_txt: '七猫中文网',
  receipt_status: true,
  contract_begin_date: '2020-08-05',
  activity_txt: '未参加征文',
  pre_over_time: '',
  account_type: '1',
  company_id: '1',
  company_txt: '七猫',
  vat_invoice: '',
  is_post: '1',
  extend_contract_term: '20',
  price: '111',
  calculate_proportion: '0.50',
  our_calculate_proportion: '0.50',
  nonele_calculate_proportion: '0.50',
  supply_bd_ratio: '30',
  contract_term_type: '10',
  copyright_list: ['1'],
  copyright_list_text: '全版权',
})
const handleSubmit = () => {
  console.log('current formModel: ', formModel.value)
  // formModel.value = {
  //   // field1: '改了改了111',
  //   // field2: '2',
  //   // field3: '1',
  // }
}

const configs: FormItemProps[] = [
  {
    valueKey: 'client_id',
    textKey: 'client_txt',
    label: '源站',
    isTxt: true,
    width: '100%',
    // innerSlots: ['prepend', 'append']
  },
  {
    valueKey: 'title',
    label: '作品名',
    isTxt: true,
    rule: FormValidRules.IntegerPlus,
    props: {
      maxlength: 10,
    },
  },
  {
    valueKey: 'alias',
    label: '又名',
    props: {
      maxlength: 10,
      placeholder: '非必填',
    },
  },
  {
    valueKey: 'sign_type',
    label: '合同形式',
    comp: 'SimpleSelect',
    required: true,
    optionsKey: 'sign_type_list',
    props: {
    },
    // visibleLinks: [
    //   { field1: ['哈哈哈'], field2: [2] },
    //   { field1: ['这是什么'] },
    // ],
  },
  {
    valueKey: 'company_id',
    label: '签约主体',
    textKey: 'company_txt',
    required: true,
    isTxt: true,
  },
  {
    valueKey: 'contract_type',
    label: '合同类型',
    comp: 'SimpleSelect',
    required: true,
    optionsKey: 'contract_type_list'
  },
  {
    valueKey: 'price',
    label: '千字价格',
    required: true,
    innerSlots: ['append'],
  },
  {
    valueKey: 'contract_begin_date',
    label: '第一次交稿时间',
    comp: 'SimpleDateTimePicker',
    required: true,
    props: {
      type: 'date',
    },
  },
  {
    valueKey: 'book_length_type',
    label: '作品篇幅',
    optionsKey: 'book_length_type_list',
    props: {
      type: 'SimpleSelect',
      required: true,
    },
  },
  {
    valueKey: 'except_total_words_min',
    label: '作品预计总字数',
    required: true,
  },
  {
    valueKey: 'contract_term_type',
    label: '授权有效期限',
    required: true,
    comp: 'SimpleSelect',
    optionsKey: 'contract_term_type_list',
    innerSlots: ['formSuffix']
  }
]
</script>
<style lang="scss" scoped>
.flex {
  display: flex;
}
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
:deep(.el-input-group__append) {
  padding: 0 5px;
}
</style>
