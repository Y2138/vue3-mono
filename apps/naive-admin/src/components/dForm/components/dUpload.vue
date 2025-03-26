<template>
  <n-upload
    @change="handleUploadChange"
    @remove="handleRemove"
    @update:file-list="handleFileListChange"
    v-bind="mergedProps"
    v-model:file-list="fileListRef"
  >
    <n-button>上传文件</n-button>

  </n-upload>
</template>

<script lang="ts" setup>
import type { UploadFileInfo, UploadProps } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { computed, ref } from 'vue'

const defaultProps: Partial<UploadProps> = {
  listType: 'image-card',
  action: '', // 默认上传地址
  headers: {}, // 默认上传接口header
}

interface IDUpload {
  hasDragger
}

const props = defineProps<UploadProps>()

const mergedProps = computed(() => {
  return {
    ...defaultProps,
    ...props
  }
})

const message = useMessage()
const fileListRef = ref<UploadFileInfo[]>([
  {
    id: 'url-test',
    name: 'URL 测试',
    url: 'https://www.mocky.io/v2/5e4bafc63100007100d8b70f',
    status: 'finished'
  },
  {
    id: 'text-message',
    name: '你的短信',
    status: 'error'
  },
  {
    id: 'notification',
    name: '你的通知',
    status: 'finished'
  },
  {
    id: 'contact',
    name: '你的联系人信息',
    status: 'finished'
  }
])
function handleUploadChange(data: { fileList: UploadFileInfo[] }) {
  fileListRef.value = data.fileList
}
function handleRemove(data: { file: UploadFileInfo, fileList: UploadFileInfo[] }) {
  if (data.file.id === 'text-message') {
    message.info('居然没传上去，算了，删了吧')
  }
  else if (data.file.id === 'notification') {
    message.error('不行，这个有用，不许删')
    return false
  }
  else if (data.file.id === 'contact') {
    message.loading('不知道这个有没有用，等我问问服务器能不能删', {
      duration: 4000
    })
    return new Promise((resolve) => {
      setTimeout(() => {
        message.error('不行，他们也不许删这个')
        resolve(false)
      }, 4000)
    })
  }
}
function handleFileListChange() {
  message.info('是的，file-list 的值变了')
}
</script>
