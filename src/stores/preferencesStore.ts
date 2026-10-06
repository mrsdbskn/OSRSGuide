import { defineStore } from 'pinia';

const PREF_STORAGE_KEY = 'osrs_progress_tracker_ui_preferences_v1';

export type QuestStatusFilter =
  | 'all'
  | 'eligible'
  | 'uncompleted'
  | 'completed'
  | 'missing-stats'
  | 'missing-prereqs'
  | 'unreleased';

export type QuestSortOption = 'optimal' | 'difficulty' | 'alphabetical';
export type CAGroupBy = 'tier' | 'boss';
export type CAStatusFilter = 'all' | 'completed' | 'uncompleted';

export interface PreferencesState {
  // Quests preferences
  questStatusFilter: QuestStatusFilter;
  questSortBy: QuestSortOption;

  // Diaries preferences
  diarySelectedRegion: string;
  collapsedDiaries: Record<string, boolean>; // region.id -> boolean (true = collapsed)

  // Combat Achievements preferences
  caGroupBy: CAGroupBy;
  caStatusFilter: CAStatusFilter;
  caSelectedCategory: string;
  collapsedCATiers: Record<string, boolean>; // tier -> boolean
  collapsedCABosses: Record<string, boolean>; // bossName -> boolean
}

function getDefaultPreferences(): PreferencesState {
  return {
    questStatusFilter: 'all',
    questSortBy: 'optimal',

    diarySelectedRegion: 'all',
    collapsedDiaries: {},

    caGroupBy: 'tier',
    caStatusFilter: 'all',
    caSelectedCategory: 'all',
    collapsedCATiers: {},
    collapsedCABosses: {},
  };
}

export const usePreferencesStore = defineStore('preferences', {
  state: (): PreferencesState => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(PREF_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            questStatusFilter: parsed.questStatusFilter || 'all',
            questSortBy: parsed.questSortBy || 'optimal',
            diarySelectedRegion: parsed.diarySelectedRegion || 'all',
            collapsedDiaries: parsed.collapsedDiaries || {},
            caGroupBy: parsed.caGroupBy || 'tier',
            caStatusFilter: parsed.caStatusFilter || 'all',
            caSelectedCategory: parsed.caSelectedCategory || 'all',
            collapsedCATiers: parsed.collapsedCATiers || {},
            collapsedCABosses: parsed.collapsedCABosses || {},
          };
        } catch (e) {
          console.error('Failed to parse preferences from localStorage:', e);
        }
      }
    }
    return getDefaultPreferences();
  },

  getters: {
    isDiaryCollapsed: (state) => (regionId: string) => !!state.collapsedDiaries[regionId],
    isCATierCollapsed: (state) => (tier: string) => !!state.collapsedCATiers[tier],
    isCABossCollapsed: (state) => (boss: string) => !!state.collapsedCABosses[boss],

    areAllDiariesCollapsed: (state) => (allRegionIds: string[]) => {
      if (!allRegionIds.length) return false;
      return allRegionIds.every((id) => !!state.collapsedDiaries[id]);
    },

    areAllCATiersCollapsed: (state) => (allTiers: string[]) => {
      if (!allTiers.length) return false;
      return allTiers.every((t) => !!state.collapsedCATiers[t]);
    },

    areAllCABossesCollapsed: (state) => (allBosses: string[]) => {
      if (!allBosses.length) return false;
      return allBosses.every((b) => !!state.collapsedCABosses[b]);
    },
  },

  actions: {
    persist() {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          PREF_STORAGE_KEY,
          JSON.stringify({
            questStatusFilter: this.questStatusFilter,
            questSortBy: this.questSortBy,
            diarySelectedRegion: this.diarySelectedRegion,
            collapsedDiaries: this.collapsedDiaries,
            caGroupBy: this.caGroupBy,
            caStatusFilter: this.caStatusFilter,
            caSelectedCategory: this.caSelectedCategory,
            collapsedCATiers: this.collapsedCATiers,
            collapsedCABosses: this.collapsedCABosses,
          })
        );
      }
    },

    // Quests actions
    setQuestStatusFilter(filter: QuestStatusFilter) {
      this.questStatusFilter = filter;
      this.persist();
    },

    setQuestSortBy(sort: QuestSortOption) {
      this.questSortBy = sort;
      this.persist();
    },

    // Diaries actions
    setDiarySelectedRegion(regionId: string) {
      this.diarySelectedRegion = regionId;
      this.persist();
    },

    toggleDiaryCollapsed(regionId: string) {
      this.collapsedDiaries[regionId] = !this.collapsedDiaries[regionId];
      this.persist();
    },

    collapseAllDiaries(regionIds: string[]) {
      for (const id of regionIds) {
        this.collapsedDiaries[id] = true;
      }
      this.persist();
    },

    expandAllDiaries() {
      this.collapsedDiaries = {};
      this.persist();
    },

    // Combat Achievements actions
    setCAGroupBy(groupBy: CAGroupBy) {
      this.caGroupBy = groupBy;
      this.persist();
    },

    setCAStatusFilter(status: CAStatusFilter) {
      this.caStatusFilter = status;
      this.persist();
    },

    setCASelectedCategory(category: string) {
      this.caSelectedCategory = category;
      this.persist();
    },

    toggleCATierCollapsed(tier: string) {
      this.collapsedCATiers[tier] = !this.collapsedCATiers[tier];
      this.persist();
    },

    collapseAllCATiers(tiers: string[]) {
      for (const t of tiers) {
        this.collapsedCATiers[t] = true;
      }
      this.persist();
    },

    expandAllCATiers() {
      this.collapsedCATiers = {};
      this.persist();
    },

    toggleCABossCollapsed(boss: string) {
      this.collapsedCABosses[boss] = !this.collapsedCABosses[boss];
      this.persist();
    },

    collapseAllCABosses(bosses: string[]) {
      for (const b of bosses) {
        this.collapsedCABosses[b] = true;
      }
      this.persist();
    },

    expandAllCABosses() {
      this.collapsedCABosses = {};
      this.persist();
    },
  },
});
