## WrapRow
> 布局组件，用于创建多列布局

## 设计思路
### 基础用法，多列布局
使用 `WrapRow` 组件，设置 `cols` 属性，即可创建多列布局；插槽内使用 `WrapCol` 组件，`WrapCol` 组件设置百分比并自动换行；
基础用法如下，会生成三列布局，每列占用宽度为33%：
```vue
<template>
  <WrapRow :cols="3">
    <WrapCol label="日期">
      <n-date-picker v-model:value="formModel.daterange" close-on-select type="daterange"></n-date-picker>
    </WrapCol>
    <WrapCol label="名称">
      <n-date-picker v-model:value="formModel.daterange" close-on-select type="daterange"></n-date-picker>
    </WrapCol>
    <WrapCol label="名称">
      <n-date-picker v-model:value="formModel.daterange" close-on-select type="daterange"></n-date-picker>
    </WrapCol>
  </WrapRow>
</template>
```
在使用时 `WrapRow` 用于控制总体布局
-  `cols` 属性，控制列数
-  `labelWidth` 属性，统一控制内部 `WrapCol` 组件的 `label` 宽度；
-  `labelAlign` 属性，控制每列的 `label` 对齐方式；
`WrapCol` 用于控制具体某一列的展示
- `label` 属性，控制列的 `label` 显示；
- `labelWidth` 属性，当前单元格的label宽度，优先级高于 `WrapRow` 的 `labelWidth`；
- `contentWidth` 属性，当前单元格内容的宽度，用于 `inline` 布局

### 支持行内使用
行内使用时，每个 `WrapCol` 的 `label` 宽度自适应，`content` 宽度由 `prop.contentWidth` 控制（默认为200px）
