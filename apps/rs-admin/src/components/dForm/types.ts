import type { FormItemRule } from 'naive-ui'

export interface IFormConfig<T = Record<string, any>> {
  valueKey: string
  label: string
  isTxt?: boolean
  textKey?: string
  comp: string
  props: T
  optionsKey?: string
  rule: FormItemRule
  width: number | string
  /* 内部组件插槽，${valueKey}_${innerSlots[i]}来使用插槽 */
  innerSlots: string[]
  visibleLinks: Record<string, any[]>[] | ((formModel: Record<string, any>) => boolean)
}

export interface IOption {
  label: string
  value: string | number | boolean
}
