<script setup lang="ts">
import { usePermission } from '../../composables/usePermission';
import type { CreatePermissionInput, Permission, UpdatePermissionInput } from '../../types';
import { NForm, NFormItem, NInput, NModal, NSwitch, useMessage } from 'naive-ui';
import { ref, watch } from 'vue';

const props = defineProps<{
  permission: Permission | null;
}>();

const show = defineModel<boolean>('show');

const message = useMessage();
const formRef = ref();

const formModel = ref<CreatePermissionInput | UpdatePermissionInput>({
  name: '',
  resource: '',
  action: '',
  description: ''
});

const rules = {
  name: {
    required: true,
    message: '请输入权限名称',
    trigger: 'blur',
  },
  resource: {
    required: true,
    message: '请输入资源名称',
    trigger: 'blur',
  },
  action: {
    required: true,
    message: '请输入操作名称',
    trigger: 'blur',
  },
};

const { createPermission, updatePermission } = usePermission();

// 监听编辑的权限数据变化
watch(
  () => props.permission,
  (newVal) => {
    if (newVal) {
      formModel.value = {
        name: newVal.name,
        resource: newVal.resource,
        action: newVal.action,
        description: newVal.description,
        isActive: newVal.isActive,
      };
    } else {
      formModel.value = {
        name: '',
        resource: '',
        action: '',
        description: '',
        isActive: true,
      };
    }
  },
);

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    if (props.permission) {
      await updatePermission(props.permission.id, formModel.value);
      message.success('更新成功');
    } else {
      await createPermission(formModel.value);
      message.success('创建成功');
    }
    
    show.value = false;
  } catch (error) {
    if (error instanceof Error) {
      message.error(error.message);
    }
  }
};
</script>

<template>
  <NModal
    v-model:show="show"
    :title="permission ? '编辑权限' : '新建权限'"
    preset="dialog"
    positive-text="确认"
    negative-text="取消"
    @positive-click="handleSubmit"
    @negative-click="() => show = false"
  >
    <NForm
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="left"
      label-width="80"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="权限名称" path="name">
        <NInput v-model:value="formModel.name" placeholder="请输入权限名称" />
      </NFormItem>
      
      <NFormItem label="资源" path="resource">
        <NInput v-model:value="formModel.resource" placeholder="请输入资源名称" />
      </NFormItem>
      
      <NFormItem label="操作" path="action">
        <NInput v-model:value="formModel.action" placeholder="请输入操作名称" />
      </NFormItem>
      
      <NFormItem label="描述" path="description">
        <NInput
          v-model:value="formModel.description"
          type="textarea"
          placeholder="请输入权限描述"
        />
      </NFormItem>
      
      <NFormItem label="状态" path="isActive">
        <NSwitch v-model:value="formModel.isActive" />
      </NFormItem>
    </NForm>
  </NModal>
</template> 