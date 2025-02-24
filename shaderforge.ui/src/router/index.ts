import { createRouter, createWebHistory } from 'vue-router';
import FrontPage from '@/features/frontpage/FrontPage.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: FrontPage
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/features/auth/RegisterPage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/LoginPage.vue')
  },
  {
    path: '/forge/new',
    name: 'NewShader',
    component: () => import('@/features/forge/NewShaderPage.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard for protected routes
router.beforeEach((to, from, next) => {
  const isAuthenticated = false; // Replace with your auth check
  
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;
