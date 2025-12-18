<template>
  <n-card :title="isEditMode ? '编辑资源' : '创建资源'" bordered class="resource-form-card">
    <template #header-extra>
      <n-flex>
        <n-button type="primary" @click="handleSubmit" :loading="formLoading">
          <template #icon>
            <n-icon><Icon icon="ion:checkmark-circle" /></n-icon>
          </template>
          {{ isEditMode ? '保存修改' : '创建资源' }}
        </n-button>
      </n-flex>
    </template>

    <FormRoot ref="formRef" v-model:form-model="formData" :form-configs="formConfigs" :select-options="selectOptions" label-width="100px" @submit="handleSubmit" />
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { getResources, getResourceById, getResourceEnums, createResource, updateResource } from '@/request/api/resource'
import { CreateResourceRequest, UpdateResourceRequest } from '@/shared/resource'
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
const formData = reactive<any>({
  id: '',
  name: '',
  type: undefined,
  parentId: (route.query.parentId as string) || '',
  path: '',
  resCode: '',
  sortOrder: 0,
  description: '',
  suffix: ''
})

// 判断是否为编辑模式
const isEditMode = computed(() => !!route.query.id)

// 表单配置项 - 使用ref使其响应式，以便动态更新验证规则
const formConfigs = computed<IFormConfig[]>(() => [
  {
    comp: 'n-select',
    valueKey: 'type',
    label: '资源类型',
    required: true,
    props: {
      placeholder: '请选择资源类型',
      clearable: false
    },
    optionsKey: 'resourceTypes'
  },
  {
    comp: 'n-select',
    valueKey: 'parentId',
    label: '父级资源',
    required: formData.type === 2 || formData.type === 3,
    showRequireMark: formData.type === 2 || formData.type === 3,
    props: {
      placeholder: '请选择父级资源',
      clearable: true,
      filterable: true
    },
    optionsKey: 'parentResources'
  },
  {
    comp: 'n-input',
    valueKey: 'name',
    label: '资源名称',
    required: true,
    props: {
      placeholder: '请输入资源名称',
      maxlength: 50,
      showCount: true
    }
  },
  {
    comp: 'n-input',
    valueKey: 'path',
    label: '路径',
    required: true,
    props: {
      placeholder: '请输入路径',
      maxlength: 200,
      showCount: true
    }
  },
  {
    comp: 'text',
    visibleLinks: (data: any) => isEditMode.value,
    valueKey: 'resCode',
    label: '资源编码',
    isText: true
  },
  {
    comp: 'n-input',
    valueKey: 'suffix',
    label: '资源后缀',
    required: false,
    visibleLinks: (data: any) => !isEditMode.value && data.type === 3,
    rules: [
      {
        message: '请输入资源后缀',
        trigger: 'blur',
        validator: (rule: any, value: string) => {
          // 模块类型时必填
          if (formData.type === 3 && (!value || value.trim() === '')) {
            return new Error('资源后缀不能为空')
          }
          return true
        }
      },
      {
        message: '资源后缀格式不正确',
        trigger: 'blur',
        validator: (rule: any, value: string) => {
          if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
            return new Error('资源后缀只能包含字母、数字和下划线')
          }
          return true
        }
      }
    ],
    props: {
      placeholder: '请输入资源后缀（模块类型必填，字母、数字、下划线）',
      maxlength: 50,
      showCount: true,
      ...(isEditMode.value && { readonly: true }) // 编辑模式下不可修改
    }
  },
  // {
  //   comp: 'n-input',
  //   valueKey: 'resCode',
  //   label: '资源编码',
  //   rules: {
  //     message: '请输入资源编码',
  //     trigger: 'blur'
  //   },
  //   props: {
  //     placeholder: '请输入资源码（自动生成）',
  //     maxlength: 100,
  //     showCount: true,
  //     readonly: true
  //   }
  // },
  {
    comp: 'n-input-number',
    valueKey: 'sortOrder',
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
    showRequireMark: false,
    props: {
      type: 'textarea',
      placeholder: '请输入资源描述',
      maxlength: 200,
      showCount: true,
      autosize: { minRows: 3, maxRows: 5 }
    }
  }
])

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
            !res.id || (isEditMode.value ? res.id !== route.query.id : true)
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
      formData.suffix = (resource as any).suffix || ''
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
    if (isEditMode.value) {
      // 编辑资源
      const updateParams: UpdateResourceRequest = {
        id: route.query.id as string,
        name: formData.name || '',
        type: formData.type || 1,
        parentId: formData.parentId || undefined,
        path: formData.path || '',
        // resCode在服务端自动生成，不需要在更新时发送
        description: formData.description,
        sortOrder: formData.sortOrder || 0,
        isActive: true
      }
      const [response, error] = await updateResource(updateParams)
      console.log('updateResource response', response)
      if (error) return
      if (response && response.success) {
        nMessage.success('资源修改成功')
        router.push('/system-manage/resource')
      } else {
        nMessage.error(response?.message || '资源修改失败')
        return
      }
    } else {
      // 创建资源
      const createParams = {
        name: formData.name || '',
        type: formData.type || 1,
        parentId: formData.parentId || undefined,
        path: formData.path || '',
        // resCode在服务端自动生成，不需要在创建时发送
        description: formData.description,
        suffix: formData.suffix || undefined,
        sortOrder: formData.sortOrder || 0
      } as CreateResourceRequest
      const [response, error] = await createResource(createParams)
      if (error) return
      if (response && response.success) {
        nMessage.success('资源创建成功')
        router.push('/system-manage/resource')
      } else {
        nMessage.error(response?.message || '资源创建失败')
        return
      }
    }
  } catch (error: any) {
    nMessage.error((isEditMode.value ? '资源修改失败' : '资源创建失败') + ': ' + error.message)
  } finally {
    formLoading.value = false
  }
}

// 页面加载时获取数据
onMounted(async () => {
  await Promise.all([fetchResourceTypes(), fetchParentResources()])

  // 如果是编辑模式，获取资源详情
  if (isEditMode.value) {
    await fetchResourceDetail(route.query.id as string)
  }
})
</script>
