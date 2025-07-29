<script setup lang="ts">
import { h, ref, onMounted, computed } from 'vue'
import { NDataTable, NButton, NSpace, NImage, NPopover, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui/es/data-table'
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'
import { useGlobalStore } from '@/store/modules/global'
import { 
  api_getColumnList,
  api_createColumn,
  api_editColumn,
  api_deleteColumn,
  api_onlineColumn,
  api_offlineColumn
} from '@/request/api/column'
import type { ColumnItem } from '@/types/column'
import ColumnForm from './components/ColumnForm.vue'

defineOptions({
  name: 'ColumnManagement'
})

const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const globalStore = useGlobalStore()

// 权限检查 - 简化版
const isAdmin = computed(() => permissionStore.isAdmin)

// 统一权限检查函数
const hasPermission = (action: string) => {
  return isAdmin.value || userStore.hasPermission(`column:${action}`)
}

// 具体权限计算属性
const hasColumnPermission = computed(() => hasPermission('read'))
const hasEditPermission = computed(() => hasPermission('edit'))
const hasDeletePermission = computed(() => hasPermission('delete'))
const hasCreatePermission = computed(() => hasPermission('create'))

// 表格数据
const loading = ref(false)
const data = ref<ColumnItem[]>([])
const pagination = ref({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 20, 30, 40]
})

// 表格列定义
const columns: DataTableColumns<ColumnItem> = [
    {
        title: '序号',
        key: 'index',
        width: 80,
        render: (row: any, index: number) => {
            return (pagination.value.page - 1) * pagination.value.pageSize + index + 1
        }
    },
    {
        title: '专栏图片',
        key: 'pcBanner',
        width: 120,
        render: (row: ColumnItem) => {
            return row.pcBanner ? h(NImage, {
                width: 100,
                height: 'auto',
                src: row.pcBanner,
                previewDisabled: false
            }) : '暂无图片'
        }
    },
    {
        title: '专栏名称',
        key: 'columnName',
        minWidth: 200
    },
    {
        title: '专栏简介',
        key: 'columnIntro',
        minWidth: 200,
        render: (row: ColumnItem) => {
            return h(NPopover, {
                trigger: 'hover'
            }, {
                trigger: () => h('span', { class: 'single-ellipsis' }, row.columnIntro),
                default: () => row.columnIntro
            })
        }
    },
    {
        title: '专栏链接',
        key: 'link',
        width: 200,
        render: (row: ColumnItem) => {
            return h('a', {
                href: row.link,
                target: '_blank',
                rel: 'noopener noreferrer'
            }, row.link)
        }
    },
    {
        title: '状态',
        key: 'statusText',
        width: 100
    },
    {
        title: '创建时间',
        key: 'createdAtText',
        width: 120
    },
    {
        title: '创建人',
        key: 'creatorName',
        width: 120
    },
    {
        title: '操作',
        key: 'actions',
        width: 200,
        fixed: 'right',
        render: (row: ColumnItem) => {
            const actions = []
            
            if (hasEditPermission.value) {
                actions.push(
                    h(NButton, {
                        size: 'small',
                        onClick: () => handleEdit(row)
                    }, { default: () => '编辑' })
                )
            }
            
            if (hasEditPermission.value) {
                actions.push(
                    h(NButton, {
                        size: 'small',
                        onClick: () => handleStatusChange(row)
                    }, { default: () => row.status === 1 ? '下线' : '上线' })
                )
            }
            
            if (hasDeletePermission.value) {
                actions.push(
                    h(NButton, {
                        size: 'small',
                        type: 'error',
                        onClick: () => handleDelete(row)
                    }, { default: () => '删除' })
                )
            }
            
            return h(NSpace, {}, { default: () => actions })
        }
    }
]

// 获取列表数据
const getList = async () => {
    try {
        loading.value = true
        
        // 使用新的API客户端
        const [result, error] = await api_getColumnList({
            page: pagination.value.page,
            pageSize: pagination.value.pageSize
        })
        
        if (error) {
            console.error('获取列表失败:', error)
            message.error(error.message || '获取列表失败')
            return
        }
        
        if (result?.data) {
            data.value = result.data.items || []
            pagination.value.itemCount = result.data.pagination?.totalItems || 0
        }
    } catch (error) {
        console.error('获取列表失败:', error)
        message.error('获取列表失败')
    } finally {
        loading.value = false
    }
}

// 处理分页变化
const handlePageChange = (page: number) => {
    pagination.value.page = page
    getList()
}

const handlePageSizeChange = (pageSize: number) => {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
    getList()
}

// 新建专栏
const handleCreate = async () => {
    if (!hasCreatePermission.value) {
        message.warning('您没有创建专栏的权限')
        return
    }
    
    dialog.create({
        title: '新建专栏',
        content: () => h(ColumnForm),
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: async () => {
            // ColumnForm 组件需要暴露 getFormData 方法
            const formRef = dialog.contentComponentRef
            if (!formRef?.getFormData) {
                message.error('表单数据获取失败')
                return false
            }
            
            const formData = formRef.getFormData()
            if (!formData) {
                return false
            }
            
            try {
                const [result, error] = await api_createColumn(formData)
                
                if (error) {
                    message.error(error.message || '创建失败')
                    return false
                }
                
                message.success('创建成功')
                await getList()
                return true
            } catch (error) {
                console.error('创建专栏失败:', error)
                message.error('创建失败')
                return false
            }
        }
    })
}

// 编辑专栏
const handleEdit = async (row: ColumnItem) => {
    if (!hasEditPermission.value) {
        message.warning('您没有编辑专栏的权限')
        return
    }
    
    dialog.create({
        title: '编辑专栏',
        content: () => h(ColumnForm, { data: row }),
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: async () => {
            const formRef = dialog.contentComponentRef
            if (!formRef?.getFormData) {
                message.error('表单数据获取失败')
                return false
            }
            
            const formData = formRef.getFormData()
            if (!formData) {
                return false
            }
            
            try {
                const [result, error] = await api_editColumn({
                    ...formData,
                    xid: row.xid
                })
                
                if (error) {
                    message.error(error.message || '编辑失败')
                    return false
                }
                
                message.success('编辑成功')
                await getList()
                return true
            } catch (error) {
                console.error('编辑专栏失败:', error)
                message.error('编辑失败')
                return false
            }
        }
    })
}

// 删除专栏
const handleDelete = async (row: ColumnItem) => {
    if (!hasDeletePermission.value) {
        message.warning('您没有删除专栏的权限')
        return
    }
    
    dialog.warning({
        title: '删除确认',
        content: `确定要删除专栏"${row.columnName}"吗？此操作不可撤销。`,
        positiveText: '确定删除',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                const [result, error] = await api_deleteColumn({
                    xid: row.xid
                })
                
                if (error) {
                    message.error(error.message || '删除失败')
                    return
                }
                
                message.success('删除成功')
                await getList()
            } catch (error) {
                console.error('删除专栏失败:', error)
                message.error('删除失败')
            }
        }
    })
}

// 上线/下线专栏
const handleStatusChange = async (row: ColumnItem) => {
    if (!hasEditPermission.value) {
        message.warning('您没有修改专栏状态的权限')
        return
    }
    
    const isOnline = row.status === 1
    const action = isOnline ? '下线' : '上线'
    
    dialog.warning({
        title: `${action}确认`,
        content: `确定要${action}专栏"${row.columnName}"吗？`,
        positiveText: `确定${action}`,
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                const endpoint = isOnline ? api_offlineColumn : api_onlineColumn
                const [result, error] = await endpoint({
                    xid: row.xid
                })
                
                if (error) {
                    message.error(error.message || `${action}失败`)
                    return
                }
                
                message.success(`${action}成功`)
                await getList()
            } catch (error) {
                console.error(`${action}专栏失败:`, error)
                message.error(`${action}失败`)
            }
        }
    })
}

// 组件挂载时的初始化
onMounted(async () => {
    // 检查基本权限
    if (!hasColumnPermission.value) {
        message.error('您没有访问专栏管理的权限')
        return
    }
    
    // 检查健康状态
    if (!globalStore.isHealthy) {
        message.warning('系统健康检查异常，部分功能可能受影响')
    }
    
    // 获取初始数据
    await getList()
})
</script>

<template>
    <div class="p-4">
        <!-- 操作栏 -->
        <div class="mb-4 flex items-center justify-between">
            <div>
                <NButton 
                    v-if="hasCreatePermission" 
                    type="primary" 
                    @click="handleCreate"
                    :loading="loading"
                >
                    新建专栏
                </NButton>
                <span v-else class="text-gray-400 text-sm">您没有创建权限</span>
            </div>
            
            <!-- 系统状态指示器 -->
            <div class="flex items-center space-x-2 text-sm">
                <span class="text-gray-500">协议:</span>
                <span :class="globalStore.preferredProtocol === 'grpc' ? 'text-green-600' : 'text-blue-600'">
                    {{ globalStore.preferredProtocol?.toUpperCase() }}
                </span>
                <span :class="globalStore.isHealthy ? 'text-green-600' : 'text-red-600'">
                    {{ globalStore.isHealthy ? '健康' : '异常' }}
                </span>
            </div>
        </div>
        
        <!-- 数据表格 -->
        <NDataTable
            :loading="loading"
            :columns="columns"
            :data="data"
            :pagination="pagination"
            :row-key="(row) => row.id"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
            :scroll-x="1200"
            striped
        />
        
        <!-- 空数据提示 -->
        <div v-if="!loading && data.length === 0" class="text-center py-8 text-gray-500">
            暂无数据
        </div>
    </div>
</template>

<style scoped>
.single-ellipsis {
    display: inline-block;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 提升表格交互体验 */
:deep(.n-data-table-tbody .n-data-table-tr:hover) {
    background-color: var(--n-merged-th-color-hover);
}

/* 权限按钮样式优化 */
:deep(.n-button--error-type) {
    transition: all 0.3s ease;
}

:deep(.n-button--error-type:hover) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(208, 48, 80, 0.3);
}
</style> 