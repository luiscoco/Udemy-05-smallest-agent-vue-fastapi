import { createApp } from 'vue';
import App from './App.vue';
import { makeRouter } from './router.js';
import './style.css';

createApp(App).use(makeRouter()).mount('#app');
