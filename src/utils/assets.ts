import type { DiaryTier, CATier } from '@/types/osrs';

// Base CDN for OSRS official wiki sprites
const WIKI_IMG_BASE = 'https://oldschool.runescape.wiki/images';

// Tier number mapping (1-4)
export const DIARY_TIER_NUMBERS: Record<DiaryTier, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
  Elite: 4,
};

// 12 Regions to item slug prefix
export const DIARY_EQUIPMENT_MAP: Record<string, { name: string; prefix: string }> = {
  ardougne: { name: 'Ardougne cloak', prefix: 'Ardougne_cloak' },
  desert: { name: 'Desert amulet', prefix: 'Desert_amulet' },
  falador: { name: 'Falador shield', prefix: 'Falador_shield' },
  fremennik: { name: 'Fremennik sea boots', prefix: 'Fremennik_sea_boots' },
  kandarin: { name: 'Kandarin headgear', prefix: 'Kandarin_headgear' },
  karamja: { name: 'Karamja gloves', prefix: 'Karamja_gloves' },
  kourend: { name: "Rada's blessing", prefix: "Rada%27s_blessing" },
  lumbridge: { name: "Explorer's ring", prefix: "Explorer%27s_ring" },
  morytania: { name: 'Morytania legs', prefix: 'Morytania_legs' },
  varrock: { name: 'Varrock armour', prefix: 'Varrock_armour' },
  western: { name: 'Western banner', prefix: 'Western_banner' },
  wilderness: { name: 'Wilderness sword', prefix: 'Wilderness_sword' },
};

// Combat Achievement Sword icons
export const CA_SWORD_SPRITES: Record<CATier, string> = {
  Easy: `${WIKI_IMG_BASE}/Combat_Achievements_-_easy_tier_icon.png`,
  Medium: `${WIKI_IMG_BASE}/Combat_Achievements_-_medium_tier_icon.png`,
  Hard: `${WIKI_IMG_BASE}/Combat_Achievements_-_hard_tier_icon.png`,
  Elite: `${WIKI_IMG_BASE}/Combat_Achievements_-_elite_tier_icon.png`,
  Master: `${WIKI_IMG_BASE}/Combat_Achievements_-_master_tier_icon.png`,
  Grandmaster: `${WIKI_IMG_BASE}/Combat_Achievements_-_grandmaster_tier_icon.png`,
};

// Combat Achievement Hilts
export const CA_HILT_SPRITES: Record<CATier, string> = {
  Easy: `${WIKI_IMG_BASE}/Ghommal%27s_hilt_1.png`,
  Medium: `${WIKI_IMG_BASE}/Ghommal%27s_hilt_2.png`,
  Hard: `${WIKI_IMG_BASE}/Ghommal%27s_hilt_3.png`,
  Elite: `${WIKI_IMG_BASE}/Ghommal%27s_hilt_4.png`,
  Master: `${WIKI_IMG_BASE}/Ghommal%27s_hilt_5.png`,
  Grandmaster: `${WIKI_IMG_BASE}/Ghommal%27s_hilt_6.png`,
};

// Common Icons
export const COMMON_SPRITES = {
  osrsLogo: `${WIKI_IMG_BASE}/Old_School_RuneScape_Mobile_icon.png`,
  questIcon: `${WIKI_IMG_BASE}/Quests.png`,
  questCape: `${WIKI_IMG_BASE}/Quest_point_cape.png`,
  questPointCape: `${WIKI_IMG_BASE}/Quest_point_cape.png`,
  diariesIcon: `${WIKI_IMG_BASE}/Achievement_Diaries.png`,
  diariesCape: `${WIKI_IMG_BASE}/Achievement_diary_cape.png`,
  diaryCape: `${WIKI_IMG_BASE}/Achievement_diary_cape.png`,
  combatIcon: `${WIKI_IMG_BASE}/Combat_achievements_detail.png`,
  ghommalsHilt6: `${WIKI_IMG_BASE}/Ghommal%27s_hilt_6.png`,
  questScroll: `${WIKI_IMG_BASE}/Quests.png`,
  barrowsGloves: `${WIKI_IMG_BASE}/Barrows_gloves.png`,
  coins: `${WIKI_IMG_BASE}/Coins_10000.png`,
};

/**
 * Returns authentic tiered equipment sprite URL for a diary region and tier
 */
export function getDiaryEquipmentSprite(regionId: string, tier: DiaryTier): string {
  const normId = regionId.toLowerCase().replace(/[^a-z]/g, '');
  let matchKey = 'falador';
  for (const key of Object.keys(DIARY_EQUIPMENT_MAP)) {
    if (normId.includes(key)) {
      matchKey = key;
      break;
    }
  }
  const prefix = DIARY_EQUIPMENT_MAP[matchKey]?.prefix || 'Falador_shield';
  const tierNum = DIARY_TIER_NUMBERS[tier] || 1;
  return `${WIKI_IMG_BASE}/${prefix}_${tierNum}.png`;
}

/**
 * Returns authentic CA Sword sprite URL for a given tier
 */
export function getCATierSwordSprite(tier: CATier): string {
  return CA_SWORD_SPRITES[tier] || CA_SWORD_SPRITES.Easy;
}

/**
 * Returns Ghommal's hilt sprite for tier
 */
export function getGhommalHiltSprite(tier: CATier): string {
  return CA_HILT_SPRITES[tier] || CA_HILT_SPRITES.Easy;
}

/**
 * Fallback SVG Data URIs for offline/adblock edge cases
 */
export const FALLBACK_SVGS = {
  sword: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23E5B842'%3E%3Cpath d='M14.5 17.5L3 6V3h3l11.5 11.5-3 3z'/%3E%3Cpath d='M18 8l3 3-2 2-3-3 2-2z'/%3E%3Cpath d='M19 19l2 2-1.5 1.5-2-2z'/%3E%3C/svg%3E",
  scroll: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338BDF8'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z'/%3E%3C/svg%3E",
  shield: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310B981'%3E%3Cpath d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'/%3E%3C/svg%3E"
};

/**
 * Image error handler fallback
 */
export function handleImageFallback(event: Event, fallbackType: 'sword' | 'scroll' | 'shield' = 'shield') {
  const target = event.target as HTMLImageElement;
  if (target && !target.src.startsWith('data:image/svg')) {
    target.src = FALLBACK_SVGS[fallbackType];
  }
}
