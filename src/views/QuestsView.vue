<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Quest } from '@/types/osrs';
import { useMilestoneStore, TOTAL_QP_TARGET } from '@/stores/milestoneStore';
import { usePlayerStore } from '@/stores/playerStore';
import { COMMON_SPRITES, handleImageFallback } from '@/utils/assets';
import QuestDrawer from '@/components/QuestDrawer.vue';
import PrerequisiteCascadeModal from '@/components/PrerequisiteCascadeModal.vue';
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
  Video,
  Sparkles,
  ExternalLink,
  LayoutGrid,
  Rows3
} from 'lucide-vue-next';

import { usePreferencesStore, type QuestStatusFilter, type QuestSortOption } from '@/stores/preferencesStore';

const route = useRoute();
const milestoneStore = useMilestoneStore();
const playerStore = usePlayerStore();
const preferencesStore = usePreferencesStore();

// Filter & Sort State (Persisted in localStorage via preferencesStore)
const searchQuery = ref('');

const statusFilter = computed<QuestStatusFilter>({
  get: () => preferencesStore.questStatusFilter,
  set: (val) => preferencesStore.setQuestStatusFilter(val),
});

const sortBy = computed<QuestSortOption>({
  get: () => preferencesStore.questSortBy,
  set: (val) => preferencesStore.setQuestSortBy(val),
});

// Active Quest for Drawer and Cascade Modal
const selectedQuest = ref<Quest | null>(null);
const isDrawerOpen = ref(false);
const cascadeQuest = ref<Quest | null>(null);
const isCascadeOpen = ref(false);

// Highlight query param from command palette
if (route.query.highlight) {
  const target = milestoneStore.quests.find((q) => q.id === route.query.highlight);
  if (target) {
    selectedQuest.value = target;
    isDrawerOpen.value = true;
  }
}

// Eligibility Helpers
function getQuestEligibility(quest: Quest) {
  const completed = playerStore.isQuestCompleted(quest.id);

  // Missing stats
  const missingSkills: { skill: string; required: number; current: number }[] = [];
  for (const [skill, required] of Object.entries(quest.requirements.skills)) {
    const current = playerStore.skills[skill] || 1;
    if (current < required) {
      missingSkills.push({ skill, required, current });
    }
  }

  // Missing prereqs
  const missingQuests = quest.requirements.quests.filter(
    (qid) => !playerStore.completedQuests.includes(qid)
  );

  const isEligible = !completed && missingSkills.length === 0 && missingQuests.length === 0;

  return {
    completed,
    isEligible,
    missingSkills,
    missingQuests,
  };
}

const difficultyOrder: Record<string, number> = {
  Novice: 1,
  Intermediate: 2,
  Experienced: 3,
  Master: 4,
  Grandmaster: 5,
  Special: 6,
};

// Filtered & Sorted Quests
const filteredQuests = computed(() => {
  let list = [...milestoneStore.quests];

  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((item) =>
      item.name.toLowerCase().includes(q) || item.difficulty.toLowerCase().includes(q)
    );
  }

  // Status Filter
  if (statusFilter.value !== 'all') {
    list = list.filter((item) => {
      const { completed, isEligible, missingSkills, missingQuests } = getQuestEligibility(item);
      switch (statusFilter.value) {
        case 'completed':
          return completed;
        case 'uncompleted':
          return !completed;
        case 'eligible':
          return isEligible;
        case 'missing-stats':
          return !completed && missingSkills.length > 0;
        case 'missing-prereqs':
          return !completed && missingQuests.length > 0;
        case 'unreleased':
          return !!item.isUnreleased;
        default:
          return true;
      }
    });
  }

  // Sorting
  list.sort((a, b) => {
    if (sortBy.value === 'optimal') {
      return a.optimalOrder - b.optimalOrder;
    }
    if (sortBy.value === 'difficulty') {
      return (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
    }
    if (sortBy.value === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return list;
});

function handleQuestToggle(quest: Quest, e?: Event) {
  if (e) e.stopPropagation();

  const wasCompleted = playerStore.isQuestCompleted(quest.id);

  if (!wasCompleted) {
    // If quest has uncompleted prerequisites, trigger cascade modal!
    const missingPrereqs = quest.requirements.quests.filter(
      (qid) => !playerStore.completedQuests.includes(qid)
    );

    if (missingPrereqs.length > 0) {
      cascadeQuest.value = quest;
      isCascadeOpen.value = true;
      return;
    }
  }

  // Otherwise direct toggle
  playerStore.toggleQuest(quest.id, quest.difficulty === 'Grandmaster');
}

function handleCascadeConfirmAll(questIds: string[]) {
  playerStore.batchCompleteQuests(questIds);
  isCascadeOpen.value = false;
  cascadeQuest.value = null;
}

function handleCascadeConfirmSingle(questId: string) {
  const q = milestoneStore.quests.find((x) => x.id === questId);
  playerStore.toggleQuest(questId, q?.difficulty === 'Grandmaster');
  isCascadeOpen.value = false;
  cascadeQuest.value = null;
}

function openDrawer(quest: Quest) {
  selectedQuest.value = quest;
  isDrawerOpen.value = true;
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-osrs-surface p-6 rounded-2xl border border-white/10 shadow-lg">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold font-cinzel text-white flex items-center gap-3">
          <img
            :src="COMMON_SPRITES.questIcon"
            alt="Official Quests Icon"
            class="w-8 h-8 object-contain drop-shadow"
            @error="(e) => handleImageFallback(e, 'scroll')"
          />
          <span>Quest Guide & Progression</span>
        </h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-1">
          Follow the optimal quest progression path, preview prerequisites, and mark tasks complete.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="text-xs text-gray-400">Total Quest Points</div>
          <div class="text-xl font-black text-osrs-gold">
            {{ milestoneStore.completedQuestPoints }} <span class="text-xs text-gray-500 font-normal">/ {{ milestoneStore.totalPossibleQuestPoints }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & Sort Bar -->
    <div class="bg-osrs-surface/90 border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-osrs-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter quests by name..."
            class="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-osrs-gold/50"
          />
        </div>

        <!-- Sort Select & View Density Toggle -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/10 text-xs flex-1 sm:flex-initial">
            <ArrowUpDown class="w-3.5 h-3.5 text-osrs-gold" />
            <span class="text-gray-400 font-medium">Sort:</span>
            <select
              v-model="sortBy"
              class="bg-transparent text-gray-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="optimal" class="bg-osrs-surface text-gray-200">Optimal Order</option>
              <option value="difficulty" class="bg-osrs-surface text-gray-200">Difficulty</option>
              <option value="alphabetical" class="bg-osrs-surface text-gray-200">Alphabetical (A-Z)</option>
            </select>
          </div>

          <!-- View Density Button -->
          <button
            type="button"
            @click="playerStore.setViewDensity(playerStore.viewDensity === 'compact' ? 'detailed' : 'compact')"
            class="p-2 sm:px-3 sm:py-2 rounded-xl bg-black/40 border border-white/10 text-gray-300 hover:text-osrs-gold text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0"
            :title="playerStore.viewDensity === 'compact' ? 'Switch to Detailed View' : 'Switch to Compact View'"
          >
            <Rows3 v-if="playerStore.viewDensity === 'compact'" class="w-4 h-4 text-osrs-gold" />
            <LayoutGrid v-else class="w-4 h-4 text-osrs-gold" />
            <span class="hidden sm:inline">{{ playerStore.viewDensity === 'compact' ? 'Compact' : 'Detailed' }}</span>
          </button>
        </div>

      </div>

      <!-- Status Chips (Horizontal Swipe on Mobile) -->
      <div class="flex items-center gap-2 pt-1 overflow-x-auto pb-1.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        <button
          type="button"
          @click="statusFilter = 'all'"
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          :class="statusFilter === 'all' ? 'bg-osrs-gold text-black border-osrs-gold' : 'bg-osrs-elevated text-gray-400 border-white/5 hover:text-white'"
        >
          All ({{ milestoneStore.quests.length }})
        </button>

        <button
          type="button"
          @click="statusFilter = 'eligible'"
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5"
          :class="statusFilter === 'eligible' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-osrs-elevated text-emerald-400 border-white/5 hover:bg-emerald-500/10'"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Eligible to Complete</span>
        </button>

        <button
          type="button"
          @click="statusFilter = 'uncompleted'"
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          :class="statusFilter === 'uncompleted' ? 'bg-osrs-gold text-black border-osrs-gold' : 'bg-osrs-elevated text-gray-400 border-white/5 hover:text-white'"
        >
          Incomplete
        </button>

        <button
          type="button"
          @click="statusFilter = 'completed'"
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1"
          :class="statusFilter === 'completed' ? 'bg-osrs-completed text-black border-osrs-completed' : 'bg-osrs-elevated text-osrs-completed border-white/5 hover:bg-osrs-completed/10'"
        >
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>Completed</span>
        </button>

        <button
          type="button"
          @click="statusFilter = 'missing-stats'"
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1"
          :class="statusFilter === 'missing-stats' ? 'bg-red-500 text-white border-red-500' : 'bg-osrs-elevated text-red-400 border-white/5 hover:bg-red-500/10'"
        >
          <AlertCircle class="w-3.5 h-3.5" />
          <span>Missing Stats</span>
        </button>

        <button
          type="button"
          @click="statusFilter = 'missing-prereqs'"
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          :class="statusFilter === 'missing-prereqs' ? 'bg-amber-500 text-black border-amber-500' : 'bg-osrs-elevated text-amber-400 border-white/5 hover:bg-amber-500/10'"
        >
          Missing Prerequisites
        </button>

        <button
          type="button"
          @click="statusFilter = 'unreleased'"
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1"
          :class="statusFilter === 'unreleased' ? 'bg-amber-500 text-black border-amber-400 font-bold' : 'bg-osrs-elevated text-amber-300 border-white/5 hover:bg-amber-500/10'"
        >
          <span>Upcoming / Unreleased (4)</span>
        </button>
      </div>
    </div>

    <!-- Quests List (Detailed Cards or Compact Rows based on density) -->
    <div v-if="filteredQuests.length > 0" class="space-y-2.5">
      
      <!-- DETAILED CARD VIEW -->
      <div
        v-if="playerStore.viewDensity === 'detailed'"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div
          v-for="quest in filteredQuests"
          :key="quest.id"
          @click="openDrawer(quest)"
          class="group card-hover relative bg-osrs-surface rounded-2xl border p-4 sm:p-5 flex flex-col justify-between cursor-pointer transition-all"
          :class="[
            playerStore.isQuestCompleted(quest.id)
              ? 'border-osrs-completed/30 bg-osrs-completed/[0.03]'
              : 'border-white/10 hover:border-osrs-gold/40 bg-osrs-surface'
          ]"
        >
          <!-- Top row -->
          <div>
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Optimal order badge -->
                <span class="text-[10px] font-mono font-bold bg-black/40 text-gray-400 px-2 py-0.5 rounded border border-white/5">
                  #{{ quest.optimalOrder }}
                </span>

                <!-- Difficulty Badge -->
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border"
                  :class="{
                    'bg-blue-500/10 text-blue-400 border-blue-500/20': quest.difficulty === 'Novice',
                    'bg-green-500/10 text-green-400 border-green-500/20': quest.difficulty === 'Intermediate',
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': quest.difficulty === 'Experienced',
                    'bg-orange-500/10 text-orange-400 border-orange-500/20': quest.difficulty === 'Master',
                    'bg-purple-500/10 text-purple-400 border-purple-500/20': quest.difficulty === 'Grandmaster' || quest.difficulty === 'Special',
                  }"
                >
                  {{ quest.difficulty }}
                </span>

                <!-- Unreleased Badge -->
                <span
                  v-if="quest.isUnreleased"
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40"
                >
                  Unreleased
                </span>

                <!-- QP Badge -->
                <span class="text-[11px] font-semibold text-osrs-gold">
                  +{{ quest.questPoints }} QP
                </span>
              </div>

              <!-- Completion Checkbox (generous 44px touch target on mobile) -->
              <button
                type="button"
                @click="(e) => handleQuestToggle(quest, e)"
                class="p-2.5 -m-2 sm:p-1 sm:m-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-osrs-gold transition-colors z-10"
                title="Toggle Completion"
              >
                <CheckCircle2
                  v-if="playerStore.isQuestCompleted(quest.id)"
                  class="w-6 h-6 text-osrs-completed transition-transform hover:scale-110"
                />
                <Circle
                  v-else
                  class="w-6 h-6 text-gray-500 hover:text-osrs-gold transition-colors"
                />
              </button>
            </div>

            <!-- Quest Title -->
            <h3
              class="text-base font-bold text-white group-hover:text-osrs-gold transition-colors"
              :class="{ 'line-through text-gray-400': playerStore.isQuestCompleted(quest.id) }"
            >
              {{ quest.name }}
            </h3>

            <!-- Live Status & Requirements Pills -->
            <div class="mt-3 space-y-1.5 text-xs">
              <!-- Missing Stats alert -->
              <div
                v-if="!playerStore.isQuestCompleted(quest.id) && getQuestEligibility(quest).missingSkills.length > 0"
                class="flex flex-wrap items-center gap-1.5 text-[11px] text-red-400"
              >
                <span class="font-semibold">Missing:</span>
                <span
                  v-for="s in getQuestEligibility(quest).missingSkills"
                  :key="s.skill"
                  class="bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20"
                >
                  {{ s.skill }} {{ s.required }} (You: {{ s.current }})
                </span>
              </div>

              <!-- Missing Prerequisites alert -->
              <div
                v-if="!playerStore.isQuestCompleted(quest.id) && getQuestEligibility(quest).missingQuests.length > 0"
                class="text-[11px] text-amber-400 flex items-center gap-1"
              >
                <AlertCircle class="w-3 h-3 flex-shrink-0" />
                <span>{{ getQuestEligibility(quest).missingQuests.length }} prerequisite quest(s) missing</span>
              </div>

              <!-- Eligible badge -->
              <div
                v-if="getQuestEligibility(quest).isEligible"
                class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1"
              >
                <Sparkles class="w-3 h-3 text-emerald-400" />
                <span>Ready to start (All requirements met!)</span>
              </div>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <Video class="w-3.5 h-3.5 text-osrs-gold" />
              <span>{{ quest.youtubeVideoId ? 'Video Guide Available' : 'Pending' }}</span>
            </span>

            <span class="group-hover:text-osrs-gold inline-flex items-center gap-1 font-medium transition-colors">
              <span>Details</span>
              <ChevronRight class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      <!-- COMPACT ROW VIEW -->
      <div v-else class="space-y-1.5">
        <div
          v-for="quest in filteredQuests"
          :key="quest.id"
          @click="openDrawer(quest)"
          class="card-hover flex items-center justify-between p-3 rounded-xl border bg-osrs-surface/90 hover:bg-osrs-elevated cursor-pointer transition-all"
          :class="[
            playerStore.isQuestCompleted(quest.id)
              ? 'border-osrs-completed/30 bg-osrs-completed/[0.02]'
              : 'border-white/5 hover:border-white/20'
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <!-- Toggle Checkbox (generous 44px touch target on mobile) -->
            <button
              type="button"
              @click="(e) => handleQuestToggle(quest, e)"
              class="p-2.5 -m-2 sm:p-0.5 sm:m-0 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 z-10"
            >
              <CheckCircle2
                v-if="playerStore.isQuestCompleted(quest.id)"
                class="w-5 h-5 text-osrs-completed transition-transform hover:scale-110"
              />
              <Circle
                v-else
                class="w-5 h-5 text-gray-500 hover:text-osrs-gold transition-colors"
              />
            </button>

            <!-- Order Number -->
            <span class="text-xs font-mono text-gray-500 w-8 flex-shrink-0">
              #{{ quest.optimalOrder }}
            </span>

            <!-- Title -->
            <span
              class="text-xs sm:text-sm font-semibold text-gray-100 hover:text-osrs-gold truncate"
              :class="{ 'line-through text-gray-500': playerStore.isQuestCompleted(quest.id) }"
            >
              {{ quest.name }}
            </span>

            <!-- Eligibility Indicator -->
            <span
              v-if="getQuestEligibility(quest).isEligible"
              class="hidden sm:inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20"
            >
              Ready
            </span>

            <!-- Unreleased Indicator -->
            <span
              v-if="quest.isUnreleased"
              class="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.2 rounded border border-amber-500/30 uppercase"
            >
              Unreleased
            </span>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
              :class="{
                'text-blue-400 bg-blue-500/10': quest.difficulty === 'Novice',
                'text-green-400 bg-green-500/10': quest.difficulty === 'Intermediate',
                'text-yellow-400 bg-yellow-500/10': quest.difficulty === 'Experienced',
                'text-orange-400 bg-orange-500/10': quest.difficulty === 'Master',
                'text-purple-400 bg-purple-500/10': quest.difficulty === 'Grandmaster' || quest.difficulty === 'Special',
              }"
            >
              {{ quest.difficulty }}
            </span>

            <span class="text-xs font-bold text-osrs-gold w-14 text-right">
              +{{ quest.questPoints }} QP
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- Empty State -->
    <div
      v-else
      class="bg-osrs-surface p-12 text-center rounded-2xl border border-white/5 space-y-3"
    >
      <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-400">
        <Filter class="w-6 h-6" />
      </div>
      <h3 class="text-base font-bold text-white">No quests matched your filters</h3>
      <p class="text-xs text-gray-400 max-w-sm mx-auto">
        Try clearing your search query or switching your status filter to "All".
      </p>
      <button
        type="button"
        @click="statusFilter = 'all'; searchQuery = ''"
        class="px-4 py-2 rounded-xl bg-osrs-elevated hover:bg-osrs-drawer text-osrs-gold text-xs font-semibold border border-white/10"
      >
        Clear Filters
      </button>
    </div>

    <!-- Slide-over Quest Details Drawer -->
    <QuestDrawer
      :quest="selectedQuest"
      :is-open="isDrawerOpen"
      @close="isDrawerOpen = false"
      @toggle="(q) => handleQuestToggle(q)"
    />

    <!-- Prerequisite Cascade Modal -->
    <PrerequisiteCascadeModal
      :target-quest="cascadeQuest"
      :is-open="isCascadeOpen"
      @confirm-all="handleCascadeConfirmAll"
      @confirm-single="handleCascadeConfirmSingle"
      @close="isCascadeOpen = false; cascadeQuest = null"
    />
  </div>
</template>
