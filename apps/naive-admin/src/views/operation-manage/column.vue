<script setup lang="ts">
import { h, ref, onMounted } from 'vue'
import { NDataTable, NButton, NSpace, NImage, NPopover, useMessage, useDialog } from 'naive-ui'
import { api_getColumnList, api_editColumn, api_createColumn, api_deleteColumn, api_onlineColumn, api_offlineColumn } from '@/request/api/column'
import type { ColumnItem } from '@/types/column'
import type { DataTableColumns } from 'naive-ui/es/data-table'
import ColumnForm from './components/ColumnForm.vue'

const message = useMessage()
const dialog = useDialog()

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
                target: '_blank'
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
            return h(NSpace, {}, {
                default: () => [
                    h(NButton, {
                        size: 'small',
                        onClick: () => handleEdit(row)
                    }, { default: () => '编辑' }),
                    h(NButton, {
                        size: 'small',
                        onClick: () => handleStatusChange(row)
                    }, { default: () => row.status === 1 ? '下线' : '上线' }),
                    h(NButton, {
                        size: 'small',
                        onClick: () => handleDelete(row)
                    }, { default: () => '删除' })
                ]
            })
        }
    }
]

// 获取列表数据
const getList = async () => {
    try {
        loading.value = true
        const [res] = await api_getColumnList({
            page: pagination.value.page,
            pageSize: pagination.value.pageSize
        })
        data.value = res.data.items
        pagination.value.itemCount = res.data.pagination.totalItems
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
const handleCreate = () => {
    dialog.create({
        title: '新建专栏',
        content: () => h(ColumnForm),
        onPositiveClick: async (d) => {
            const formData = d.formData
            try {
                await api_createColumn(formData)
                message.success('创建成功')
                getList()
                return true
            } catch (error) {
                message.error('创建失败')
                return false
            }
        }
    })
}

// 编辑专栏
const handleEdit = (row: ColumnItem) => {
    dialog.create({
        title: '编辑专栏',
        content: () => h(ColumnForm, { data: row }),
        onPositiveClick: async (d) => {
            const formData = { ...d.formData, xid: row.xid }
            try {
                await api_editColumn(formData)
                message.success('编辑成功')
                getList()
                return true
            } catch (error) {
                message.error('编辑失败')
                return false
            }
        }
    })
}

// 删除专栏
const handleDelete = (row: ColumnItem) => {
    dialog.warning({
        title: '删除确认',
        content: '确定要删除该专栏吗？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                await api_deleteColumn({ xid: row.xid })
                message.success('删除成功')
                getList()
            } catch (error) {
                message.error('删除失败')
            }
        }
    })
}

// 上线/下线专栏
const handleStatusChange = (row: ColumnItem) => {
    const isOnline = row.status === 1
    dialog.warning({
        title: `${isOnline ? '下线' : '上线'}确认`,
        content: `确定要${isOnline ? '下线' : '上线'}该专栏吗？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                if (isOnline) {
                    await api_offlineColumn({ xid: row.xid })
                } else {
                    await api_onlineColumn({ xid: row.xid })
                }
                message.success('操作成功')
                getList()
            } catch (error) {
                message.error('操作失败')
            }
        }
    })
}

onMounted(() => {
    getList()
})
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <NButton type="primary" @click="handleCreate">新建专栏</NButton>
        </div>
        <NDataTable
            :loading="loading"
            :columns="columns"
            :data="data"
            :pagination="pagination"
            :row-key="(row) => row.id"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
        />
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
</style> 