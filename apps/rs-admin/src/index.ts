import { createApp } from 'vue';
import App from './App.vue';
import '@/assets/css/reset.css';
import '@/assets/css/global.css';
import router from '@/router';
import Pinia from '@/store';
import 'uno.css';

createApp(App)
  .use(router)
  .use(Pinia)
  .mount('#root');
