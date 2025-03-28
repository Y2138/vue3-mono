import { post } from '../axios'

interface UploadResponse {
  data: {
    url: string
  }
}

// 文件上传
export const api_uploadFile = (formData: FormData) => {
  return post<FormData, UploadResponse>('/common/common/upload', { data: formData })
} 