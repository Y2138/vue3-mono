import type { FormItemRule, RadioButtonProps, SelectProps, DatePickerProps, CheckboxGroupProps, CascaderProps, InputProps, InputNumberProps, TimePickerProps } from 'naive-ui'


export interface IOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

type withOption<T> = T & {
  options: IOption[]
}
// 组件及其内部属性
type FormType =
  | { comp: 'd-radio', props?: withOption<RadioButtonProps> }
  | { comp: 'n-select', props?: withOption<SelectProps> }
  | { comp: 'd-date-picker', props?: Omit<DatePickerProps, 'value'> & { value?: string | [string, string] | null } }
  | { comp: 'd-checkbox', props?: withOption<CheckboxGroupProps> }
  | { comp: 'n-cascader', props?: withOption<CascaderProps> }
  | { comp: 'n-input', props?: InputProps }
  | { comp: 'n-input-number', props?: InputNumberProps }
  | { comp: 'n-time-picker', props?: TimePickerProps }

type WithConfig<T> = T & {
  valueKey: string
  label: string
  isTxt?: boolean
  textKey?: string
  optionsKey?: string
  rule?: FormItemRule
  width?: number | string
  /* 内部组件插槽，${valueKey}_${innerSlots[i]}来使用插槽 */
  innerSlots?: string[]
  visibleLinks?: Record<string, any[]>[] | ((formModel: Record<string, unknown>) => boolean)
}
export type IFormConfig = WithConfig<FormType>
