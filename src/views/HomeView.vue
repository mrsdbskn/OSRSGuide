<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { usePlayerStore, ALL_SKILLS } from '@/stores/playerStore';
import { useMilestoneStore, TOTAL_QP_TARGET, TOTAL_DIARY_TIERS, TOTAL_CA_POINTS } from '@/stores/milestoneStore';
import { COMMON_SPRITES, handleImageFallback } from '@/utils/assets';
import { Search, RefreshCw, Upload, Check, AlertCircle, ArrowRight, ShieldCheck, Swords, BookOpen, Scroll, Sparkles } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-import'): void;
}>();

const playerStore = usePlayerStore();
const milestoneStore = useMilestoneStore();

const searchRsn = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const showSkillEditor = ref(false);

const isSyncing = computed(() => playerStore.isLoadingWom);

async function handleSync(e?: Event) {
  if (e) e.preventDefault();
  errorMsg.value = '';
  successMsg.value = '';

  const username = searchRsn.value.trim() || playerStore.rsn;
  if (!username) {
    errorMsg.value = 'Please enter an OSRS player name.';
    return;
  }

  try {
    const res = await playerStore.fetchProfile(username);
    if (res?.source === 'wikisync') {
      successMsg.value = `✨ Live Synced via WikiSync! Loaded ${res.questsCount} quests, ${res.diariesCount} diary tasks, and ${res.caCount} combat tasks!`;
    } else {
      successMsg.value = `Synced stats for ${playerStore.rsn} via Wise Old Man. (Tip: Enable 'WikiSync' in RuneLite to auto-sync quests & diaries!)`;
    }
    searchRsn.value = '';
  } catch (err: any) {
    errorMsg.value = err.message || 'Player not found. Check spelling or try again.';
  }
}
</script>

<template>
  <div class="space-y-8 pb-16">
    <!-- Hero / Profile Sync Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-osrs-surface via-osrs-surface/90 to-osrs-base border border-white/10 p-6 sm:p-10 shadow-2xl">
      <!-- Background Ambient Glow -->
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-osrs-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div class="relative z-10 max-w-3xl mx-auto text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-osrs-gold/10 border border-osrs-gold/30 text-osrs-gold text-xs font-semibold tracking-wide uppercase">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Old School RuneScape Companion</span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black font-cinzel text-white tracking-tight">
          Track Your Journey to the <span class="text-osrs-gold">Max Cape</span>
        </h1>

        <p class="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Synchronize your verified account stats, quests, and diaries via WikiSync & Wise Old Man, check quest eligibility cascades, master all 12 regional achievement diaries, and unlock combat achievement tier swords.
        </p>

        <!-- RSN Sync Input Form -->
        <form @submit="handleSync" class="pt-2 max-w-md mx-auto">
          <div class="flex items-center bg-black/60 rounded-2xl border border-white/15 focus-within:border-osrs-gold/60 focus-within:shadow-gold-glow p-1.5 transition-all">
            <div class="pl-3 pr-2 text-gray-400">
              <Search class="w-5 h-5 text-osrs-gold" />
            </div>
            <input
              v-model="searchRsn"
              type="text"
              placeholder="Enter RuneScape Username (RSN)..."
              class="w-full bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none px-1"
            />
            <button
              type="submit"
              :disabled="isSyncing"
              class="flex items-center gap-2 bg-osrs-gold hover:bg-osrs-gold-light text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-gold-glow transition-all flex-shrink-0"
            >
              <RefreshCw v-if="isSyncing" class="w-4 h-4 animate-spin text-black" />
              <span>{{ isSyncing ? 'Syncing...' : 'Sync Account' }}</span>
            </button>
          </div>
        </form>

        <!-- Fallback Options -->
        <div class="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs text-gray-400">
          <button
            type="button"
            @click="emit('open-import')"
            class="hover:text-osrs-gold inline-flex items-center gap-1 underline underline-offset-4 transition-colors"
          >
            <Upload class="w-3.5 h-3.5" />
            <span>How to Sync with RuneLite / Import JSON</span>
          </button>
          <span>•</span>
          <button
            type="button"
            @click="showSkillEditor = !showSkillEditor"
            class="hover:text-osrs-gold inline-flex items-center gap-1 transition-colors"
          >
            <span>{{ showSkillEditor ? 'Hide Skill Editor' : 'Manually Adjust Skills' }}</span>
          </button>
        </div>

        <!-- Sync Feedback Alerts -->
        <div v-if="successMsg" class="max-w-md mx-auto p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2">
          <Check class="w-4 h-4 flex-shrink-0" />
          <span>{{ successMsg }}</span>
        </div>

        <div v-if="errorMsg" class="max-w-md mx-auto p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-center gap-2">
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Manual Skill Editor Drawer/Accordion -->
    <div v-if="showSkillEditor" class="bg-osrs-surface border border-white/10 rounded-2xl p-5 shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-sm font-bold text-white">Manual Skill Levels</h3>
          <p class="text-xs text-gray-400">Adjust levels to test quest eligibility and diary task requirements.</p>
        </div>
        <div class="text-xs text-osrs-gold font-bold flex flex-wrap items-center gap-2">
          <span>Total Level: {{ playerStore.totalLevel }}</span>
          <span v-if="playerStore.skills['Sailing'] > 1" class="text-gray-400 font-normal">
            (Classic 23: {{ playerStore.totalLevelClassic23 }} + Sailing: {{ playerStore.skills['Sailing'] }})
          </span>
          <span>| Combat: {{ playerStore.combatLevel }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
        <div
          v-for="skill in ALL_SKILLS"
          :key="skill"
          class="flex flex-col bg-black/40 border border-white/5 rounded-xl p-2"
        >
          <span class="text-[11px] font-medium text-gray-300 truncate">{{ skill }}</span>
          <input
            type="number"
            min="1"
            max="99"
            :value="playerStore.skills[skill] || 1"
            @change="(e: any) => playerStore.setSkillLevel(skill, parseInt(e.target.value) || 1)"
            class="mt-1 bg-osrs-elevated text-osrs-gold font-bold text-center rounded border border-white/10 py-1 text-sm focus:outline-none focus:border-osrs-gold"
          />
        </div>
      </div>
    </div>

    <!-- Three Gateway M3 Hub Cards -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold font-cinzel text-white">
            Progression Gateways
          </h2>
          <p class="text-xs text-gray-400">
            Interactive checklists, video guides, and live milestone metrics
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- 1. Quests Gateway Card -->
        <RouterLink
          to="/quests"
          class="group card-hover relative bg-osrs-surface rounded-2xl border border-white/10 hover:border-blue-500/50 p-6 flex flex-col justify-between shadow-m3-elevation-2 overflow-hidden"
        >
          <div class="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center p-2 shadow-sm group-hover:scale-105 transition-transform">
                <img
                  :src="COMMON_SPRITES.questIcon"
                  alt="Official Quests Icon"
                  class="w-full h-full object-contain drop-shadow"
                  @error="(e) => handleImageFallback(e, 'scroll')"
                />
              </div>
              <div class="flex items-center gap-2">
                <img
                  :src="COMMON_SPRITES.questCape"
                  alt="Quest Cape"
                  class="w-6 h-6 object-contain drop-shadow"
                  title="Quest Point Cape"
                />
                <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {{ milestoneStore.questProgressPercent }}% Complete
                </span>
              </div>
            </div>

            <h3 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <span>Quest Tracker</span>
              <ArrowRight class="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Optimal quest guide ordering, stat requirements cascade, and video guides for all major storylines.
            </p>
          </div>

          <div class="mt-6 pt-4 border-t border-white/5 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400">Quest Points</span>
              <span class="font-bold text-gray-200">
                <span class="text-blue-400">{{ milestoneStore.completedQuestPoints }}</span>
                <span class="text-gray-500 font-normal"> / {{ milestoneStore.totalPossibleQuestPoints }} QP</span>
              </span>
            </div>
            <div class="w-full h-2 bg-black/50 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
                :style="{ width: `${milestoneStore.questProgressPercent}%` }"
              />
            </div>
          </div>
        </RouterLink>

        <!-- 2. Achievement Diaries Gateway Card -->
        <RouterLink
          to="/diaries"
          class="group card-hover relative bg-osrs-surface rounded-2xl border border-white/10 hover:border-emerald-500/50 p-6 flex flex-col justify-between shadow-m3-elevation-2 overflow-hidden"
        >
          <div class="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center p-2 shadow-sm group-hover:scale-105 transition-transform">
                <img
                  :src="COMMON_SPRITES.diariesIcon"
                  alt="Achievement Diaries"
                  class="w-full h-full object-contain drop-shadow"
                  @error="(e) => handleImageFallback(e, 'shield')"
                />
              </div>
              <div class="flex items-center gap-2">
                <img
                  :src="COMMON_SPRITES.diariesCape"
                  alt="Diary Cape"
                  class="w-6 h-6 object-contain drop-shadow"
                  title="Achievement Diary Cape"
                />
                <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {{ milestoneStore.diariesProgressPercent }}% Complete
                </span>
              </div>
            </div>

            <h3 class="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <span>Achievement Diaries</span>
              <ArrowRight class="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              All 12 regions with authentic tiered equipment sprites, skill level verifications, and area guides.
            </p>
          </div>

          <div class="mt-6 pt-4 border-t border-white/5 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400">Tiers Finished</span>
              <span class="font-bold text-gray-200">
                <span class="text-emerald-400">{{ milestoneStore.completedDiaryTiersCount }}</span>
                <span class="text-gray-500 font-normal"> / {{ TOTAL_DIARY_TIERS }} Tiers</span>
              </span>
            </div>
            <div class="w-full h-2 bg-black/50 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-emerald-600 to-green-400 rounded-full transition-all duration-500"
                :style="{ width: `${milestoneStore.diariesProgressPercent}%` }"
              />
            </div>
          </div>
        </RouterLink>

        <!-- 3. Combat Achievements Gateway Card -->
        <RouterLink
          to="/combat-achievements"
          class="group card-hover relative bg-osrs-surface rounded-2xl border border-white/10 hover:border-red-500/50 p-6 flex flex-col justify-between shadow-m3-elevation-2 overflow-hidden"
        >
          <div class="absolute -top-12 -right-12 w-36 h-36 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all pointer-events-none" />

          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center p-2 shadow-sm group-hover:scale-105 transition-transform">
                <img
                  :src="COMMON_SPRITES.combatIcon"
                  alt="Combat Achievements Book"
                  class="w-full h-full object-contain drop-shadow"
                  @error="(e) => handleImageFallback(e, 'sword')"
                />
              </div>
              <div class="flex items-center gap-2">
                <img
                  :src="COMMON_SPRITES.ghommalsHilt6"
                  alt="Ghommal's Hilt 6"
                  class="w-6 h-6 object-contain drop-shadow"
                  title="Ghommal's Hilt 6 (Grandmaster)"
                />
                <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {{ milestoneStore.combatProgressPercent }}% Complete
                </span>
              </div>
            </div>

            <h3 class="text-lg font-bold text-white group-hover:text-red-400 transition-colors flex items-center gap-1.5">
              <span>Combat Tasks</span>
              <ArrowRight class="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Tier swords, points milestones, boss categorizations, and mechanical perfection challenges.
            </p>
          </div>

          <div class="mt-6 pt-4 border-t border-white/5 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400">CA Points</span>
              <span class="font-bold text-gray-200">
                <span class="text-red-400">{{ milestoneStore.completedCombatPoints }}</span>
                <span class="text-gray-500 font-normal"> / {{ TOTAL_CA_POINTS }} pts</span>
              </span>
            </div>
            <div class="w-full h-2 bg-black/50 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-red-600 via-amber-500 to-osrs-gold rounded-full transition-all duration-500"
                :style="{ width: `${milestoneStore.combatProgressPercent}%` }"
              />
            </div>
          </div>
        </RouterLink>

      </div>
    </div>
  </div>
</template>
