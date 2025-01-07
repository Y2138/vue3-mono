<template>
    <ElCheckboxGroup v-model="inValue" v-bind="$attrs">
        <component
            :is="componentsName[btnStyle]"
            v-for="item in options"
            :key="item.value"
            v-bind="{...item}">
            <slot>
                {{ item.label }}
            </slot>
        </component>
    </ElCheckboxGroup>
</template>

<script setup lang="ts">
import { ElCheckboxGroup, ElCheckbox, ElCheckboxButton, type CheckboxProps } from 'element-plus';
import { shallowReactive } from 'vue';

const componentsName = shallowReactive({
    ElCheckbox,
    ElCheckboxButton
})

interface IOption extends CheckboxProps {
    label: string
    value: number | string
    disabled: boolean
}

const { options, btnStyle = 'ElCheckbox' } = defineProps<{
    options: Array<IOption>,
    btnStyle: keyof typeof componentsName,
    border: boolean
}>()

const inValue = defineModel<string[] | number[]>()

</script>

<style lang="scss" scoped>

</style>