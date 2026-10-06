import { defineStore } from 'pinia';
import type { ViewDensity, PlayerSkills, DiaryTier, CATier, Quest, DiaryRegion } from '@/types/osrs';
import questsRaw from '@/data/quests.json';
import diariesRaw from '@/data/diaries.json';
import { fireMilestoneConfetti } from '@/utils/confetti';

const STORAGE_KEY = 'osrs_progress_tracker_state_v1';

export const ALL_SKILLS = [
  'Attack', 'Hitpoints', 'Mining',
  'Strength', 'Agility', 'Smithing',
  'Defence', 'Herblore', 'Fishing',
  'Ranged', 'Thieving', 'Cooking',
  'Prayer', 'Crafting', 'Firemaking',
  'Magic', 'Fletching', 'Woodcutting',
  'Runecraft', 'Slayer', 'Farming',
  'Construction', 'Hunter', 'Sailing'
];

export const CLASSIC_23_SKILLS = ALL_SKILLS.filter((s) => s !== 'Sailing');

function getDefaultSkills(): PlayerSkills {
  const skills: PlayerSkills = {};
  for (const s of ALL_SKILLS) {
    skills[s] = s === 'Hitpoints' ? 10 : 1;
  }
  return skills;
}

export const usePlayerStore = defineStore('player', {
  state: () => {
    // Load from localStorage if present
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          rsn: parsed.rsn || '',
          combatLevel: parsed.combatLevel || 3,
          totalLevel: parsed.totalLevel || 32,
          skills: { ...getDefaultSkills(), ...(parsed.skills || {}) },
          completedQuests: (parsed.completedQuests || []) as string[],
          completedDiaryTasks: (parsed.completedDiaryTasks || []) as string[],
          completedCombatTasks: (parsed.completedCombatTasks || []) as string[],
          viewDensity: (parsed.viewDensity || 'detailed') as ViewDensity,
          isLoadingWom: false,
          womError: null as string | null,
          syncSource: (parsed.syncSource || null) as 'wikisync' | 'wom' | 'manual' | null,
          lastSynced: parsed.lastSynced || null as string | null,
        };
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }

    return {
      rsn: '',
      combatLevel: 3,
      totalLevel: 32,
      skills: getDefaultSkills(),
      completedQuests: [] as string[],
      completedDiaryTasks: [] as string[],
      completedCombatTasks: [] as string[],
      viewDensity: 'detailed' as ViewDensity,
      isLoadingWom: false,
      womError: null as string | null,
      syncSource: null as 'wikisync' | 'wom' | 'manual' | null,
      lastSynced: null as string | null,
    };
  },

  getters: {
    isQuestCompleted: (state) => (id: string) => state.completedQuests.includes(id),
    isDiaryTaskCompleted: (state) => (id: string) => state.completedDiaryTasks.includes(id),
    isCombatTaskCompleted: (state) => (id: string) => state.completedCombatTasks.includes(id),

    totalLevelClassic23: (state) => {
      let sum = 0;
      for (const s of CLASSIC_23_SKILLS) {
        sum += state.skills[s] || 1;
      }
      return sum;
    },
  },

  actions: {
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rsn: this.rsn,
          combatLevel: this.combatLevel,
          totalLevel: this.totalLevel,
          skills: this.skills,
          completedQuests: this.completedQuests,
          completedDiaryTasks: this.completedDiaryTasks,
          completedCombatTasks: this.completedCombatTasks,
          viewDensity: this.viewDensity,
          syncSource: this.syncSource,
          lastSynced: this.lastSynced,
        })
      );
    },

    setViewDensity(density: ViewDensity) {
      this.viewDensity = density;
      this.persist();
    },

    setSkillLevel(skill: string, level: number) {
      const clamped = Math.max(1, Math.min(99, level));
      this.skills[skill] = clamped;
      this.recalculateTotalAndCombat();
      this.persist();
    },

    recalculateTotalAndCombat() {
      let total = 0;
      for (const s of ALL_SKILLS) {
        total += this.skills[s] || 1;
      }
      this.totalLevel = total;

      const base = 0.25 * ((this.skills['Defence'] || 1) + (this.skills['Hitpoints'] || 10) + Math.floor((this.skills['Prayer'] || 1) / 2));
      const melee = 0.325 * ((this.skills['Attack'] || 1) + (this.skills['Strength'] || 1));
      const range = 0.325 * (Math.floor((this.skills['Ranged'] || 1) * 1.5));
      const mage = 0.325 * (Math.floor((this.skills['Magic'] || 1) * 1.5));
      this.combatLevel = Math.floor(base + Math.max(melee, range, mage));
    },

    async triggerWomUpdate(username: string) {
      try {
        await fetch(`https://api.wiseoldman.net/v2/players/${encodeURIComponent(username.trim())}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OSRSGuide-Progress-Tracker/1.0',
          },
        });
      } catch (_) {}
    },

    /**
     * Live sync using the official OSRS WikiSync public API
     * Automatically extracts real-time completed quests, diary tasks, combat achievements, and levels!
     */
    async fetchWikiSyncProfile(username: string) {
      const trimmed = username.trim();
      const url = `https://sync.runescape.wiki/runelite/player/${encodeURIComponent(trimmed)}/STANDARD`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'OSRSGuide-Progress-Tracker/1.0' }
      });

      if (!response.ok) {
        throw new Error(`WikiSync returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data || (!data.quests && !data.levels)) {
        throw new Error('No player data returned from WikiSync.');
      }

      this.rsn = data.username || trimmed;

      // 1. Quests (status 2 = completed)
      const completedQuestIds: string[] = [];
      const quests = questsRaw as unknown as Quest[];
      if (data.quests && typeof data.quests === 'object') {
        for (const q of quests) {
          if (data.quests[q.name] === 2) {
            completedQuestIds.push(q.id);
          }
        }
      }
      this.completedQuests = completedQuestIds;

      // 2. Achievement Diaries (all 12 regions mapped)
      const completedDiaryTaskIds: string[] = [];
      const diaries = diariesRaw as unknown as DiaryRegion[];
      if (data.achievement_diaries && typeof data.achievement_diaries === 'object') {
        for (const region of diaries) {
          let wikiRegionName = region.name;
          if (region.id === 'kourend') wikiRegionName = 'Kourend & Kebos';
          if (region.id === 'lumbridge') wikiRegionName = 'Lumbridge & Draynor';
          if (region.id === 'western') wikiRegionName = 'Western Provinces';

          const regionData = data.achievement_diaries[wikiRegionName];
          if (regionData) {
            for (const tier of ['Easy', 'Medium', 'Hard', 'Elite'] as DiaryTier[]) {
              const tierTasks = region.tiers[tier]?.tasks || [];
              const wikiTierTasks = regionData[tier]?.tasks || [];
              for (let i = 0; i < tierTasks.length; i++) {
                if (wikiTierTasks[i] === true) {
                  completedDiaryTaskIds.push(tierTasks[i].id);
                }
              }
            }
          }
        }
      }
      this.completedDiaryTasks = completedDiaryTaskIds;

      // 3. Combat Achievements
      if (Array.isArray(data.combat_achievements)) {
        this.completedCombatTasks = data.combat_achievements.map((id: number) => `ca-${id}`);
      }

      // 4. Player Levels
      if (data.levels && typeof data.levels === 'object') {
        for (const skillName of ALL_SKILLS) {
          if (data.levels[skillName] != null) {
            this.skills[skillName] = Number(data.levels[skillName]);
          }
        }
        this.recalculateTotalAndCombat();
      }

      this.syncSource = 'wikisync';
      this.lastSynced = new Date().toISOString();
      this.persist();

      return {
        source: 'wikisync' as const,
        questsCount: completedQuestIds.length,
        diariesCount: completedDiaryTaskIds.length,
        caCount: this.completedCombatTasks.length,
      };
    },

    /**
     * Primary smart sync: tries live WikiSync first for 100% full quest & diary sync;
     * gracefully falls back to Wise Old Man for stats if player hasn't turned on WikiSync in RuneLite.
     */
    async fetchProfile(username: string) {
      if (!username.trim()) return;
      this.isLoadingWom = true;
      this.womError = null;

      try {
        // Attempt WikiSync first
        try {
          const wikiRes = await this.fetchWikiSyncProfile(username);
          // Trigger WOM update in background to refresh hiscores indexing
          this.triggerWomUpdate(username).catch(() => {});
          return wikiRes;
        } catch (wikiErr) {
          console.info('WikiSync not active for player, falling back to Wise Old Man stats:', wikiErr);
        }

        // Fallback to Wise Old Man
        await this.fetchWomProfile(username);
        this.syncSource = 'wom';
        this.persist();
        return {
          source: 'wom' as const,
          questsCount: this.completedQuests.length,
          diariesCount: this.completedDiaryTasks.length,
          caCount: this.completedCombatTasks.length,
        };
      } finally {
        this.isLoadingWom = false;
      }
    },

    async fetchWomProfile(username: string) {
      if (!username.trim()) return;
      this.isLoadingWom = true;
      this.womError = null;

      try {
        const trimmed = username.trim();
        await this.triggerWomUpdate(trimmed);

        const response = await fetch(`https://api.wiseoldman.net/v2/players/${encodeURIComponent(trimmed)}`, {
          headers: {
            'User-Agent': 'OSRSGuide-Progress-Tracker/1.0',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Player "${username}" not found on Wise Old Man.`);
          }
          throw new Error(`WOM API returned status ${response.status}`);
        }

        const data = await response.json();
        this.rsn = data.displayName || data.username || username;
        this.combatLevel = data.combatLevel || this.combatLevel;

        if (data.latestSnapshot?.data?.skills) {
          const snapshotSkills = data.latestSnapshot.data.skills;
          let calculatedTotal = 0;

          for (const skillName of ALL_SKILLS) {
            let key = skillName.toLowerCase();
            if (skillName === 'Runecraft') {
              key = snapshotSkills.runecrafting ? 'runecrafting' : 'runecraft';
            }

            if (snapshotSkills[key]?.level) {
              const lvl = snapshotSkills[key].level;
              this.skills[skillName] = lvl;
              calculatedTotal += lvl;
            }
          }

          this.totalLevel = snapshotSkills.overall?.level || (calculatedTotal > 0 ? calculatedTotal : this.totalLevel);
        }

        this.syncSource = 'wom';
        this.lastSynced = new Date().toISOString();
        this.persist();
      } catch (err: any) {
        console.error('Wise Old Man API error:', err);
        this.womError = err.message || 'Failed to sync with Wise Old Man.';
        throw err;
      } finally {
        this.isLoadingWom = false;
      }
    },

    toggleQuest(questId: string, isGrandmaster = false) {
      const idx = this.completedQuests.indexOf(questId);
      if (idx >= 0) {
        this.completedQuests.splice(idx, 1);
      } else {
        this.completedQuests.push(questId);
        if (isGrandmaster) {
          fireMilestoneConfetti('Grandmaster Quest Completed!');
        }
      }
      this.persist();
    },

    batchCompleteQuests(questIds: string[]) {
      for (const id of questIds) {
        if (!this.completedQuests.includes(id)) {
          this.completedQuests.push(id);
        }
      }
      this.persist();
    },

    toggleDiaryTask(taskId: string) {
      const idx = this.completedDiaryTasks.indexOf(taskId);
      if (idx >= 0) {
        this.completedDiaryTasks.splice(idx, 1);
      } else {
        this.completedDiaryTasks.push(taskId);
      }
      this.persist();
    },

    batchCompleteDiaryTasks(taskIds: string[], complete = true) {
      if (complete) {
        for (const id of taskIds) {
          if (!this.completedDiaryTasks.includes(id)) {
            this.completedDiaryTasks.push(id);
          }
        }
        fireMilestoneConfetti('Achievement Diary Tier Completed!');
      } else {
        this.completedDiaryTasks = this.completedDiaryTasks.filter((id) => !taskIds.includes(id));
      }
      this.persist();
    },

    toggleCombatTask(taskId: string) {
      const idx = this.completedCombatTasks.indexOf(taskId);
      if (idx >= 0) {
        this.completedCombatTasks.splice(idx, 1);
      } else {
        this.completedCombatTasks.push(taskId);
      }
      this.persist();
    },

    batchCompleteCombatTasks(taskIds: string[], complete = true) {
      if (complete) {
        for (const id of taskIds) {
          if (!this.completedCombatTasks.includes(id)) {
            this.completedCombatTasks.push(id);
          }
        }
        fireMilestoneConfetti('Combat Tasks Batch Completed!');
      } else {
        this.completedCombatTasks = this.completedCombatTasks.filter((id) => !taskIds.includes(id));
      }
      this.persist();
    },

    exportData(): string {
      return JSON.stringify({
        version: 2,
        exportedAt: new Date().toISOString(),
        rsn: this.rsn,
        combatLevel: this.combatLevel,
        totalLevel: this.totalLevel,
        skills: this.skills,
        completedQuests: this.completedQuests,
        completedDiaryTasks: this.completedDiaryTasks,
        completedCombatTasks: this.completedCombatTasks,
      }, null, 2);
    },

    importData(jsonString: string): boolean {
      try {
        const data = JSON.parse(jsonString);
        
        if (data.skills) {
          this.skills = { ...this.skills, ...data.skills };
        }
        if (Array.isArray(data.completedQuests)) {
          this.completedQuests = Array.from(new Set([...this.completedQuests, ...data.completedQuests]));
        } else if (data.quests && typeof data.quests === 'object') {
          const questIds: string[] = [];
          for (const [k, v] of Object.entries(data.quests)) {
            if (v === 'FINISHED' || v === 'COMPLETED' || v === true) {
              questIds.push(k.toLowerCase().replace(/[^a-z0-9]/g, '-'));
            }
          }
          this.completedQuests = Array.from(new Set([...this.completedQuests, ...questIds]));
        }

        if (Array.isArray(data.completedDiaryTasks)) {
          this.completedDiaryTasks = Array.from(new Set([...this.completedDiaryTasks, ...data.completedDiaryTasks]));
        }

        if (Array.isArray(data.completedCombatTasks)) {
          this.completedCombatTasks = Array.from(new Set([...this.completedCombatTasks, ...data.completedCombatTasks]));
        }

        if (data.rsn) this.rsn = data.rsn;
        if (data.combatLevel) this.combatLevel = data.combatLevel;
        if (data.totalLevel) this.totalLevel = data.totalLevel;

        this.persist();
        return true;
      } catch (err) {
        console.error('Failed to import JSON data:', err);
        return false;
      }
    },

    resetAll() {
      this.rsn = '';
      this.combatLevel = 3;
      this.totalLevel = 32;
      this.skills = getDefaultSkills();
      this.completedQuests = [];
      this.completedDiaryTasks = [];
      this.completedCombatTasks = [];
      this.lastSynced = null;
      this.persist();
    }
  }
});
