<template>
  <n-card :title="isEditMode ? '编辑资源' : '创建资源'" bordered class="resource-form-card">
    <template #header-extra>
      <n-flex>
        <n-button @click="handleCancel">
          <template #icon>
            <n-icon><Icon icon="ion:close-circle" /></n-icon>
          </template>
          取消
        </n-button>
        <n-button type="primary" @click="handleSubmit" :loading="formLoading">
          <template #icon>
            <n-icon><Icon icon="ion:checkmark-circle" /></n-icon>
          </template>
          {{ isEditMode ? '保存修改' : '创建资源' }}
        </n-button>
      </n-flex>
    </template>

    <FormRoot ref="formRef" v-model:form-model="formData" :form-configs="formConfigs" :select-options="selectOptions" @submit="handleSubmit" />
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { getResources, getResourceById, getResourceEnums, createResource, updateResource } from '@/request/api/resource'
import type { IFormConfig, IOption } from '@/components/dForm/types'
import type { Resource } from '@/shared/resource'

const route = useRoute()
const router = useRouter()
const nMessage = useMessage()

// 表单引用
const formRef = ref()

// 表单加载状态
const formLoading = ref(false)

// 表单数据
const formData = reactive<Partial<Resource>>({
  id: '',
  name: '',
  type: 0,
  parentId: (route.query.parentId as string) || '',
  path: '',
  code: '',
  resCode: '',
  sortOrder: 0,
  description: ''
})

// 判断是否为编辑模式
const isEditMode = computed(() => !!route.params.id)

// 表单配置
const formConfigs: IFormConfig[] = [
  {
    comp: 'n-input',
    valueKey: 'name',
    label: '资源名称',
    required: true,
    rules: {
      message: '请输入资源名称',
      trigger: 'blur'
    },
    props: {
      placeholder: '请输入资源名称',
      maxlength: 50,
      showCount: true
    }
    // span: 12
  },
  {
    comp: 'n-select',
    valueKey: 'type',
    label: '资源类型',
    required: true,
    rules: {
      message: '请选择资源类型',
      trigger: 'change'
    },
    optionsKey: 'resourceTypes',
    props: {
      placeholder: '请选择资源类型'
    }
  },
  {
    comp: 'n-select',
    valueKey: 'parentId',
    label: '父级资源',
    optionsKey: 'parentResources',
    props: {
      placeholder: '请选择父级资源',
      clearable: true,
      filterable: true
    }
  },
  {
    comp: 'n-input',
    valueKey: 'path',
    label: '路径',
    required: true,
    rules: {
      message: '请输入路径',
      trigger: 'blur'
    },
    props: {
      placeholder: '请输入路径',
      maxlength: 200,
      showCount: true
    },
    innerSlots: ['suffix']
  },
  {
    comp: 'n-input',
    valueKey: 'code',
    label: '编码',
    required: true,
    rules: {
      message: '请输入资源编码',
      trigger: 'blur'
    },
    props: {
      placeholder: '请输入资源编码',
      maxlength: 50,
      showCount: true
    }
  },
  {
    comp: 'n-input',
    valueKey: 'resCode',
    label: '资源码',
    required: true,
    rules: {
      message: '请输入资源码',
      trigger: 'blur'
    },
    props: {
      placeholder: '请输入资源码（基于RBAC权限系统自动生成）',
      maxlength: 100,
      showCount: true,
      readonly: true
    }
  },
  {
    comp: 'n-input-number',
    valueKey: 'sort',
    label: '排序',
    props: {
      min: 0,
      max: 999,
      placeholder: '排序值'
    }
  },
  {
    comp: 'n-input',
    valueKey: 'description',
    label: '描述',
    props: {
      type: 'textarea',
      placeholder: '请输入资源描述',
      maxlength: 200,
      showCount: true,
      autosize: { minRows: 3, maxRows: 5 }
    }
  }
]

// 选择器选项数据
const selectOptions = reactive<Record<string, IOption[]>>({
  resourceTypes: [],
  parentResources: []
})

// 获取资源类型选项
const fetchResourceTypes = async () => {
  try {
    const [enumsData, error] = await getResourceEnums()
    if (enumsData?.data?.resourceType) {
      selectOptions.resourceTypes = enumsData.data.resourceType.map((item: any) => ({
        label: item.label,
        value: item.value
      }))
    } else {
      nMessage.error(error?.message || '获取资源类型失败')
    }
  } catch (error: any) {
    nMessage.error('获取资源类型失败: ' + error.message)
  }
}

// 获取父级资源选项
const fetchParentResources = async () => {
  try {
    const [res, error] = await getResources({})
    if (res) {
      selectOptions.parentResources = res.data
        .filter(
          (res: Resource) =>
            // 过滤掉自己和子级资源，避免循环引用
            !res.id || (isEditMode.value ? res.id !== route.params.id : true)
        )
        .map((res: Resource) => ({
          label: res.name,
          value: res.id
        }))
    } else {
      nMessage.error(error?.message || '获取父级资源列表失败')
    }
  } catch (error: any) {
    nMessage.error('获取父级资源列表失败: ' + error.message)
  }
}

// 根据ID获取资源详情
const fetchResourceDetail = async (id: string) => {
  try {
    const [response, error] = await getResourceById(id)
    if (response?.data) {
      const resource = response.data
      // 填充表单数据
      formData.id = resource.id
      formData.name = resource.name
      formData.type = resource.type
      formData.parentId = resource.parentId || ''
      formData.path = resource.path
      formData.resCode = resource.resCode || ''
      formData.sortOrder = resource.sortOrder || 0
      formData.description = resource.description || ''
    } else {
      nMessage.error(error?.message || '获取资源详情失败')
    }
  } catch (error: any) {
    nMessage.error('获取资源详情失败: ' + error.message)
  }
}

// 表单提交
const handleSubmit = async () => {
  // 表单验证
  await formRef.value?.validate()

  formLoading.value = true
  try {
    let response, error
    if (isEditMode.value) {
      // 编辑资源
      const updateParams = {
        id: route.params.id as string,
        name: formData.name,
        type: formData.type,
        parentId: formData.parentId || undefined,
        path: formData.path,
        code: formData.code,
        // resCode在服务端自动生成，不需要在更新时发送
        description: formData.description,
        isActive: true,
        sortOrder: formData.sortOrder
      }
      ;[response, error] = await updateResource(updateParams)
    } else {
      // 创建资源
      const createParams = {
        name: formData.name,
        type: formData.type,
        parentId: formData.parentId || undefined,
        path: formData.path,
        code: formData.code,
        // resCode在服务端自动生成，不需要在创建时发送
        description: formData.description,
        isActive: true,
        sortOrder: formData.sortOrder
      }
      ;[response, error] = await createResource(createParams)
    }

    if (response) {
      nMessage.success(isEditMode.value ? '资源修改成功' : '资源创建成功')
      router.push('/resource/list')
    } else {
      nMessage.error(error?.message || (isEditMode.value ? '资源修改失败' : '资源创建失败'))
    }
  } catch (error: any) {
    nMessage.error((isEditMode.value ? '资源修改失败' : '资源创建失败') + ': ' + error.message)
  } finally {
    formLoading.value = false
  }
}

// 取消操作
const handleCancel = () => {
  router.push('/resource/list')
}

// 页面加载时获取数据
onMounted(async () => {
  await Promise.all([fetchResourceTypes(), fetchParentResources()])

  if (isEditMode.value) {
    fetchResourceDetail(route.params.id as string)
  }
})
</script>

<style scoped>
:deep(.resource-form-card) {
  margin: 16px;
}

:deep(.path-hint) {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>
