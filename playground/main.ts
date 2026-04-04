import { createApp } from 'vue';
import { VueRenderDiagnostics } from '../src/index.ts';
import App from './App.vue';

const app = createApp(App);
app.use(VueRenderDiagnostics, {
  onLog: (log) => {
    console.table(log.metrics);
    if (log.issues.length > 0) {
      console.warn('Issues:', log.issues);
    }
  },
});
app.mount('#app');
