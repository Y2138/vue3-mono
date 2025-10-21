import { createApp } from 'vue'
import App from './App.vue'
import 'uno.css' // UnoCSS 样式
import '@/assets/css/reset.css'
import '@/assets/css/global.css'
import router from '@/router'
import Pinia from '@/store'
// import { registerSW } from '@mono-packages/sw';

const app = createApp(App)

app.use(router).use(Pinia).mount('#app')

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
