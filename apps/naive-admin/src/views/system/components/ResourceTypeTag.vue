<template>
  <n-tag :type="tagType" :size="size">
    {{ displayLabel }}
  </n-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'

// 资源类型映射关系（统一标准）
const TYPE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '目录', color: 'info' },
  2: { label: '页面', color: 'success' },
  3: { label: '接口', color: 'warning' },
  4: { label: '模块', color: 'primary' }
}

// Props 定义
interface Props {
  type: number
  typeDesc?: string
  size?: 'tiny' | 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  typeDesc: undefined,
  size: 'small'
})

// 计算显示的标签文本（优先使用 typeDesc）
const displayLabel = computed(() => {
  if (props.typeDesc) {
    return props.typeDesc
  }
  return TYPE_MAP[props.type]?.label || '未知'
})

// 计算标签颜色
const tagType = computed(() => {
  const color = TYPE_MAP[props.type]?.color || 'default'
  return color as any
})
</script>
