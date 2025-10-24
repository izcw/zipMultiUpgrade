// src\main.js

import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)

app.use(ElementPlus)
app.mount('#app')