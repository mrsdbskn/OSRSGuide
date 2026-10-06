<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useMilestoneStore, TOTAL_DIARY_TIERS, TOTAL_CA_POINTS } from '@/stores/milestoneStore';
import { usePlayerStore } from '@/stores/playerStore';
import { COMMON_SPRITES, handleImageFallback } from '@/utils/assets';
import { LayoutGrid, Rows3, Search, Sparkles } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-command-palette'): void;
}>();

const route = useRoute();
const milestoneStore = useMilestoneStore();
const playerStore = usePlayerStore();

const questPoints = computed(() => milestoneStore.completedQuestPoints);
const questProgress = computed(() => milestoneStore.questProgressPercent);
const qpNeeded = computed(() => milestoneStore.qpNeededForCape);

const diaryTiers = computed(() => milestoneStore.completedDiaryTiersCount);
const diaryProgress = computed(() => milestoneStore.diariesProgressPercent);
const diaryRemaining = computed(() => milestoneStore.remainingDiaryTiers);

const caPoints = computed(() => milestoneStore.completedCombatPoints);
const caProgress = computed(() => milestoneStore.combatProgressPercent);
const nextCATier = computed(() => milestoneStore.nextCATier);

const nextReward = computed(() => milestoneStore.nextImmediateReward);
const isCompact = computed(() => playerStore.viewDensity === 'compact');

function toggleDensity() {
  playerStore.setViewDensity(isCompact.value ? 'detailed' : 'compact');
}
</script>

<template>
  <div class="sticky top-0 z-30 w-full border-b border-white/10 bg-[#0F1015]/90 backdrop-blur-md transition-all select-none">
    <div class="max-w-7xl mx-auto px-2.5 py-2 sm:px-6 sm:py-2.5 lg:px-8">
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        
        <!-- Live Metrics Hub (Quests, Diaries, CA) in 1 Strictly Horizontal Row on All Screens -->
        <div class="grid grid-cols-3 gap-1.5 sm:gap-2.5 flex-1 min-w-0">
          
          <!-- 1. Quests Metric Pill -->
          <RouterLink
            to="/quests"
            class="group relative flex items-center gap-1.5 sm:gap-2.5 bg-osrs-surface/90 hover:bg-osrs-elevated border p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all shadow-sm min-w-0"
            :class="[
              route.path.startsWith('/quests')
                ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                : 'border-white/5 hover:border-blue-500/30'
            ]"
            :title="`${qpNeeded} Quest Points required for Quest Point Cape (Click to view Quests)`"
          >
            <div class="relative w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center">
              <img
                :src="COMMON_SPRITES.questPointCape"
                alt="Quest Point Cape"
                class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow transition-transform group-hover:scale-110"
                @error="(e) => handleImageFallback(e, 'scroll')"
              />
            </div>

            <div class="flex flex-col min-w-0 flex-1 leading-tight">
              <div class="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                <span class="text-gray-300 font-medium truncate">Quests</span>
                <span class="font-bold text-gray-200 text-[10px] sm:text-xs truncate ml-1">
                  <span class="text-osrs-gold">{{ questPoints }}</span>
                  <span class="text-gray-500 font-normal">/{{ milestoneStore.totalPossibleQuestPoints }}</span>
                </span>
              </div>
              <!-- Mini Progress Bar -->
              <div class="w-full h-1 sm:h-1.5 bg-black/60 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                  :style="{ width: `${questProgress}%` }"
                />
              </div>
            </div>

            <!-- Hover Tooltip -->
            <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-osrs-drawer text-gray-200 text-xs px-2.5 py-1 rounded shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {{ qpNeeded === 0 ? '✨ Quest Point Cape Unlocked!' : `${qpNeeded} QP needed for Quest Cape` }}
            </div>
          </RouterLink>

          <!-- 2. Diaries Metric Pill (Achievement Diary Cape) -->
          <RouterLink
            to="/diaries"
            class="group relative flex items-center gap-1.5 sm:gap-2.5 bg-osrs-surface/90 hover:bg-osrs-elevated border p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all shadow-sm min-w-0"
            :class="[
              route.path.startsWith('/diaries')
                ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'border-white/5 hover:border-emerald-500/30'
            ]"
            :title="`${diaryRemaining} Diary Tiers needed for Achievement Diary Cape (Click to view Diaries)`"
          >
            <div class="relative w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center">
              <img
                :src="COMMON_SPRITES.diariesCape"
                alt="Achievement Diary Cape"
                class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow transition-transform group-hover:scale-110"
                @error="(e) => handleImageFallback(e, 'shield')"
              />
            </div>

            <div class="flex flex-col min-w-0 flex-1 leading-tight">
              <div class="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                <span class="text-gray-300 font-medium truncate">Diaries</span>
                <span class="font-bold text-gray-200 text-[10px] sm:text-xs truncate ml-1">
                  <span class="text-emerald-400">{{ diaryTiers }}</span>
                  <span class="text-gray-500 font-normal">/{{ TOTAL_DIARY_TIERS }}</span>
                </span>
              </div>
              <div class="w-full h-1 sm:h-1.5 bg-black/60 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
                  :style="{ width: `${diaryProgress}%` }"
                />
              </div>
            </div>

            <!-- Hover Tooltip -->
            <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-osrs-drawer text-gray-200 text-xs px-2.5 py-1 rounded shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {{ diaryRemaining === 0 ? '✨ Diary Cape Unlocked!' : `${diaryRemaining} tiers remaining for Diary Cape` }}
            </div>
          </RouterLink>

          <!-- 3. Combat Achievements Metric Pill (Ghommal's Hilt 6) -->
          <RouterLink
            to="/combat-achievements"
            class="group relative flex items-center gap-1.5 sm:gap-2.5 bg-osrs-surface/90 hover:bg-osrs-elevated border p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all shadow-sm min-w-0"
            :class="[
              route.path.startsWith('/combat-achievements')
                ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                : 'border-white/5 hover:border-red-500/30'
            ]"
            :title="nextCATier ? `${nextCATier.pointsAway} pts away from ${nextCATier.tier} Sword (Click to view Combat)` : 'Grandmaster Tier Unlocked!'"
          >
            <div class="relative w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center">
              <img
                :src="COMMON_SPRITES.ghommalsHilt6"
                alt="Ghommal's Hilt 6"
                class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow transition-transform group-hover:scale-110"
                @error="(e) => handleImageFallback(e, 'sword')"
              />
            </div>

            <div class="flex flex-col min-w-0 flex-1 leading-tight">
              <div class="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                <span class="text-gray-300 font-medium truncate">Combat</span>
                <span class="font-bold text-gray-200 text-[10px] sm:text-xs truncate ml-1">
                  <span class="text-red-400">{{ caPoints }}</span>
                  <span class="text-gray-500 font-normal">/{{ TOTAL_CA_POINTS }}</span>
                </span>
              </div>
              <div class="w-full h-1 sm:h-1.5 bg-black/60 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-red-500 via-amber-500 to-osrs-gold rounded-full transition-all duration-500"
                  :style="{ width: `${caProgress}%` }"
                />
              </div>
            </div>

            <!-- Hover Tooltip -->
            <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-osrs-drawer text-gray-200 text-xs px-2.5 py-1 rounded shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {{ nextCATier ? `${nextCATier.pointsAway} pts required for ${nextCATier.tier} Sword upgrade` : '🏆 Grandmaster Achieved!' }}
            </div>
          </RouterLink>

        </div>

        <!-- Right Side Desktop Only: Next Immediate Reward, Search & Density Toggle -->
        <div class="hidden sm:flex items-center gap-2 flex-shrink-0">
          
          <!-- Next Immediate Reward Pin -->
          <div class="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-osrs-gold/10 to-transparent border border-osrs-gold/30 px-3 py-1.5 rounded-xl">
            <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center">
              <img
                v-if="nextReward.iconUrl"
                :src="nextReward.iconUrl"
                alt="Reward Icon"
                class="w-5 h-5 object-contain"
                @error="(e) => handleImageFallback(e, 'sword')"
              />
              <Sparkles v-else class="w-4 h-4 text-osrs-gold" />
            </div>
            <div class="flex flex-col leading-none">
              <span class="text-xs font-semibold text-osrs-gold tracking-wide">
                {{ nextReward.title }}
              </span>
              <span class="text-[10px] text-gray-400 mt-0.5">
                {{ nextReward.subtitle }}
              </span>
            </div>
          </div>

          <!-- Command Palette Trigger Button (Desktop) -->
          <button
            type="button"
            @click="emit('open-command-palette')"
            class="flex items-center gap-2 bg-osrs-surface hover:bg-osrs-elevated text-gray-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-medium transition-colors"
            title="Search anything (Ctrl+K)"
          >
            <Search class="w-3.5 h-3.5 text-osrs-gold" />
            <span class="hidden md:inline">Search...</span>
            <kbd class="bg-black/40 text-gray-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-white/10">
              Ctrl+K
            </kbd>
          </button>

          <!-- View Density Toggle (Desktop) -->
          <button
            type="button"
            @click="toggleDensity"
            class="flex items-center gap-1.5 bg-osrs-surface hover:bg-osrs-elevated text-gray-300 hover:text-osrs-gold px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-medium transition-colors"
            :title="isCompact ? 'Switch to Detailed View' : 'Switch to Compact View'"
          >
            <Rows3 v-if="isCompact" class="w-4 h-4" />
            <LayoutGrid v-else class="w-4 h-4" />
            <span class="hidden md:inline">{{ isCompact ? 'Compact' : 'Detailed' }}</span>
          </button>

        </div>

      </div>
    </div>
  </div>
</template>
