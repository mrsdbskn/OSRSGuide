export type DiaryTier = 'Easy' | 'Medium' | 'Hard' | 'Elite';
export type CATier = 'Easy' | 'Medium' | 'Hard' | 'Elite' | 'Master' | 'Grandmaster';

export interface ItemRequirements {
  required: string[];
  recommended: string[];
}

export interface DiaryTask {
  id: string;
  description: string;
  skills: Record<string, number>;
  items?: ItemRequirements;
}

export interface DiaryTierData {
  tasks: DiaryTask[];
  rewardIconUrl: string; // Static sprite URL
  youtubeVideoId?: string | null;
  items?: ItemRequirements;
}

export interface DiaryRegion {
  id: string;
  name: string;
  rewardItemName: string; // e.g. "Ardougne cloak"
  tiers: {
    [key in DiaryTier]: DiaryTierData;
  };
}

export interface CombatTask {
  id: string;
  name: string;
  monster: string;
  tier: CATier;
  points: number; // 1 to 6
  tierIconUrl: string; // Sword sprite URL
  type: 'Kill Count' | 'Perfection' | 'Restriction' | 'Speed' | 'Stamina';
  description: string;
}

export interface Quest {
  id: string;
  name: string;
  difficulty: 'Novice' | 'Intermediate' | 'Experienced' | 'Master' | 'Grandmaster' | 'Special';
  questPoints: number;
  optimalOrder: number;
  members: boolean;
  requirements: { 
    skills: Record<string, number>; 
    quests: string[];
  };
  items?: ItemRequirements;
  rewards: { 
    questPoints: number; 
    experience?: Record<string, number>; 
    items?: string[];
  };
  youtubeVideoId?: string | null;
  isUnreleased?: boolean;
}

export type SkillName = 
  | 'Attack' | 'Hitpoints' | 'Mining'
  | 'Strength' | 'Agility' | 'Smithing'
  | 'Defence' | 'Herblore' | 'Fishing'
  | 'Ranged' | 'Thieving' | 'Cooking'
  | 'Prayer' | 'Crafting' | 'Firemaking'
  | 'Magic' | 'Fletching' | 'Woodcutting'
  | 'Runecraft' | 'Slayer' | 'Farming'
  | 'Construction' | 'Hunter' | 'Sailing';

export interface PlayerSkills {
  [skill: string]: number;
}

export interface PlayerProfile {
  rsn: string;
  combatLevel: number;
  totalLevel: number;
  skills: PlayerSkills;
  completedQuests: string[];
  completedDiaryTasks: string[];
  completedCombatTasks: string[];
  lastSynced?: string;
}

export type ViewDensity = 'detailed' | 'compact';
