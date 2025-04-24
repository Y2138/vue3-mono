<script setup lang="ts">
import { NButton, NDataTable, NPopconfirm, NSpace, NTag, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { h, ref } from 'vue';
import { usePermission } from '../composables/usePermission';
import type { Role } from '../types';
import RoleForm from './components/RoleForm.vue';

const message = useMessage();
const showForm = ref(false);
const editingRole = ref<Role | null>(null);

const {
  roles,
  isLoading,
  deleteRole,
} = usePermission();

const handleEdit = (role: Role) => {
  editingRole.value = role;
  showForm.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await deleteRole(id);
    message.success('删除成功');
  } catch (error) {
    message.error('删除失败');
  }
};

const handleCreateNew = () => {
  editingRole.value = null;
  showForm.value = true;
};

const columns: DataTableColumns<Role> = [
  {
    title: '角色名称',
    key: 'name',
  },
  {
    title: '描述',
    key: 'description',
  },
  {
    title: '权限',
    key: 'permissions',
    render(row) {
      return row.permissions.map(permission => (
        h(NTag, {
          style: {
            marginRight: '6px',
            marginBottom: '6px',
          },
          type: 'info',
          bordered: false,
        }, {
          default: () => `${permission.resource}:${permission.action}`,
        })
      ));
    },
  },
  {
    title: '状态',
    key: 'isActive',
    render: (row) => (row.isActive ? '启用' : '禁用'),
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, {
            size: 'small',
            type: 'primary',
            onClick: () => handleEdit(row),
          }, {
            default: () => '编辑',
          }),
          h(NPopconfirm, {
            onPositiveClick: () => handleDelete(row.id),
          }, {
            default: () => '确认删除该角色？',
            trigger: () => h(NButton, {
              size: 'small',
              type: 'error',
            }, {
              default: () => '删除',
            }),
          }),
        ],
      });
    },
  },
];
</script>

<template>
  <div>
    <div class="mb-4">
      <NButton type="primary" @click="handleCreateNew">
        新建角色
      </NButton>
    </div>

    <NDataTable
      :loading="isLoading"
      :columns="columns"
      :data="roles"
      :pagination="{
        pageSize: 10,
      }"
    />

    <RoleForm
      v-model:show="showForm"
      :role="editingRole"
    />
  </div>
</template> 