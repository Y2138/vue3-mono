<template>
    <el-date-picker v-model="bindValue" v-bind="compConfigs"></el-date-picker>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { ElDatePicker, type DatePickerProps } from 'element-plus';
const props = defineProps<{
    // "year" | "years" | "month" | "months" | "date" | "dates" | "week" | "datetime" | "datetimerange" | "daterange" | "monthrange" | "yearrange"
    type: DatePickerProps['type'],
    useShortCuts: boolean
}>()
const bindValue = defineModel<string | string[]>('')

const attrs = useAttrs()
const timeBaseConfigs: Partial<DatePickerProps> = {
    format: 'YYYY-MM-DD HH:mm:SS',
    valueFormat: 'YYYY-MM-DD HH:mm:SS',
    placeholder: '请选择日期时间'
}

const dateBaseConfigs: Partial<DatePickerProps> = {
    format: 'YYYY-MM-DD',
    valueFormat: 'YYYY-MM-DD',
    placeholder: '请选择日期'
}

const monthBaseConfigs: Partial<DatePickerProps> = {
    format: 'YYYY-MM',
    valueFormat: 'YYYYMM',
    placeholder: '请选择月份'
}

const yearBaseConfigs: Partial<DatePickerProps> = {
    format: 'YYYY',
    valueFormat: 'YYYY',
    placeholder: '请选择年份'
}


const dateRangeConfigs: Partial<DatePickerProps> = {
    rangeSeparator: '-',
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期',
}

const monthRangeConfigs: Partial<DatePickerProps> = {
    startPlaceholder: '开始月份',
    endPlaceholder: '结束月份'
}
const yearRangeConfigs: Partial<DatePickerProps> = {
    startPlaceholder: '开始年份',
    endPlaceholder: '结束年份'
}

const dateTimeRangeConfigs: Partial<DatePickerProps> = {
    rangeSeparator: '-',
    startPlaceholder: '开始时间',
    endPlaceholder: '结束时间',
    defaultTime: [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]
}

const compConfigs = computed(() => {
    const configs = {}
    if (props.type.includes('date')) {
        Object.assign(configs, dateBaseConfigs)
        if (props.type.includes('datetime')) {
            Object.assign(configs, timeBaseConfigs)
        } else {
            Object.assign(configs, dateBaseConfigs)
        }
        if (props.type === 'daterange') {
            Object.assign(configs, dateRangeConfigs)
        }
        if (props.type === 'datetimerange') {
            Object.assign(configs, dateTimeRangeConfigs)
        }
    } else if (props.type.includes('month')) {
        Object.assign(configs, monthBaseConfigs)
        if (props.type === 'monthrange') {
            Object.assign(configs, monthRangeConfigs)
        }
    }  else if (props.type.includes('year')) {
        Object.assign(configs, yearBaseConfigs)
        if (props.type === 'yearrange') {
            Object.assign(configs, yearRangeConfigs)
        }
    }
    return { ...configs, ...attrs }
})
</script>

<style scoped></style>
