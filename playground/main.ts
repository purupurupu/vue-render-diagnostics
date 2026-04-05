import { createApp } from 'vue';
import { VueRenderDiagnostics } from '../src/index.ts';
import App from './App.vue';

const app = createApp(App);
app.use(VueRenderDiagnostics, { enabled: true, updateLogInterval: 10 });
app.mount('#app');
