import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import '@antv/x6-vue-shape'  // ⭐ 初始化 Vue Shape 支持 (Vue 3)
import { registerAllNodes } from '@/utils/nodeRegistry'  // ⭐ 注册自定义节点
import './styles/index.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册自定义节点类型
registerAllNodes()

app.use(pinia)
app.use(ElementPlus)
app.mount('#app')
