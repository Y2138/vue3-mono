import { createApp } from 'vue';
import App from './App.vue';
import '@/assets/css/reset.css';
import '@/assets/css/global.css';
import router from '@/router';
import Pinia from '@/store';
import 'virtual:uno.css'

const app = createApp(App);

app.use(router)
  .use(Pinia)
  .mount('#app');
