/// <reference types="vite/client" />
import { MessageApiInjection } from 'naive-ui/es/message/src/MessageProvider'

// Vite 环境变量类型定义
interface ImportMetaEnv {
  readonly VITE_GRPC_ENDPOINT: string
  readonly VITE_API_URL: string
  readonly VITE_PREFER_GRPC: string
  readonly VITE_PROTO_DEBUG: string
  readonly VITE_DEV_TOOLS: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_BASE_URL: string
  readonly VITE_PROJECT_NAME: string
  readonly VITE_USE_PWA: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  // biome-ignore lint/complexity/noBannedTypes: reason
  const component: DefineComponent<{}, {}, any>
  export default component
}
