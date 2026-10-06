<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePlayerStore } from '@/stores/playerStore';
import {
  X,
  Upload,
  Download,
  Check,
  AlertCircle,
  Zap,
  BookOpen,
  Copy,
  ExternalLink,
  FolderOpen,
  RefreshCw,
  HelpCircle,
  Sparkles
} from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const playerStore = usePlayerStore();
const activeTab = ref<'wikisync' | 'extraction' | 'backup'>('wikisync');

// WikiSync modal input
const wikiSyncRsn = ref(playerStore.rsn || '');
const isSyncingWiki = ref(false);
const wikiSyncMsg = ref('');
const wikiSyncError = ref('');

// Backup / Import inputs
const jsonInput = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const copiedTemplate = ref(false);
const showBrowserHelper = ref(false);

const wikiSyncUrl = computed(() => {
  const username = wikiSyncRsn.value.trim() || playerStore.rsn || 'mrsdbskn';
  return `https://sync.runescape.wiki/runelite/player/${encodeURIComponent(username)}/STANDARD`;
});

async function handleModalWikiSync() {
  wikiSyncError.value = '';
  wikiSyncMsg.value = '';
  const username = wikiSyncRsn.value.trim() || playerStore.rsn;
  if (!username) {
    wikiSyncError.value = 'Please enter your RuneScape username.';
    return;
  }

  isSyncingWiki.value = true;
  try {
    const res = await playerStore.fetchProfile(username);
    if (res?.source === 'wikisync') {
      wikiSyncMsg.value = `✨ Success! Loaded ${res.questsCount} completed quests, ${res.diariesCount} diary tasks, and ${res.caCount} combat achievements directly from WikiSync!`;
      showBrowserHelper.value = false;
    } else {
      wikiSyncMsg.value = `Synced levels for ${playerStore.rsn} via Wise Old Man. (Note: OSRS Wiki blocks direct website API requests for quests/diaries — use the 10-second Browser Sync helper below to complete all quests!)`;
      showBrowserHelper.value = true;
    }
  } catch (err: any) {
    wikiSyncError.value = err.message || 'Player not found on WikiSync or Wise Old Man.';
    showBrowserHelper.value = true;
  } finally {
    isSyncingWiki.value = false;
  }
}

async function handlePasteFromClipboard() {
  wikiSyncError.value = '';
  wikiSyncMsg.value = '';
  try {
    const text = await navigator.clipboard.readText();
    if (!text || !text.trim()) {
      wikiSyncError.value = 'Clipboard is empty. Please copy your WikiSync data first!';
      return;
    }
    const success = playerStore.importData(text.trim());
    if (success) {
      wikiSyncMsg.value = `✨ Auto-Completed! Loaded ${playerStore.completedQuests.length} quests, ${playerStore.completedDiaryTasks.length} diary tasks, and all skill levels!`;
      showBrowserHelper.value = false;
    } else {
      wikiSyncError.value = 'Could not parse data from clipboard. Please make sure you copied the JSON text.';
    }
  } catch (_) {
    // If browser blocks clipboard access, switch to backup tab with focus
    activeTab.value = 'backup';
    errorMsg.value = 'Clipboard access was blocked by your browser. Please paste your JSON directly into the box below!';
  }
}

function handleImport() {
  errorMsg.value = '';
  successMsg.value = '';
  if (!jsonInput.value.trim()) {
    errorMsg.value = 'Please paste JSON data first.';
    return;
  }

  const success = playerStore.importData(jsonInput.value.trim());
  if (success) {
    successMsg.value = 'Data imported successfully!';
    jsonInput.value = '';
    setTimeout(() => {
      emit('close');
      successMsg.value = '';
    }, 1200);
  } else {
    errorMsg.value = 'Failed to parse JSON. Please verify the format.';
  }
}

function handleExport() {
  const data = playerStore.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `osrs-tracker-${playerStore.rsn || 'profile'}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target?.result as string;
    if (content) {
      jsonInput.value = content;
    }
  };
  reader.readAsText(file);
}

const SAMPLE_TEMPLATE = `{
  "rsn": "Zezima",
  "skills": {
    "Attack": 99,
    "Defence": 99,
    "Strength": 99,
    "Hitpoints": 99,
    "Ranged": 99,
    "Prayer": 99,
    "Magic": 99,
    "Cooking": 99,
    "Woodcutting": 99,
    "Fletching": 99,
    "Fishing": 99,
    "Firemaking": 99,
    "Crafting": 99,
    "Smithing": 99,
    "Mining": 99,
    "Herblore": 99,
    "Agility": 99,
    "Thieving": 99,
    "Slayer": 99,
    "Farming": 99,
    "Runecraft": 99,
    "Hunter": 99,
    "Construction": 99,
    "Sailing": 70
  },
  "completedQuests": [
    "cooks-assistant",
    "dragon-slayer-i",
    "recipe-for-disaster"
  ],
  "completedDiaryTasks": [
    "ard-easy-1",
    "fal-hard-2"
  ],
  "completedCombatTasks": [
    "ca-28",
    "ca-32"
  ]
}`;

function copySampleTemplate() {
  navigator.clipboard.writeText(SAMPLE_TEMPLATE);
  copiedTemplate.value = true;
  setTimeout(() => {
    copiedTemplate.value = false;
  }, 2000);
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity"
      @click.self="emit('close')"
    >
      <div class="relative w-full max-w-2xl bg-osrs-surface border border-osrs-gold/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <!-- Header -->
        <div class="p-5 border-b border-white/10 flex items-center justify-between bg-osrs-elevated/70">
          <div>
            <h3 class="text-lg font-bold font-cinzel text-white flex items-center gap-2">
              <Zap class="w-5 h-5 text-osrs-gold" />
              <span>RuneLite Sync & Data Guide</span>
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">
              Choose an automated live sync method, read extraction instructions, or backup JSON.
            </p>
          </div>
          <button
            @click="emit('close')"
            class="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center border-b border-white/10 bg-black/40 px-5 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            @click="activeTab = 'wikisync'"
            class="pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all"
            :class="activeTab === 'wikisync' ? 'border-osrs-gold text-osrs-gold' : 'border-transparent text-gray-400 hover:text-gray-200'"
          >
            <Zap class="w-3.5 h-3.5" />
            <span>1-Click WikiSync (Automated)</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'extraction'"
            class="pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all"
            :class="activeTab === 'extraction' ? 'border-osrs-gold text-osrs-gold' : 'border-transparent text-gray-400 hover:text-gray-200'"
          >
            <BookOpen class="w-3.5 h-3.5" />
            <span>RuneLite Extraction Guide</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'backup'"
            class="pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all"
            :class="activeTab === 'backup' ? 'border-osrs-gold text-osrs-gold' : 'border-transparent text-gray-400 hover:text-gray-200'"
          >
            <Upload class="w-3.5 h-3.5" />
            <span>Manual Backup & JSON</span>
          </button>
        </div>

        <!-- Modal Body Content -->
        <div class="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          <!-- TAB 1: 1-CLICK WIKISYNC -->
          <div v-if="activeTab === 'wikisync'" class="space-y-4">
            <div class="p-3.5 rounded-xl bg-osrs-gold/10 border border-osrs-gold/30 text-amber-200 leading-relaxed">
              <div class="font-bold text-osrs-gold flex items-center gap-1.5 text-sm mb-1">
                <HelpCircle class="w-4 h-4 text-osrs-gold" />
                <span>How Does the OSRS Wiki Sync Work?</span>
              </div>
              <p>
                The Old School RuneScape Wiki has a built-in public sync service (<code class="bg-black/50 px-1 py-0.5 rounded text-amber-300">sync.runescape.wiki</code>) powered by the official <strong>WikiSync</strong> RuneLite & HDOS plugin.
                When enabled, your client automatically uploads your in-game quest completions, diary tasks, combat achievements, and skill levels.
              </p>
              <p class="mt-1 text-gray-300">
                Because this API is completely public and CORS-enabled, <strong>no custom plugin is needed</strong>! You can pull your actual in-game completions right here with a single click.
              </p>
            </div>

            <!-- Steps list -->
            <div class="space-y-2">
              <h4 class="font-bold text-gray-200 uppercase tracking-wider text-[11px]">How to Enable WikiSync (One-time Setup)</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300">
                <div class="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div class="font-semibold text-white flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-osrs-gold/20 text-osrs-gold flex items-center justify-center text-[10px] font-black">1</span>
                    <span>Open RuneLite Settings</span>
                  </div>
                  <p class="text-gray-400 text-[11px]">Click the Wrench (Configuration) icon in the top right sidebar of RuneLite.</p>
                </div>

                <div class="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div class="font-semibold text-white flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-osrs-gold/20 text-osrs-gold flex items-center justify-center text-[10px] font-black">2</span>
                    <span>Search "WikiSync"</span>
                  </div>
                  <p class="text-gray-400 text-[11px]">Search for <strong>WikiSync</strong> in the settings list (or via the Plugin Hub at the bottom).</p>
                </div>

                <div class="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div class="font-semibold text-white flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-osrs-gold/20 text-osrs-gold flex items-center justify-center text-[10px] font-black">3</span>
                    <span>Toggle to ON</span>
                  </div>
                  <p class="text-gray-400 text-[11px]">Flip the toggle to green. Whenever you play or hop worlds, data pushes to the wiki server automatically.</p>
                </div>

                <div class="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div class="font-semibold text-white flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-osrs-gold/20 text-osrs-gold flex items-center justify-center text-[10px] font-black">4</span>
                    <span>Sync in this App</span>
                  </div>
                  <p class="text-gray-400 text-[11px]">Type your username below and hit <strong>Sync Profile</strong>!</p>
                </div>
              </div>
            </div>

            <!-- In-Modal Quick Sync Box -->
            <div class="p-4 rounded-xl bg-osrs-elevated border border-white/10 space-y-3">
              <label class="block font-semibold text-white">Live Sync Your Account</label>
              <div class="flex items-center gap-2">
                <input
                  v-model="wikiSyncRsn"
                  type="text"
                  placeholder="Enter your RuneScape username..."
                  class="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-osrs-gold"
                  @keyup.enter="handleModalWikiSync"
                />
                <button
                  type="button"
                  @click="handleModalWikiSync"
                  :disabled="isSyncingWiki"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-osrs-gold hover:bg-osrs-gold-light text-black font-bold text-xs uppercase tracking-wider transition-all shadow-gold-glow flex-shrink-0"
                >
                  <RefreshCw v-if="isSyncingWiki" class="w-3.5 h-3.5 animate-spin" />
                  <span>{{ isSyncingWiki ? 'Syncing...' : 'Sync Profile' }}</span>
                </button>
              </div>

              <div v-if="wikiSyncMsg" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <Check class="w-4 h-4 flex-shrink-0" />
                <span>{{ wikiSyncMsg }}</span>
              </div>

              <div v-if="wikiSyncError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle class="w-4 h-4 flex-shrink-0" />
                <span>{{ wikiSyncError }}</span>
              </div>

              <!-- 10-Second Instant Sync Helper (Bypasses OSRS Wiki 3rd-party Cloudflare block) -->
              <div class="mt-3 p-3.5 rounded-xl bg-black/60 border border-osrs-gold/30 space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-osrs-gold flex items-center gap-1.5 text-xs">
                    <Sparkles class="w-4 h-4 text-osrs-gold" />
                    <span>Instant 100% Autocomplete Helper</span>
                  </div>
                  <span class="text-[10px] bg-osrs-gold/20 text-osrs-gold px-2 py-0.5 rounded-full font-semibold">10-Second Setup</span>
                </div>
                
                <p class="text-gray-300 text-[11px] leading-relaxed">
                  The OSRS Wiki blocks external websites from directly reading their API to fight bots. You can instantly bypass this restriction in your own browser in 2 clicks:
                </p>

                <div class="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    :href="wikiSyncUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 bg-osrs-surface hover:bg-white/10 text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-white/15 hover:border-osrs-gold/50 transition-all"
                  >
                    <ExternalLink class="w-3.5 h-3.5 text-osrs-gold" />
                    <span>1. Open WikiSync Profile in Browser ↗</span>
                  </a>

                  <button
                    type="button"
                    @click="handlePasteFromClipboard"
                    class="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <Copy class="w-3.5 h-3.5" />
                    <span>2. Paste & Auto-Complete All</span>
                  </button>
                </div>
                
                <p class="text-[10px] text-gray-400 italic">
                  Step 1 opens your official WikiSync page. Press <kbd class="bg-black/80 px-1 py-0.5 rounded text-gray-200">Ctrl+A</kbd> then <kbd class="bg-black/80 px-1 py-0.5 rounded text-gray-200">Ctrl+C</kbd>, then click Step 2! Any quests you manually checked are safely preserved and merged.
                </p>
              </div>
            </div>
          </div>

          <!-- TAB 2: EXTRACTION GUIDE -->
          <div v-if="activeTab === 'extraction'" class="space-y-4">
            <div class="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <h4 class="font-bold text-white text-sm flex items-center gap-2">
                <FolderOpen class="w-4 h-4 text-osrs-gold" />
                <span>RuneLite File Locations on Your PC</span>
              </h4>
              <p class="text-gray-300 leading-relaxed">
                RuneLite saves your local profile configurations and plugin settings inside the hidden <code class="text-osrs-gold bg-black/60 px-1 py-0.5 rounded">.runelite</code> directory in your user home folder:
              </p>
              <div class="space-y-1.5 pt-1 text-[11px] font-mono">
                <div class="p-2 rounded bg-black/60 text-gray-300">
                  <span class="text-gray-500">Windows:</span> %USERPROFILE%\.runelite\profiles\
                </div>
                <div class="p-2 rounded bg-black/60 text-gray-300">
                  <span class="text-gray-500">macOS:</span> ~/.runelite/profiles/
                </div>
                <div class="p-2 rounded bg-black/60 text-gray-300">
                  <span class="text-gray-500">Linux:</span> ~/.runelite/profiles/
                </div>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <h4 class="font-bold text-white text-sm">Quest Helper & Completion Backup</h4>
              <p class="text-gray-300 leading-relaxed">
                If you don't use WikiSync, you can create a custom backup of your completed quests and diaries. Below is the JSON format accepted by this tracker:
              </p>

              <div class="relative">
                <pre class="bg-black/80 p-3 rounded-xl border border-white/10 text-[10px] font-mono text-gray-300 overflow-x-auto max-h-48">{{ SAMPLE_TEMPLATE }}</pre>
                <button
                  type="button"
                  @click="copySampleTemplate"
                  class="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-osrs-elevated hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[10px]"
                >
                  <Copy class="w-3 h-3 text-osrs-gold" />
                  <span>{{ copiedTemplate ? 'Copied!' : 'Copy Template' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 3: BACKUP / MANUAL JSON -->
          <div v-if="activeTab === 'backup'" class="space-y-4">
            <p class="text-gray-400">
              Paste JSON data from a previously saved tracker export or upload a <code class="text-osrs-gold">.json</code> file.
            </p>

            <div v-if="successMsg" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check class="w-4 h-4 flex-shrink-0" />
              <span>{{ successMsg }}</span>
            </div>

            <div v-if="errorMsg" class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle class="w-4 h-4 flex-shrink-0" />
              <span>{{ errorMsg }}</span>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="font-semibold text-gray-300">Paste JSON</label>
                <label class="text-[11px] text-osrs-gold hover:underline cursor-pointer flex items-center gap-1">
                  <FolderOpen class="w-3.5 h-3.5" />
                  <span>Upload .json File</span>
                  <input type="file" accept=".json" class="hidden" @change="handleFileUpload" />
                </label>
              </div>
              <textarea
                v-model="jsonInput"
                rows="6"
                placeholder='{"completedQuests": ["cooks-assistant", "dragon-slayer-i"], "skills": {"Attack": 70, "Strength": 75}}'
                class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-osrs-gold/50"
              />
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                @click="handleImport"
                class="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-osrs-gold hover:bg-osrs-gold-light text-black font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all"
              >
                <Upload class="w-4 h-4 text-black" />
                <span>Import JSON Data</span>
              </button>

              <button
                type="button"
                @click="handleExport"
                class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-osrs-elevated hover:bg-osrs-drawer text-gray-200 font-semibold text-xs border border-white/10 transition-colors"
              >
                <Download class="w-4 h-4 text-osrs-gold" />
                <span>Export Progress Backup</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  </Teleport>
</template>
