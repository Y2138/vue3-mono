## 组件设计
- 表单绑定值为一个 `object`
- 参数设置 
  - model 数据源
  - col 单行控件的个数
  - gap 控件之间的间距
  - labelWidth 表单标签的宽度
  - showValid 是否显示校验错误提示
  - optionsApi 筛选项api接口
  - extraOptions 额外筛选项
  - formItem 表单配置
    - valueKey 对应数据源中字段名
    - isTxt 是否仅显示文案
    - textKey 对应数据源中文案字段名
    - comp 组件类型 支持element表单组件、simpleSelect、simpleDateTimePicker等
    - props 组件的props
    - optionsKey 筛选项数据源字段名 select、radio、checkbox、cascader等选项时可用
    - required 该项是否必填
    - rule 表单校验规则（正则表达式）支持: userName、email、phone、plusInt等
    - showValid 是否在表单项下方显示校验错误提示
    - validTips 校验提示信息
    - width 控件占用宽度
    - visibleLinks 表单联动，用于控制面板是否展示 `Array<Record<string, any[]>>` or `(formModel) => boolean`
    - insertSlots 字符串数组，指明组件需要的插槽，可以用 `${valueKey}_${insertSlots[i]}` 来向插槽中插入自定义内容

### 组件配置项
```js
// 表单数据源
formModel.value = {
  field1: '字段1',
  field2: 2,
  field3: '字段3',
  field4: '字段4'
}
// 组件配置
const configs: FormItemProps[] = [
  {
    valueKey: 'field1',
    label: '表单项1',
    comp: 'ElInput', // 组件名
    props: {
      maxlength: 10,
    },
		innerSlots: ['prepend', 'append']
  },
	{
		valueKey: 'field4',
    label: '表单项4',
    comp: 'ElInput',
		rule: FormValidRules.IntegerPlusRegexp,
    props: {
      maxlength: 10,
    },
	},
  {
    valueKey: 'field2',
    label: '表单项2',
    comp: 'MySelect',
    props: {
      maxlength: 10,
      options: [
        {
          label: '选项1',
          value: 1,
        },
        {
          label: '选项2',
          value: 2,
        },
      ],
    },
  },
  {
    valueKey: 'field3',
    label: '标单项3',
    comp: 'MySelect',
    props: {
      maxlength: 10,
      options: [
        {
          label: '选项1',
          value: 1,
        },
        {
          label: '选项2',
          value: 2,
        },
      ],
    },
    visibleLinks: [
      { field1: ['哈哈哈'], field2: [2] },
      { field1: ['这是什么'] },
    ],
  },
]
```

### rule 校验规则
支持的校验规则如下，也可以传入 `customRule` 来传入自定义的正则 会覆盖 `rule` 的配置
- xxx1
- xxx2

### links规则
TODO: 需要支持表达式，比如大于 小于 等于 不等于 等情况
可通过 `visibleLinks` `requiredLinks` 等字段来实现表单的联动效果
一个基本的配置如下：
```js
visibleLinks: [
  { field1: ['哈哈哈'], field2: [2] },
  { field1: ['这是什么'] },
]
```
其中，`field1` 表示依赖数据源中的字段名，['哈哈哈'] 表示这个值的范围
即当满足field1 == '哈哈哈' && field2 == '2'时条件成立，该选项会展示

## 实现思路
根组件 `FormRoot`
子组件 `FormItem`
### 根组件
- 样式、布局设置
- 将model利用 `provide` 提供给所有子组件使用
- 组件

### 子组件
- 根据传入的 `comp` 指定渲染的内容
- 实现传入数据 和 表单组件的关联性，如监听 `model[key]` 来给`v-model` 设置具体值；当组件数据变更时告诉根组件更新数据
- 实现联动，条件渲染
