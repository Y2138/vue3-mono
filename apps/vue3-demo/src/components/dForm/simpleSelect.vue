<template>
    <ElSelect v-model="inValue" v-bind="$attrs">
        <ElOption
            v-for="item in options"
            :key="item.value"
            v-bind="{...item}">
        </ElOption>
    </ElSelect>
</template>

<script setup lang="ts">
import { ElSelect, ElOption, type SelectOptionProxy } from 'element-plus';
import { toRefs } from 'vue';

interface IOption extends SelectOptionProxy {
    label: string
    value: number | string
}

const props = defineProps<{
    options: Array<IOption>
}>()

const { options } = toRefs(props)

const inValue = defineModel<string | string[]>('')

</script>

<style lang="scss" scoped>

</style>