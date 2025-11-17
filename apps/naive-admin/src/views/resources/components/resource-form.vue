<template>
  <n-card title="{{ isEditMode ? '编辑资源' : '创建资源' }}" bordered class="resource-form-card">
    <template #header-extra>
      <n-button text @click="handleCancel">
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
    </template>

    <d-form ref="formRef" :model="formData" :rules="formRules" @submit="handleSubmit">
      <wrap-row :cols="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }">
        <!-- 资源名称 -->
        <wrap-col span="full" :gutter="[24, 24]">
          <d-form-item label="资源名称" prop="name" label-placement="top">
            <n-input v-model:value="formData.name" placeholder="请输入资源名称" :maxlength="50" show-count />
          </d-form-item>
        </wrap-col>

        <!-- 资源类型 -->
        <wrap-col span="full" :gutter="[24, 24]">
          <d-form-item label="资源类型" prop="type" label-placement="top">
            <n-select v-model:value="formData.type" placeholder="请选择资源类型" size="large" @update-value="handleTypeChange"> </n-select>
          </d-form-item>
        </wrap-col>

        <!-- 父级资源 -->
        <wrap-col span="full" :gutter="[24, 24]">
          <d-form-item label="父级资源" prop="parentId" label-placement="top">
            <n-select v-model:value="formData.parentId" placeholder="请选择父级资源" size="large"> </n-select>
          </d-form-item>
        </wrap-col>

        <!-- 路径 -->
        <wrap-col span="full" :gutter="[24, 24]">
          <d-form-item label="路径" prop="path" label-placement="top">
            <n-input v-model:value="formData.path" placeholder="请输入路径" :maxlength="200" show-count />
            <div class="path-hint">提示：路径用于路由跳转或权限控制，如 /system/resource</div>
          </d-form-item>
        </wrap-col>

        <!-- 编码 -->
        <wrap-col span="full" :gutter="[24, 24]">
          <d-form-item label="编码" prop="code" label-placement="top">
            <n-input v-model:value="formData.code" placeholder="请输入资源编码" :maxlength="50" show-count />
            <div class="path-hint">提示：编码用于权限标识，如 system:resource:view</div>
          </d-form-item>
        </wrap-col>

        <!-- 排序 -->
        <wrap-col span="full" :gutter="[24, 24]">
          <d-form-item label="排序" prop="sort" label-placement="top">
            <n-input-number v-model:value="formData.sort" :min="0" :max="999" placeholder="排序值" size="large" />
          </d-form-item>
        </wrap-col>

        <!-- 描述 -->
        <wrap-col span="full" :gutter="[24, 24]">
          <d-form-item label="描述" prop="description" label-placement="top">
            <n-input v-model:value="formData.description" type="textarea" placeholder="请输入资源描述" :maxlength="200" show-count :autosize="{ minRows: 3, maxRows: 5 }" />
          </d-form-item>
        </wrap-col>
      </wrap-row>
    </d-form>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { getResources, createResource, updateResource } from '@/request/api/resource'
import { Resource, CreateResourceRequest, UpdateResourceRequest } from '@/shared/resource'

const route = useRoute()
const router = useRouter()
const nMessage = useMessage()

// 表单引用
const formRef = ref()
// 表单加载状态
const formLoading = ref(false)
// 资源列表数据
const parentResourceList = ref<Resource[]>([])
// 表单数据
const formData = reactive({
  id: '',
  name: '',
  type: '',
  parentId: (route.query.parentId as string) || '',
  path: '',
  code: '',
  sort: 0,
  description: '',
  metadata: {} as Record<string, string>
})

// 表单验证规则
const formRules = {
  name: {
    required: true,
    message: '请输入资源名称',
    trigger: 'blur'
  },
  type: {
    required: true,
    message: '请选择资源类型',
    trigger: 'change'
  },
  path: {
    required: true,
    message: '请输入路径',
    trigger: 'blur'
  },
  code: {
    required: true,
    message: '请输入资源编码',
    trigger: 'blur'
  }
}

// 判断是否为编辑模式
const isEditMode = computed(() => !!route.params.id)

// 获取父级资源路径标签
const getParentPathLabel = (resource: Resource): string => {
  // 这里需要实现根据资源ID获取完整路径的逻辑
  // 暂时返回资源名称
  return resource.name
}

// 获取资源列表用于父级选择
const fetchParentResources = async () => {
  try {
    const [data, error] = await getResources({})
    if (data) {
      parentResourceList.value = data.filter(
        (res) =>
          // 过滤掉自己和子级资源，避免循环引用
          !res.id || (isEditMode.value ? res.id !== route.params.id : true)
      )
    } else {
      nMessage.error(error?.message || '获取资源列表失败')
    }
  } catch (error: any) {
    nMessage.error('获取资源列表失败: ' + error.message)
  }
}

// 根据ID获取资源详情
const fetchResourceDetail = async (id: string) => {
  try {
    // TODO: 实现获取资源详情API
    // const [response, error] = await getResourceById(id)
    // if (response?.code === 200 && response.data) {
    //   const resource = response.data
    //   // 填充表单数据
    //   formData.id = resource.id
    //   formData.name = resource.name
    //   formData.type = resource.type
    //   formData.parentId = resource.parentId || ''
    //   formData.path = resource.path
    //   formData.code = resource.code || ''
    //   formData.sort = resource.sortOrder || 0
    //   formData.description = resource.description || ''
    //   formData.metadata = resource.metadata || new Map()
    // } else {
    //   nMessage.error(error?.message || '获取资源详情失败')
    // }
  } catch (error: any) {
    nMessage.error('获取资源详情失败: ' + error.message)
  }
}

// 类型改变事件
const handleTypeChange = (type: string) => {
  // 根据类型自动生成默认路径或编码
  if (type === 'BUTTON') {
    // 按钮类型默认路径为父级路径
    const parentResource = parentResourceList.value.find((res) => res.id === formData.parentId)
    if (parentResource) {
      formData.path = parentResource.path || ''
    }
  }
}

// 表单提交
const handleSubmit = async () => {
  // 表单验证
  // const isValid = await formRef.value?.validate()
  // if (!isValid) return

  formLoading.value = true
  try {
    let response, error
    if (isEditMode.value) {
      // 编辑资源
      const updateParams: UpdateResourceRequest = {
        id: route.params.id as string,
        name: formData.name,
        type: formData.type as any,
        parentId: formData.parentId,
        path: formData.path,
        description: formData.description,
        metadata: formData.metadata,
        isActive: true
      }
      ;[response, error] = await updateResource(updateParams)
    } else {
      // 创建资源
      const createParams: CreateResourceRequest = {
        name: formData.name,
        type: formData.type as any,
        parentId: formData.parentId,
        path: formData.path,
        description: formData.description,
        metadata: formData.metadata
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

// 监听父ID变化
watch(
  () => route.query.parentId,
  (newVal) => {
    formData.parentId = newVal || ''
  }
)

// 页面加载时获取数据
onMounted(() => {
  fetchParentResources()
  if (isEditMode.value) {
    fetchResourceDetail(route.params.id as string)
  }
})
</script>

<style scoped>
.resource-form-card {
  max-width: 700px;
  margin: 0 auto;
}

.path-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>
