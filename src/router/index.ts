import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/quests',
      name: 'quests',
      component: () => import('@/views/QuestsView.vue'),
    },
    {
      path: '/diaries',
      name: 'diaries',
      component: () => import('@/views/DiariesView.vue'),
    },
    {
      path: '/combat-achievements',
      name: 'combat-achievements',
      component: () => import('@/views/CombatAchievementsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

export default router;
