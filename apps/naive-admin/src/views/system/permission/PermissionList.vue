<script setup lang="tsx">
import { usePermissionManagement } from '@/hooks/usePermission';
import type { Permission } from '@/types/rbac';
import { NButton, NDataTable, NPopconfirm, NSpace, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { ref } from 'vue';
import PermissionForm from './components/PermissionForm.vue';

const message = useMessage();
const showForm = ref(false);
const editingPermission = ref<Permission | null>(null);

const {
  permissions,
  permissionsLoading,
  isLoading,
  deletePermission,
} = usePermissionManagement();

const handleEdit = (permission: Permission) => {
  editingPermission.value = permission;
  showForm.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await deletePermission(id);
    message.success('删除成功');
  } catch (error) {
    message.error('删除失败');
  }
};

const handleCreateNew = () => {
  editingPermission.value = null;
  showForm.value = true;
};

const columns: DataTableColumns<Permission> = [
  {
    title: '权限名称',
    key: 'name',
  },
  {
    title: '资源',
    key: 'resource',
  },
  {
    title: '操作',
    key: 'action',
  },
  {
    title: '描述',
    key: 'description',
  },
  {
    title: '状态',
    key: 'isActive',
    render: (row) => (row.isActive ? '启用' : '禁用'),
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) => (
      <NSpace>
        <NButton
          size="small"
          type="primary"
          onClick={() => handleEdit(row)}
        >
          编辑
        </NButton>
        <NPopconfirm
          onPositiveClick={() => handleDelete(row.id)}
        >
          {{
            default: () => '确认删除该权限？',
            trigger: () => (
              <NButton size="small" type="error">
                删除
              </NButton>
            ),
          }}
        </NPopconfirm>
      </NSpace>
    ),
  },
];
</script>

<template>
  <div>
    <div class="mb-4">
      <NButton type="primary" @click="handleCreateNew">
        新建权限
      </NButton>
    </div>

    <NDataTable
      :loading="permissionsLoading || isLoading"
      :columns="columns"
      :data="permissions"
      :pagination="{
        pageSize: 10,
      }"
    />

    <PermissionForm
      v-model:show="showForm"
      :permission="editingPermission"
    />
  </div>
</template> 