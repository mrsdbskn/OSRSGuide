<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { CombatTask, CATier } from '@/types/osrs';
import { useMilestoneStore, CA_THRESHOLDS, TOTAL_CA_POINTS } from '@/stores/milestoneStore';
import { usePlayerStore } from '@/stores/playerStore';
import { getCATierSwordSprite, handleImageFallback } from '@/utils/assets';
import CombatTaskRow from '@/components/CombatTaskRow.vue';
import { Swords, Search, Filter, Layers, CheckCircle2, ShieldAlert, CheckCheck, RotateCcw } from 'lucide-vue-next';

const route = useRoute();
const milestoneStore = useMilestoneStore();
const playerStore = usePlayerStore();

// Group mode: 'tier' | 'boss'
const groupBy = ref<'tier' | 'boss'>('tier');
const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const statusFilter = ref<'all' | 'completed' | 'uncompleted'>('all');

if (route.query.search) {
  searchQuery.value = String(route.query.search);
}

const categories = ['Kill Count', 'Perfection', 'Restriction', 'Speed', 'Stamina'];

// Filtered tasks
const filteredTasks = computed(() => {
  let list = milestoneStore.combatTasks;

  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.monster.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }

  // Category
  if (selectedCategory.value !== 'all') {
    list = list.filter((t) => t.type === selectedCategory.value);
  }

  // Status
  if (statusFilter.value === 'completed') {
    list = list.filter((t) => playerStore.isCombatTaskCompleted(t.id));
  } else if (statusFilter.value === 'uncompleted') {
    list = list.filter((t) => !playerStore.isCombatTaskCompleted(t.id));
  }

  return list;
});

// Grouped by Tier
const tasksByTier = computed(() => {
  const tiers: CATier[] = ['Easy', 'Medium', 'Hard', 'Elite', 'Master', 'Grandmaster'];
  const groups: { tier: CATier; threshold: number; tasks: CombatTask[] }[] = [];

  for (const tier of tiers) {
    const thresh = CA_THRESHOLDS.find((t) => t.tier === tier)?.points || 0;
    const tasks = filteredTasks.value.filter((t) => t.tier === tier);
    if (tasks.length > 0) {
      groups.push({
        tier,
        threshold: thresh,
        tasks,
      });
    }
  }

  return groups;
});

// Grouped by Boss
const tasksByBoss = computed(() => {
  const map = new Map<string, CombatTask[]>();

  for (const task of filteredTasks.value) {
    if (!map.has(task.monster)) {
      map.set(task.monster, []);
    }
    map.get(task.monster)!.push(task);
  }

  return Array.from(map.entries())
    .map(([monster, tasks]) => ({ monster, tasks }))
    .sort((a, b) => a.monster.localeCompare(b.monster));
});

function isGroupCompleted(tasks: CombatTask[]): boolean {
  return tasks.length > 0 && tasks.every((t) => playerStore.isCombatTaskCompleted(t.id));
}

function toggleGroupTasks(tasks: CombatTask[]) {
  const allComp = isGroupCompleted(tasks);
  playerStore.batchCompleteCombatTasks(tasks.map((t) => t.id), !allComp);
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-osrs-surface p-6 rounded-2xl border border-white/10 shadow-lg">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold font-cinzel text-white flex items-center gap-3">
          <Swords class="w-8 h-8 text-red-400" />
          <span>Combat Achievements</span>
        </h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-1">
          Points-based progression system. Defeat bosses under tight restrictions to upgrade your combat hilt.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="text-xs text-gray-400">Total Combat Points</div>
          <div class="text-xl font-black text-red-400">
            {{ milestoneStore.completedCombatPoints }} <span class="text-xs text-gray-500 font-normal">/ {{ TOTAL_CA_POINTS }} pts</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tier Sword Threshold Milestones Bar -->
    <div class="bg-osrs-surface/90 border border-white/10 rounded-2xl p-5 shadow-sm space-y-3">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-gray-300">Tier Sword Thresholds</span>
        <span class="text-osrs-gold font-semibold">
          {{ milestoneStore.nextCATier ? `${milestoneStore.nextCATier.pointsAway} pts away from ${milestoneStore.nextCATier.tier}` : '🏆 All Tiers Mastered' }}
        </span>
      </div>

      <!-- Threshold Node Map -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        <div
          v-for="item in CA_THRESHOLDS"
          :key="item.tier"
          class="flex items-center gap-2.5 p-2.5 rounded-xl border transition-all"
          :class="[
            milestoneStore.completedCombatPoints >= item.points
              ? 'bg-osrs-gold/10 border-osrs-gold/40 shadow-gold-glow'
              : 'bg-black/30 border-white/5 opacity-60'
          ]"
        >
          <div class="w-7 h-7 flex-shrink-0 flex items-center justify-center">
            <img
              :src="getCATierSwordSprite(item.tier)"
              :alt="item.tier"
              class="w-6 h-6 object-contain"
              :class="{ 'grayscale opacity-40': milestoneStore.completedCombatPoints < item.points }"
              @error="(e) => handleImageFallback(e, 'sword')"
            />
          </div>

          <div class="flex flex-col min-w-0 leading-tight">
            <span class="text-xs font-bold text-gray-100 truncate">{{ item.tier }}</span>
            <span class="text-[10px] text-gray-400">{{ item.points }} pts</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter and Group Controls -->
    <div class="bg-osrs-surface/90 border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-red-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search combat tasks or bosses (e.g. Vorkath, Zulrah)..."
            class="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-400/50"
          />
        </div>

        <!-- View Group Toggle: By Tier vs By Boss -->
        <div class="flex items-center gap-2">
          <div class="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              @click="groupBy = 'tier'"
              class="px-3 py-1.5 rounded-lg font-semibold transition-all"
              :class="groupBy === 'tier' ? 'bg-osrs-elevated text-osrs-gold shadow-sm border border-osrs-gold/30' : 'text-gray-400 hover:text-white'"
            >
              Group by Tier
            </button>
            <button
              type="button"
              @click="groupBy = 'boss'"
              class="px-3 py-1.5 rounded-lg font-semibold transition-all"
              :class="groupBy === 'boss' ? 'bg-osrs-elevated text-osrs-gold shadow-sm border border-osrs-gold/30' : 'text-gray-400 hover:text-white'"
            >
              Group by Boss
            </button>
          </div>
        </div>

      </div>

      <!-- Category Filter Chips -->
      <div class="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          @click="selectedCategory = 'all'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          :class="selectedCategory === 'all' ? 'bg-osrs-gold text-black border-osrs-gold' : 'bg-osrs-elevated text-gray-400 border-white/5 hover:text-white'"
        >
          All Types
        </button>

        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          @click="selectedCategory = cat"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          :class="selectedCategory === cat ? 'bg-red-500 text-white border-red-500' : 'bg-osrs-elevated text-gray-400 border-white/5 hover:text-white'"
        >
          {{ cat }}
        </button>

        <div class="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

        <!-- Status filter -->
        <button
          type="button"
          @click="statusFilter = 'all'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          :class="statusFilter === 'all' ? 'bg-white/10 text-white border-white/20' : 'text-gray-500 hover:text-gray-300 border-transparent'"
        >
          All ({{ filteredTasks.length }})
        </button>
        <button
          type="button"
          @click="statusFilter = 'uncompleted'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          :class="statusFilter === 'uncompleted' ? 'bg-white/10 text-white border-white/20' : 'text-gray-500 hover:text-gray-300 border-transparent'"
        >
          Incomplete
        </button>
        <button
          type="button"
          @click="statusFilter = 'completed'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
          :class="statusFilter === 'completed' ? 'bg-osrs-completed text-black border-osrs-completed' : 'text-gray-500 hover:text-gray-300 border-transparent'"
        >
          Completed
        </button>
      </div>
    </div>

    <!-- Tasks Display: Grouped by Tier -->
    <div v-if="groupBy === 'tier'" class="space-y-6">
      <div
        v-for="group in tasksByTier"
        :key="group.tier"
        class="bg-osrs-surface/80 rounded-2xl border border-white/10 p-5 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between pb-3 border-b border-white/5 gap-2">
          <div class="flex items-center gap-3">
            <img
              :src="getCATierSwordSprite(group.tier)"
              :alt="group.tier"
              class="w-6 h-6 object-contain drop-shadow"
              @error="(e) => handleImageFallback(e, 'sword')"
            />
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span>{{ group.tier }} Tier</span>
              <span class="text-xs font-normal text-gray-400">({{ group.threshold }} pts threshold)</span>
            </h2>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold text-gray-400">
              {{ group.tasks.filter(t => playerStore.isCombatTaskCompleted(t.id)).length }} / {{ group.tasks.length }} Tasks
            </span>

            <!-- Complete All / Reset Tier Button -->
            <button
              type="button"
              @click="toggleGroupTasks(group.tasks)"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1"
              :class="isGroupCompleted(group.tasks) ? 'bg-osrs-completed/10 text-osrs-completed border-osrs-completed/30 hover:bg-osrs-completed/20' : 'bg-osrs-gold/10 text-osrs-gold border-osrs-gold/30 hover:bg-osrs-gold/20'"
            >
              <CheckCheck v-if="!isGroupCompleted(group.tasks)" class="w-3.5 h-3.5" />
              <RotateCcw v-else class="w-3.5 h-3.5" />
              <span>{{ isGroupCompleted(group.tasks) ? 'Reset' : 'Complete All' }}</span>
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <CombatTaskRow
            v-for="task in group.tasks"
            :key="task.id"
            :task="task"
          />
        </div>
      </div>
    </div>

    <!-- Tasks Display: Grouped by Boss -->
    <div v-else class="space-y-6">
      <div
        v-for="group in tasksByBoss"
        :key="group.monster"
        class="bg-osrs-surface/80 rounded-2xl border border-white/10 p-5 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between pb-3 border-b border-white/5 gap-2">
          <h2 class="text-base font-bold font-cinzel text-white flex items-center gap-2">
            <span>{{ group.monster }}</span>
          </h2>

          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold text-gray-400">
              {{ group.tasks.filter(t => playerStore.isCombatTaskCompleted(t.id)).length }} / {{ group.tasks.length }} Tasks
            </span>

            <!-- Complete All / Reset Boss Button -->
            <button
              type="button"
              @click="toggleGroupTasks(group.tasks)"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1"
              :class="isGroupCompleted(group.tasks) ? 'bg-osrs-completed/10 text-osrs-completed border-osrs-completed/30 hover:bg-osrs-completed/20' : 'bg-osrs-gold/10 text-osrs-gold border-osrs-gold/30 hover:bg-osrs-gold/20'"
            >
              <CheckCheck v-if="!isGroupCompleted(group.tasks)" class="w-3.5 h-3.5" />
              <RotateCcw v-else class="w-3.5 h-3.5" />
              <span>{{ isGroupCompleted(group.tasks) ? 'Reset' : 'Complete All' }}</span>
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <CombatTaskRow
            v-for="task in group.tasks"
            :key="task.id"
            :task="task"
          />
        </div>
      </div>
    </div>

  </div>
</template>
