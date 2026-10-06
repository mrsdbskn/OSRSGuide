import { defineStore } from 'pinia';
import { usePlayerStore } from './playerStore';
import type { Quest, DiaryRegion, CombatTask, DiaryTier, CATier } from '@/types/osrs';
import questsRaw from '@/data/quests.json';
import diariesRaw from '@/data/diaries.json';
import combatTasksRaw from '@/data/combatAchievements.json';
import { getCATierSwordSprite, getDiaryEquipmentSprite } from '@/utils/assets';

export const CA_THRESHOLDS: { tier: CATier; points: number }[] = [
  { tier: 'Easy', points: 33 },
  { tier: 'Medium', points: 115 },
  { tier: 'Hard', points: 304 },
  { tier: 'Elite', points: 820 },
  { tier: 'Master', points: 1465 },
  { tier: 'Grandmaster', points: 2005 },
];

export const TOTAL_QP_TARGET = 349;
export const TOTAL_DIARY_TIERS = 48;
export const TOTAL_CA_POINTS = 2005;

export const useMilestoneStore = defineStore('milestones', {
  state: () => ({
    quests: questsRaw as unknown as Quest[],
    diaries: diariesRaw as unknown as DiaryRegion[],
    combatTasks: combatTasksRaw as unknown as CombatTask[],
  }),

  getters: {
    // --- QUESTS METRICS ---
    completedQuestsList(state): Quest[] {
      const playerStore = usePlayerStore();
      return state.quests.filter((q) => playerStore.completedQuests.includes(q.id));
    },

    completedQuestPoints(): number {
      return this.completedQuestsList.reduce((sum, q) => sum + (q.questPoints || 0), 0);
    },

    totalPossibleQuestPoints(state): number {
      return state.quests.reduce((sum, q) => sum + (q.questPoints || 0), 0);
    },

    qpNeededForCape(): number {
      return Math.max(0, this.totalPossibleQuestPoints - this.completedQuestPoints);
    },

    questProgressPercent(): number {
      const total = this.totalPossibleQuestPoints || TOTAL_QP_TARGET;
      return Math.min(100, Math.round((this.completedQuestPoints / total) * 100));
    },

    // --- DIARIES METRICS ---
    completedDiaryTiersCount(state): number {
      const playerStore = usePlayerStore();
      let completedTiers = 0;

      for (const region of state.diaries) {
        for (const tier of ['Easy', 'Medium', 'Hard', 'Elite'] as DiaryTier[]) {
          const tierData = region.tiers[tier];
          if (!tierData || !tierData.tasks.length) continue;
          const allCompleted = tierData.tasks.every((t) =>
            playerStore.completedDiaryTasks.includes(t.id)
          );
          if (allCompleted) {
            completedTiers++;
          }
        }
      }

      return completedTiers;
    },

    diariesProgressPercent(): number {
      return Math.min(100, Math.round((this.completedDiaryTiersCount / TOTAL_DIARY_TIERS) * 100));
    },

    remainingDiaryTiers(): number {
      return Math.max(0, TOTAL_DIARY_TIERS - this.completedDiaryTiersCount);
    },

    latestUnlockedDiarySprite(state): string {
      const playerStore = usePlayerStore();
      // Find the highest tier completed in any region
      const tiersOrder: DiaryTier[] = ['Elite', 'Hard', 'Medium', 'Easy'];
      for (const t of tiersOrder) {
        for (const region of state.diaries) {
          const tierData = region.tiers[t];
          if (tierData?.tasks.length && tierData.tasks.every((task) => playerStore.completedDiaryTasks.includes(task.id))) {
            return getDiaryEquipmentSprite(region.id, t);
          }
        }
      }
      // default: Ardougne Cloak 1
      return getDiaryEquipmentSprite('ardougne', 'Easy');
    },

    // --- COMBAT ACHIEVEMENTS METRICS ---
    completedCombatPoints(state): number {
      const playerStore = usePlayerStore();
      return state.combatTasks
        .filter((t) => playerStore.completedCombatTasks.includes(t.id))
        .reduce((sum, t) => sum + (t.points || 0), 0);
    },

    combatProgressPercent(): number {
      return Math.min(100, Math.round((this.completedCombatPoints / TOTAL_CA_POINTS) * 100));
    },

    currentUnlockedCATier(): CATier | null {
      const points = this.completedCombatPoints;
      let unlocked: CATier | null = null;
      for (const item of CA_THRESHOLDS) {
        if (points >= item.points) {
          unlocked = item.tier;
        } else {
          break;
        }
      }
      return unlocked;
    },

    currentUnlockedSwordSprite(): string {
      const tier = this.currentUnlockedCATier || 'Easy';
      return getCATierSwordSprite(tier);
    },

    nextCATier(): { tier: CATier; points: number; pointsAway: number } | null {
      const points = this.completedCombatPoints;
      for (const item of CA_THRESHOLDS) {
        if (points < item.points) {
          return {
            tier: item.tier,
            points: item.points,
            pointsAway: item.points - points,
          };
        }
      }
      return null;
    },

    // --- IMMEDIATE REWARD PIN CALCULATOR ---
    nextImmediateReward(): { title: string; subtitle: string; iconUrl?: string } {
      const playerStore = usePlayerStore();

      // Check Combat next tier
      const nextCA = this.nextCATier;
      const caDiff = nextCA ? nextCA.pointsAway : 999999;

      // Check Recipe for Disaster (Barrows Gloves)
      const rfdCompleted = playerStore.completedQuests.includes('recipe-for-disaster');
      const rfdQuest = this.quests.find((q) => q.id === 'recipe-for-disaster');
      let rfdMissingCount = 0;
      if (!rfdCompleted && rfdQuest) {
        const missingPrereqs = rfdQuest.requirements.quests.filter(
          (qid) => !playerStore.completedQuests.includes(qid)
        );
        rfdMissingCount = missingPrereqs.length + 1; // plus Rfd itself
      }

      // Check closest diary tier
      let closestDiaryName = '';
      let closestDiaryTasksAway = 999999;
      let closestDiarySprite = '';

      for (const region of this.diaries) {
        for (const tier of ['Easy', 'Medium', 'Hard', 'Elite'] as DiaryTier[]) {
          const tierData = region.tiers[tier];
          if (!tierData || !tierData.tasks.length) continue;
          const uncompleted = tierData.tasks.filter(
            (t) => !playerStore.completedDiaryTasks.includes(t.id)
          );
          if (uncompleted.length > 0 && uncompleted.length < closestDiaryTasksAway) {
            closestDiaryTasksAway = uncompleted.length;
            closestDiaryName = `${region.name} (${tier})`;
            closestDiarySprite = getDiaryEquipmentSprite(region.id, tier);
          }
        }
      }

      // Prioritize CA if very close, otherwise Barrows Gloves or Diary
      if (nextCA && caDiff <= 25) {
        return {
          title: `Next Reward: ${nextCA.tier} Combat Hilt`,
          subtitle: `${caDiff} pts away (${nextCA.points} threshold)`,
          iconUrl: getCATierSwordSprite(nextCA.tier),
        };
      }

      if (!rfdCompleted && rfdMissingCount <= 3 && rfdMissingCount > 0) {
        return {
          title: 'Next Reward: Barrows Gloves',
          subtitle: `${rfdMissingCount} quest${rfdMissingCount > 1 ? 's' : ''} away (Recipe for Disaster)`,
          iconUrl: 'https://oldschool.runescape.wiki/images/Barrows_gloves.png',
        };
      }

      if (closestDiaryTasksAway <= 3) {
        return {
          title: `Next Reward: ${closestDiaryName}`,
          subtitle: `${closestDiaryTasksAway} task${closestDiaryTasksAway > 1 ? 's' : ''} away`,
          iconUrl: closestDiarySprite,
        };
      }

      if (nextCA) {
        return {
          title: `Next Reward: ${nextCA.tier} Combat Hilt`,
          subtitle: `${caDiff} pts away`,
          iconUrl: getCATierSwordSprite(nextCA.tier),
        };
      }

      return {
        title: 'Next Reward: Quest Point Cape',
        subtitle: `${this.qpNeededForCape} QP away`,
        iconUrl: 'https://oldschool.runescape.wiki/images/Quest_point_cape.png',
      };
    },
  },
});
