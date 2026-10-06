import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './style.css';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Prevent unwanted pinch-to-zoom gestures on iOS Safari / WebKit
if (typeof window !== 'undefined') {
  document.addEventListener('gesturestart', (e: Event) => {
    e.preventDefault();
  });
  document.addEventListener('gesturechange', (e: Event) => {
    e.preventDefault();
  });
  document.addEventListener('gestureend', (e: Event) => {
    e.preventDefault();
  });
}

app.mount('#app');
