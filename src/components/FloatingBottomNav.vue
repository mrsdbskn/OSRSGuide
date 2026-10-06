<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { COMMON_SPRITES } from '@/utils/assets';
import { Home, Search } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-command-palette'): void;
  (e: 'open-import'): void;
}>();

const route = useRoute();

interface NavItem {
  name: string;
  to: string;
  sprite?: string;
  isHome?: boolean;
  activeColor: string;
}

const navItems: NavItem[] = [
  {
    name: 'Home',
    to: '/',
    isHome: true,
    activeColor: 'bg-osrs-gold/15 text-osrs-gold border-osrs-gold/40 shadow-gold-glow',
  },
  {
    name: 'Quests',
    to: '/quests',
    sprite: COMMON_SPRITES.questIcon,
    activeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.35)]',
  },
  {
    name: 'Diaries',
    to: '/diaries',
    sprite: COMMON_SPRITES.diariesIcon,
    activeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
  {
    name: 'Combat',
    to: '/combat-achievements',
    sprite: COMMON_SPRITES.combatIcon,
    activeColor: 'bg-red-500/15 text-red-300 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.35)]',
  },
];

function isItemActive(item: NavItem): boolean {
  if (item.to === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(item.to);
}
</script>

<template>
  <!-- Floating Bottom Capsule Pill + Floating Search Circle (Inspired by modern Google Photos / iOS capsule UI) -->
  <aside
    aria-label="Mobile Navigation"
    class="fixed bottom-5 inset-x-0 z-40 flex items-center justify-center gap-2 pointer-events-none px-3 select-none pb-[env(safe-area-inset-bottom)] md:hidden"
  >
    <!-- Main Capsule Pill -->
    <nav class="pointer-events-auto flex items-center bg-[#13151F]/90 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.7)] ring-1 ring-white/5 transition-all">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
        :class="[
          isItemActive(item)
            ? `${item.activeColor} border font-bold scale-[1.02]`
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        ]"
      >
        <Home v-if="item.isHome" class="w-4 h-4" />
        <img
          v-else-if="item.sprite"
          :src="item.sprite"
          :alt="item.name"
          class="w-4 h-4 object-contain drop-shadow"
        />
        <span class="tracking-tight">{{ item.name }}</span>
      </RouterLink>
    </nav>

    <!-- Floating Circular Search Action Button (Exact Image 1 Design) -->
    <button
      type="button"
      @click="emit('open-command-palette')"
      class="pointer-events-auto w-11 h-11 rounded-full bg-[#13151F]/90 backdrop-blur-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.7)] ring-1 ring-white/5 flex items-center justify-center text-osrs-gold hover:text-white hover:scale-105 active:scale-95 transition-all flex-shrink-0"
      title="Instant Search (Ctrl+K)"
      aria-label="Search quests, diaries, bosses"
    >
      <Search class="w-5 h-5 text-osrs-gold" />
    </button>
  </aside>
</template>
