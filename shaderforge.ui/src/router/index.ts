import { createRouter, createWebHistory } from 'vue-router';
import FrontPage from '@/features/frontpage/FrontPage.vue';
import { useAuth } from '@/composables/useAuth';

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
  },
  {
    path: '/demo',
    name: 'Demo',
    component: () => import('@/features/demo/DemoPage.vue')
  },
  {
    path: '/scene',
    name: 'Scene',
    component: () => import('@/features/scene/ScenePage.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard for protected routes
router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useAuth();

  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated.value) {
    next('/login');
  } else {
    next();
  }
});

export default router;
