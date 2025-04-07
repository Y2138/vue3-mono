<script setup lang="ts">
import { usePermission } from '../../composables/usePermission';
import type { CreateRoleInput, Permission, Role } from '../../types';
import { NForm, NFormItem, NInput, NModal, NSwitch, NTransfer, useMessage } from 'naive-ui';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  role: Role | null;
}>();

const show = defineModel<boolean>('show');

const message = useMessage();
const formRef = ref();

const formModel = ref<CreateRoleInput>({
  name: '',
  description: '',
  isActive: true,
  permissionIds: [],
});

const rules = {
  name: {
    required: true,
    message: '请输入角色名称',
    trigger: 'blur',
  },
};

const { permissions, createRole, updateRole } = usePermission();

// 转换权限数据为穿梭框格式
const transferData = computed(() => 
  permissions.value.map((permission: Permission) => ({
    label: `${permission.name} (${permission.resource}:${permission.action})`,
    value: permission.id,
    disabled: false,
  }))
);

// 监听编辑的角色数据变化
watch(
  () => props.role,
  (newVal) => {
    if (newVal) {
      formModel.value = {
        name: newVal.name,
        description: newVal.description,
        isActive: true,
        permissionIds: newVal.permissions.map((p: Permission) => p.id),
      };
    } else {
      formModel.value = {
        name: '',
        description: '',
        isActive: true,
        permissionIds: [],
      };
    }
  },
);

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    if (props.role) {
      await updateRole({
        id: props.role.id,
        name: formModel.value.name,
        description: formModel.value.description,
        isActive: formModel.value.isActive,
      });
      message.success('更新成功');
    } else {
      await createRole(formModel.value);
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
    :title="role ? '编辑角色' : '新建角色'"
    preset="dialog"
    positive-text="确认"
    negative-text="取消"
    style="width: 800px"
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
      <NFormItem label="角色名称" path="name">
        <NInput v-model:value="formModel.name" placeholder="请输入角色名称" />
      </NFormItem>
      
      <NFormItem label="描述" path="description">
        <NInput
          v-model:value="formModel.description"
          type="textarea"
          placeholder="请输入角色描述"
        />
      </NFormItem>
      
      <NFormItem label="状态" path="isActive">
        <NSwitch v-model:value="formModel.isActive" />
      </NFormItem>

      <NFormItem label="权限" path="permissionIds">
        <NTransfer
          v-model:value="formModel.permissionIds"
          :options="transferData"
          virtual-scroll
        />
      </NFormItem>
    </NForm>
  </NModal>
</template> 