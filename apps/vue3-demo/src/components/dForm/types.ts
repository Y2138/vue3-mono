import { type Ref } from 'vue'

export interface FormItemProps {
  /* 表单值字段 */
  valueKey: string
  /* 表单文案字段 */
  textKey?: string
  /* 表单标题文案 */
  label: string
  /* 组件名 默认el-inputs */
  comp?: string
  isTxt?: boolean
  props?: Record<string, unknown>
  optionsKey?: string // 筛选项key
  required?: boolean // 该项是否必填
  rule?: FormValidRules | RegExp // 校验规则，规则支持如下：
  validTips?: string // 校验信息
  width?: string
  labelWidth?: string
  /* 是否可见的联动选项：数组，每一项为object object的key为model中对应字段的key值，value为该key的取值范围 数组 */
  visibleLinks?: Array<Record<string, any[]>> | ((formModel: FormModelContext[0]) => boolean)
  // 内部插槽名
  innerSlots?: string[]

  showValid?: boolean // 是否需要标红 为了区分
  checkTrigger?: ('blur' | 'change' | 'input')[]
}

export const FormModelContextKey = Symbol('formModel')

export type FormModelContext = [
  formModel: Ref<Record<string, any>>,
  updateFormModel: (valueKey: string, newVal: string | number) => void,
  selectOptions: Ref<Record<string, any[]>>,
  rootConfig: {
    showValid: boolean,
  }
]

export enum FormValidRules {
  /* 中文 */
  CN = 'cnRegexp',
  /* 用户名 */
  UserName = 'usNameRegexp',
  /* 密码 */
  Password = 'passwordRegexp',
  /* 正整数 */
  PlusInt = 'IntegerPlusZeroRegexp',
  /* 自然数 */
  NatureInt = 'IntegerPlusRegexp',
}

export const FORMVALIDREGEXPS: Record<FormValidRules, RegExp> = {
  // 中文
  [FormValidRules.CN]: /[u4E00-u9FA5]/,
  // 用户名: 3到16为（字母、数字、下划线）
  [FormValidRules.UserName]: /^[a-zA-Z0-9_-]{3,16}$/,
  // 密码强度: 最少6位，包括至少1个大写字母，1个小写字母，1个数字，1个特殊字符
  [FormValidRules.Password]:
    /^.*(?=.{6,})(?=.*d)(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*? ]).*$/,
  // 正整数
  [FormValidRules.PlusInt]: /^[1-9]\d*$/,
  // 自然数
  [FormValidRules.NatureInt]: /^[1-9]\d*|0$/,
}
