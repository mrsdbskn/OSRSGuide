import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import QuestsView from '@/views/QuestsView.vue';
import DiariesView from '@/views/DiariesView.vue';
import CombatAchievementsView from '@/views/CombatAchievementsView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/quests',
      name: 'quests',
      component: QuestsView,
    },
    {
      path: '/diaries',
      name: 'diaries',
      component: DiariesView,
    },
    {
      path: '/combat-achievements',
      name: 'combat-achievements',
      component: CombatAchievementsView,
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
