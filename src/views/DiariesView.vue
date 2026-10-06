<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMilestoneStore, TOTAL_DIARY_TIERS } from '@/stores/milestoneStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import DiaryCard from '@/components/DiaryCard.vue';
import { COMMON_SPRITES, handleImageFallback } from '@/utils/assets';
import { Search, Filter, ShieldCheck, Sparkles, ExternalLink, ChevronsDownUp, ChevronsUpDown } from 'lucide-vue-next';

const route = useRoute();
const milestoneStore = useMilestoneStore();
const preferencesStore = usePreferencesStore();

const searchQuery = ref('');

const selectedRegion = computed({
  get: () => preferencesStore.diarySelectedRegion,
  set: (val: string) => preferencesStore.setDiarySelectedRegion(val),
});

if (route.query.region) {
  preferencesStore.setDiarySelectedRegion(String(route.query.region));
}

const filteredDiaries = computed(() => {
  let list = milestoneStore.diaries;

  if (selectedRegion.value !== 'all') {
    list = list.filter((r) => r.id === selectedRegion.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((r) =>
      r.name.toLowerCase().includes(q) || r.rewardItemName.toLowerCase().includes(q)
    );
  }

  return list;
});

const allDiariesCollapsed = computed(() => {
  const ids = filteredDiaries.value.map((d) => d.id);
  return preferencesStore.areAllDiariesCollapsed(ids);
});

function handleToggleAllDiaries() {
  const ids = filteredDiaries.value.map((d) => d.id);
  if (allDiariesCollapsed.value) {
    preferencesStore.expandAllDiaries();
  } else {
    preferencesStore.collapseAllDiaries(ids);
  }
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-osrs-surface p-6 rounded-2xl border border-white/10 shadow-lg">
      <div class="space-y-1.5">
        <h1 class="text-2xl sm:text-3xl font-bold font-cinzel text-white flex items-center gap-3">
          <img
            :src="COMMON_SPRITES.diariesIcon"
            alt="Official Achievement Diaries"
            class="w-8 h-8 object-contain drop-shadow"
            @error="(e) => handleImageFallback(e, 'shield')"
          />
          <span>Achievement Diaries</span>
        </h1>
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-xs sm:text-sm text-gray-400">
            Complete regional tasks across Gielinor to empower your tiered equipment rewards.
          </p>
          <a
            href="https://www.youtube.com/@KaozOSRS"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-300 hover:text-white hover:border-red-500/60 transition-colors text-[11px] font-semibold"
          >
            <span>Guides by @KaozOSRS</span>
            <ExternalLink class="w-3 h-3 text-red-400" />
          </a>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="text-xs text-gray-400">Total Tiers Completed</div>
          <div class="text-xl font-black text-emerald-400">
            {{ milestoneStore.completedDiaryTiersCount }} <span class="text-xs text-gray-500 font-normal">/ {{ TOTAL_DIARY_TIERS }} Tiers</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & Region Selector -->
    <div class="bg-osrs-surface/90 border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter regions or rewards..."
          class="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <!-- Region dropdown & Collapse All Button -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/10 text-xs flex-1 sm:flex-initial">
          <Filter class="w-3.5 h-3.5 text-emerald-400" />
          <span class="text-gray-400 font-medium">Region:</span>
          <select
            v-model="selectedRegion"
            class="bg-transparent text-gray-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all" class="bg-osrs-surface text-gray-200">All 12 Regions</option>
            <option
              v-for="region in milestoneStore.diaries"
              :key="region.id"
              :value="region.id"
              class="bg-osrs-surface text-gray-200"
            >
              {{ region.name }}
            </option>
          </select>
        </div>

        <!-- Global Collapse All / Expand All Button -->
        <button
          type="button"
          @click="handleToggleAllDiaries"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-osrs-elevated border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-colors flex-shrink-0"
          :title="allDiariesCollapsed ? 'Expand All Diary Task Checklists' : 'Collapse All Diary Task Checklists'"
        >
          <ChevronsUpDown v-if="allDiariesCollapsed" class="w-4 h-4 text-emerald-400" />
          <ChevronsDownUp v-else class="w-4 h-4 text-emerald-400" />
          <span>{{ allDiariesCollapsed ? 'Expand All' : 'Collapse All' }}</span>
        </button>
      </div>
    </div>

    <!-- 12 Regional Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DiaryCard
        v-for="region in filteredDiaries"
        :key="region.id"
        :region="region"
        :is-collapsed="preferencesStore.isDiaryCollapsed(region.id)"
        @toggle-collapse="preferencesStore.toggleDiaryCollapsed(region.id)"
      />
    </div>

  </div>
</template>
