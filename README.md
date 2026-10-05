# ⚔️ OSRS Progress Tracker & Milestone Guide

A dark-mode Single-Page Application (SPA) built with **Vue 3 (Composition API / `<script setup>`)**, **TypeScript**, **Vite**, **Pinia**, **Vue Router**, and **Tailwind CSS**, designed for tracking account milestones across **Quests**, **Achievement Diaries**, and **Combat Achievements**.

Optimized for high-performance static hosting on **GitHub Pages**.

---

## ✨ Key Features

### 1. 🧭 Sticky Milestone Top HUD (`<TopMilestoneHud.vue>`)
- **Quests Metric**: Quest Points pill (`XXX / 300 QP`) with mini progress gauge. Hover tooltip indicates QP needed for the Quest Point Cape.
- **Diaries Metric**: Diary Tiers completion pill (`XX / 48 Tiers`) showing the latest unlocked diary item sprite. Hover indicates tiers remaining for the Achievement Diary Cape.
- **Combat Achievements Metric**: Total points gauge (`XXXX / 2005 pts`) flanked by the unlocked Tier Sword sprite. Hover displays points required for the next sword upgrade.
- **Next Immediate Reward Pin**: Real-time badge identifying the closest unlockable reward (e.g. *"Next Reward: Hard Combat Hilt (14 pts away)"* or *"Next Reward: Barrows Gloves (2 quests away)"*).
- **View Density Toggle**: Switch effortlessly between **Detailed Cards** and **Compact Row View**.
- **Universal Command Palette Trigger**: Quick search across all milestones via `Ctrl + K` / `Cmd + K`.

### 2. 🎨 Authentic Game Sprite & Icon Mapping (`/src/utils/assets.ts`)
- **Achievement Diaries**: All 12 regions with authentic tiered equipment sprites (Tiers 1–4):
  - Ardougne Cloak (1–4), Desert Amulet (1–4), Falador Shield (1–4), Fremennik Sea Boots (1–4), Kandarin Headgear (1–4), Karamja Gloves (1–4), Rada's Blessing (1–4), Explorer's Ring (1–4), Morytania Legs (1–4), Varrock Armour (1–4), Western Banner (1–4), Wilderness Sword (1–4).
  - Uncompleted tiers render dimmed (`opacity-40 grayscale`); completed tiers render in full vibrant color with gold hover glow.
- **Combat Achievements**: Authentic tier sword sprites across Easy, Medium, Hard, Elite, Master, and Grandmaster.
- **Quests**: Classic Quest Scroll and Quest Point Cape sprites.

### 3. 🛡️ Profile Synchronization & Local Persistence
- **Wise Old Man API Sync**: Direct search connecting to `https://api.wiseoldman.net/v2/players/{username}` to automatically pull verified player levels and calculate combat level.
- **RuneLite & JSON Import/Export**: Import Quest Helper / Diary exports or export a complete JSON backup.
- **Manual Stat Tuning**: Interactive skill adjuster to test requirements and explore unlock paths.
- **Automatic Storage**: Progress persists locally in `localStorage`.

### 4. 📜 Quests Section (`/quests`)
- Sort by **Optimal Quest Guide order** (default), **Difficulty**, or **Alphabetical**.
- Smart Status Filters: All, Completed, Incomplete, "Eligible to Complete" (all stat and quest prereqs satisfied), "Missing Stats" (highlights exact missing levels), "Missing Prerequisites".
- **Prerequisite Cascade Modal**: Marking a late-game quest complete offers an opt-in modal: *"Mark all prerequisite quests as complete as well?"*.
- **YouTube Facade Player (`<VideoFacade.vue>`)**: Lightweight thumbnail (`https://i.ytimg.com/vi/{videoId}/hqdefault.jpg`) with Material 3 play button, mounting the iframe on click.
- **Quest Drawer (`<QuestDrawer.vue>`)**: Slide-over panel with skill comparisons, quest prerequisites, rewards, and external wiki links.
- **Celebratory Confetti**: Triggers dynamic gold confetti on completing Grandmaster quests (e.g. Dragon Slayer II, Desert Treasure II).

### 5. 🗺️ Achievement Diaries Section (`/diaries`)
- 12 Regional Cards (Ardougne, Desert, Falador, Fremennik, Kandarin, Karamja, Kourend & Kebos, Lumbridge & Draynor, Morytania, Varrock, Western Provinces, Wilderness).
- Tabbed navigation across **Easy, Medium, Hard, Elite** with live gear sprites.
- Task checklist with live stat verification (player level vs required level).
- Region-and-tier video guide embeds.

### 6. ⚔️ Combat Achievements Section (`/combat-achievements`)
- Tier points threshold system: Easy (33 pts), Medium (115 pts), Hard (304 pts), Elite (820 pts), Master (1465 pts), Grandmaster (2005 pts).
- Toggle between **Grouped by Tier** and **Grouped by Boss/Monster**.
- Filter by task category: Kill Count, Perfection, Restriction, Speed, Stamina.
- Compact task rows (`<CombatTaskRow.vue>`) with monster tags and point badges.

---

## 🛠️ Project Structure

```
OSRSGuide/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions Pages deployment
├── public/
├── src/
│   ├── components/
│   │   ├── AppHeader.vue           # Header with logo, navigation, RSN badge
│   │   ├── TopMilestoneHud.vue     # Sticky progress HUD
│   │   ├── VideoFacade.vue         # Lightweight YouTube embed facade
│   │   ├── DiaryCard.vue           # 12-region diary cards with 4 tier tabs
│   │   ├── CombatTaskRow.vue       # Compact combat task row
│   │   ├── CommandPalette.vue      # Global Ctrl+K instant search modal
│   │   ├── QuestDrawer.vue         # Slide-over quest detail drawer
│   │   ├── PrerequisiteCascadeModal.vue # Prereq completion modal
│   │   └── ImportExportModal.vue   # JSON / RuneLite import & export modal
│   ├── data/
│   │   ├── quests.json             # Quests dataset with optimal orders & reqs
│   │   ├── diaries.json            # 12 regions with Easy-Elite tasks & skills
│   │   └── combatAchievements.json # CA tasks across 6 tiers & bosses
│   ├── router/
│   │   └── index.ts                # Hash history router for GitHub Pages
│   ├── stores/
│   │   ├── playerStore.ts          # Pinia player profile, skills, sync, storage
│   │   └── milestoneStore.ts       # Live metrics, thresholds, immediate reward
│   ├── types/
│   │   └── osrs.ts                 # TypeScript schemas
│   ├── utils/
│   │   ├── assets.ts               # Sprite mapper, CDN URLs & SVG fallbacks
│   │   └── confetti.ts             # canvas-confetti celebration effects
│   ├── views/
│   │   ├── HomeView.vue            # Landing page with WOM sync & 3 gateway cards
│   │   ├── QuestsView.vue          # Quests list, filters, sorting
│   │   ├── DiariesView.vue         # Regional diary cards
│   │   └── CombatAchievementsView.vue # Combat tasks & threshold progression
│   ├── App.vue                     # Root layout
│   ├── main.ts                     # Vue bootstrap
│   └── style.css                   # Tailwind CSS + Material 3 Dark theme
├── index.html                      # HTML entry with Google Fonts & SEO tags
├── package.json
├── postcss.config.js
├── tailwind.config.js              # Material 3 Dark gaming tokens
├── tsconfig.app.json
├── tsconfig.json
└── vite.config.ts                  # Vite config with base: './'
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Run Locally (Development Server)
```bash
npm run dev
```
Navigate to `http://localhost:5173/`.

### Build for Production
```bash
npm run build
```
The compiled static assets will be output in the `dist/` directory ready for deployment on GitHub Pages.
