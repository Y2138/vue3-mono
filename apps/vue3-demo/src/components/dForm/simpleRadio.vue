<template>
    <ElRadioGroup v-model="inValue" v-bind="$attrs">
        <ElRadio
            v-for="item in options"
            :key="item.value"
            v-bind="{...item}">
            <slot>
                {{ item.label }}
            </slot>
        </ElRadio>
    </ElRadioGroup>
</template>

<script setup lang="ts">
import { ElRadioGroup, ElRadio, type RadioProps } from 'element-plus';
import { toRefs } from 'vue';

interface IOption extends RadioProps {
    label: string
    value: number | string
    disabled: boolean
}

const props = defineProps<{
    options: Array<IOption>
}>()

const { options } = toRefs(props)

const inValue = defineModel<number | string>()

</script>

<style lang="scss" scoped>

</style>