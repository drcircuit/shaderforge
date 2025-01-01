import { createRouter, createWebHistory } from 'vue-router';
import FrontPage from '@/features/frontpage/FrontPage.vue';

const routes = [{ path: '/', component: FrontPage }];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
