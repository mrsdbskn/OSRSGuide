import { defineStore } from 'pinia';
import type { ViewDensity, PlayerSkills } from '@/types/osrs';
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
  'Construction', 'Hunter'
];

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
      lastSynced: null as string | null,
    };
  },

  getters: {
    isQuestCompleted: (state) => (id: string) => state.completedQuests.includes(id),
    isDiaryTaskCompleted: (state) => (id: string) => state.completedDiaryTasks.includes(id),
    isCombatTaskCompleted: (state) => (id: string) => state.completedCombatTasks.includes(id),
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

    async fetchWomProfile(username: string) {
      if (!username.trim()) return;
      this.isLoadingWom = true;
      this.womError = null;

      try {
        const response = await fetch(`https://api.wiseoldman.net/v2/players/${encodeURIComponent(username.trim())}`, {
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
            const key = skillName.toLowerCase();
            if (snapshotSkills[key]?.level) {
              const lvl = snapshotSkills[key].level;
              this.skills[skillName] = lvl;
              calculatedTotal += lvl;
            }
          }
          this.totalLevel = calculatedTotal > 0 ? calculatedTotal : (snapshotSkills.overall?.level || this.totalLevel);
        }

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

    toggleCombatTask(taskId: string) {
      const idx = this.completedCombatTasks.indexOf(taskId);
      if (idx >= 0) {
        this.completedCombatTasks.splice(idx, 1);
      } else {
        this.completedCombatTasks.push(taskId);
      }
      this.persist();
    },

    exportData(): string {
      return JSON.stringify({
        version: 1,
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
        
        // Handle custom format or RuneLite Quest Helper format
        if (data.skills) {
          this.skills = { ...this.skills, ...data.skills };
        }
        if (Array.isArray(data.completedQuests)) {
          this.completedQuests = Array.from(new Set([...this.completedQuests, ...data.completedQuests]));
        } else if (data.quests && typeof data.quests === 'object') {
          // RuneLite quest helper format
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
