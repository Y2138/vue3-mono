<template>
    <div>
        <p>
            Test: {{ curCount }}
        </p>
        <el-button @click="handleAdd">组件test add</el-button>
        <el-button @click="handleGet">组件test get</el-button>
    </div>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus'
import { ref } from 'vue';
import { countFn } from '../utils'

const { getCount, addCount } = countFn()
const curCount = ref(getCount())
function handleAdd() {
    addCount();
    curCount.value = getCount();
}
function handleGet() {
    curCount.value = getCount();
}
</script>

<style scoped>

</style>