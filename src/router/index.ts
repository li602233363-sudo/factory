import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'

// 路由：首屏即数字孪生大屏，预留扩展点
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router