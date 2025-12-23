import { createApp } from 'vue'
import App from './App.vue'
import 'uno.css' // UnoCSS 样式
import '@/assets/css/reset.css'
import '@/assets/css/global.css'
import router from '@/router'
import Pinia from '@/store'
import { useUserStore } from './store/modules/user'
// import { registerSW } from '@mono-packages/sw';

const app = createApp(App)

app.use(router).use(Pinia)

// 应用启动时检查登录状态并获取用户信息
const userStore = useUserStore()
if (userStore.checkLoginStatus()) {
  userStore.getProfile().catch(error => {
    console.error('Failed to get user profile:', error)
    // 如果获取失败，可能需要重新登录
    userStore.logout()
  })
}

app.mount('#app')

// registerSW({
//   swPath: '/sw.js',
//   onRegistered: (sw) => {
//     console.log('sw', sw);
//   },
// });

// src/main.js 或者 src/main.ts
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register(
//     import.meta.env.MODE === 'production'
//       ? '/service-worker.js'
//       : '/dev-sw.js?dev-sw',
//     { type: import.meta.env.MODE === 'production' ? 'classic' : 'module' }
//   );
// }
