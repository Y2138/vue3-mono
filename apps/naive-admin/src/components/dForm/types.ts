import type { CascaderProps, CheckboxGroupProps, DatePickerProps, FormInst, FormItemRule, InputNumberProps, InputProps, RadioButtonProps, SelectProps, TimePickerProps } from 'naive-ui'

export interface IOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

type withOption<T> = T & {
  options?: IOption[]
}
// 组件及其内部属性
type FormType =
  | { comp: 'd-radio'; props?: withOption<RadioButtonProps> }
  | { comp: 'n-select'; props?: withOption<SelectProps> }
  | { comp: 'd-date-picker'; props?: Omit<DatePickerProps, 'value'> & { value?: string | [string, string] | null } }
  | { comp: 'd-checkbox'; props?: withOption<CheckboxGroupProps> }
  | { comp: 'n-cascader'; props?: withOption<CascaderProps> }
  | { comp: 'n-input'; props?: InputProps }
  | { comp: 'n-input-number'; props?: InputNumberProps }
  | { comp: 'n-time-picker'; props?: TimePickerProps }

type WithConfig<T> = T & {
  valueKey: string
  label: string
  isText?: boolean
  textKey?: string
  optionsKey?: string
  required?: boolean
  rules?: FormItemRule | FormItemRule[]
  width?: number | string
  /* 内部组件插槽，${valueKey}_${innerSlots[i]}来使用插槽 */
  innerSlots?: string[]
  visibleLinks?: Record<string, any[]>[] | ((formModel: Record<string, unknown>) => boolean)
  /* 网格布局相关 */
  span?: number
  offset?: number
  suffix?: boolean
}
export type IFormConfig = WithConfig<FormType>

export type DFormRootProp = {
  formConfigs: IFormConfig[]
  selectOptions: Record<string, IOption[]>
  // 手动定义常用的 FormProps 属性，避免类型推断问题
  showFeedback?: boolean
  showLabel?: boolean
  showRequireMark?: boolean
  labelAlign?: 'left' | 'right'
  labelPlacement?: 'left' | 'top'
  labelWidth?: string | number
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  inline?: boolean
}

export type DFormRootInst = FormInst
