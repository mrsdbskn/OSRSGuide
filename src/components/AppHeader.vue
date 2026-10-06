<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { usePlayerStore } from '@/stores/playerStore';
import { COMMON_SPRITES, handleImageFallback } from '@/utils/assets';
import { Swords, BookOpen, Scroll, User, RefreshCw, Upload, Home } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-import'): void;
}>();

const route = useRoute();
const playerStore = usePlayerStore();

const isSynced = computed(() => !!playerStore.rsn);

async function handleQuickSync() {
  if (playerStore.rsn) {
    try {
      await playerStore.fetchProfile(playerStore.rsn);
    } catch (e) {
      // error handled in store
    }
  }
}
</script>

<template>
  <header class="w-full bg-[#12141C] border-b border-white/10 select-none">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-4">
        
        <!-- Logo and Title with Official OSRS OS Icon -->
        <RouterLink to="/" class="flex items-center gap-3 group">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 via-osrs-gold/10 to-amber-700/20 border border-osrs-gold/40 flex items-center justify-center p-1 shadow-gold-glow group-hover:scale-105 transition-transform">
            <img
              :src="COMMON_SPRITES.osrsLogo"
              alt="OSRS Logo"
              class="w-full h-full object-contain drop-shadow"
              @error="(e) => handleImageFallback(e, 'shield')"
            />
          </div>
          <div class="flex flex-col">
            <span class="text-base sm:text-lg font-black font-cinzel tracking-wider text-white group-hover:text-osrs-gold transition-colors">
              OSRS<span class="text-osrs-gold font-normal">TRACKER</span>
            </span>
            <span class="text-[10px] text-gray-400 font-medium tracking-wide -mt-1 hidden sm:block">
              Milestone & Progress Guide
            </span>
          </div>
        </RouterLink>

        <!-- Navigation Links with Official Icons -->
        <nav class="hidden md:flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
          <RouterLink
            to="/"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            :class="route.path === '/' ? 'bg-osrs-elevated text-osrs-gold shadow-sm border border-osrs-gold/30' : 'text-gray-400 hover:text-white hover:bg-white/5'"
          >
            <Home class="w-3.5 h-3.5" />
            <span>Overview</span>
          </RouterLink>

          <RouterLink
            to="/quests"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            :class="route.path.startsWith('/quests') ? 'bg-osrs-elevated text-osrs-gold shadow-sm border border-osrs-gold/30' : 'text-gray-400 hover:text-white hover:bg-white/5'"
          >
            <img :src="COMMON_SPRITES.questIcon" alt="Quests" class="w-4 h-4 object-contain" />
            <span>Quests</span>
          </RouterLink>

          <RouterLink
            to="/diaries"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            :class="route.path.startsWith('/diaries') ? 'bg-osrs-elevated text-osrs-gold shadow-sm border border-osrs-gold/30' : 'text-gray-400 hover:text-white hover:bg-white/5'"
          >
            <img :src="COMMON_SPRITES.diariesIcon" alt="Diaries" class="w-4 h-4 object-contain" />
            <span>Diaries</span>
          </RouterLink>

          <RouterLink
            to="/combat-achievements"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            :class="route.path.startsWith('/combat-achievements') ? 'bg-osrs-elevated text-osrs-gold shadow-sm border border-osrs-gold/30' : 'text-gray-400 hover:text-white hover:bg-white/5'"
          >
            <img :src="COMMON_SPRITES.combatIcon" alt="Combat Tasks" class="w-4 h-4 object-contain" />
            <span>Combat Tasks</span>
          </RouterLink>
        </nav>

        <!-- Right Side: Player Profile / Synced status -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Synced RSN Badge -->
          <div
            v-if="isSynced"
            class="flex items-center gap-2 bg-osrs-surface px-3 py-1.5 rounded-xl border border-white/10 text-xs"
          >
            <div class="w-2 h-2 rounded-full bg-osrs-completed animate-pulse" />
            <div class="flex flex-col leading-tight">
              <span class="font-bold text-gray-200 truncate max-w-[100px] sm:max-w-[130px]">
                {{ playerStore.rsn }}
              </span>
              <span class="text-[10px] text-gray-400">
                Lv {{ playerStore.combatLevel }} • Total {{ playerStore.totalLevel }}
              </span>
            </div>

            <!-- Sync Refresh -->
            <button
              type="button"
              @click="handleQuickSync"
              :disabled="playerStore.isLoadingWom"
              class="p-1 text-gray-400 hover:text-osrs-gold transition-colors ml-1"
              title="Refresh Wise Old Man profile"
            >
              <RefreshCw
                class="w-3.5 h-3.5"
                :class="{ 'animate-spin text-osrs-gold': playerStore.isLoadingWom }"
              />
            </button>
          </div>

          <RouterLink
            v-else
            to="/"
            class="flex items-center gap-1.5 bg-osrs-gold/10 hover:bg-osrs-gold/20 text-osrs-gold px-3 py-1.5 rounded-xl border border-osrs-gold/30 text-xs font-semibold transition-colors"
          >
            <User class="w-3.5 h-3.5" />
            <span>Sync Profile</span>
          </RouterLink>

          <!-- Import/Export Trigger -->
          <button
            type="button"
            @click="emit('open-import')"
            class="p-2 rounded-xl bg-osrs-surface hover:bg-osrs-elevated text-gray-300 hover:text-white border border-white/10 transition-colors"
            title="Import/Export JSON"
          >
            <Upload class="w-4 h-4 text-osrs-gold" />
          </button>
        </div>

      </div>

      <!-- Mobile Sub-Navigation -->
      <div class="flex md:hidden items-center justify-between pb-3 pt-1 border-t border-white/5 overflow-x-auto gap-2">
        <RouterLink
          to="/"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
          :class="route.path === '/' ? 'bg-osrs-elevated text-osrs-gold' : 'text-gray-400'"
        >
          <Home class="w-3 h-3" />
          <span>Home</span>
        </RouterLink>
        <RouterLink
          to="/quests"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
          :class="route.path.startsWith('/quests') ? 'bg-osrs-elevated text-osrs-gold' : 'text-gray-400'"
        >
          <Scroll class="w-3 h-3 text-blue-400" />
          <span>Quests</span>
        </RouterLink>
        <RouterLink
          to="/diaries"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
          :class="route.path.startsWith('/diaries') ? 'bg-osrs-elevated text-osrs-gold' : 'text-gray-400'"
        >
          <BookOpen class="w-3 h-3 text-emerald-400" />
          <span>Diaries</span>
        </RouterLink>
        <RouterLink
          to="/combat-achievements"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
          :class="route.path.startsWith('/combat-achievements') ? 'bg-osrs-elevated text-osrs-gold' : 'text-gray-400'"
        >
          <Swords class="w-3 h-3 text-red-400" />
          <span>Combat</span>
        </RouterLink>
      </div>

    </div>
  </header>
</template>
