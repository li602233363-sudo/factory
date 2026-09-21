import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'
import './styles/main.scss'

const app = createApp(App)

// 注册 Element Plus（配置中文语言包）
app.use(ElementPlus, { locale: zhCn })

// 全局注册图标组件（如 <el-icon><Plus /></el-icon>）
for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, component)
}

app.use(router)
app.mount('#app')