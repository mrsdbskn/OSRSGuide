<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DiaryRegion, DiaryTier } from '@/types/osrs';
import { usePlayerStore } from '@/stores/playerStore';
import { getDiaryEquipmentSprite, handleImageFallback } from '@/utils/assets';
import { fireMilestoneConfetti } from '@/utils/confetti';
import VideoFacade from './VideoFacade.vue';
import { CheckCircle2, Circle, AlertCircle, Video, CheckCheck, RotateCcw, Package, ChevronDown, ChevronUp, ExternalLink } from 'lucide-vue-next';

const props = defineProps<{
  region: DiaryRegion;
}>();

const playerStore = usePlayerStore();
const activeTier = ref<DiaryTier>('Easy');
const showVideo = ref(false);
const isCollapsed = ref(false);

const tiers: DiaryTier[] = ['Easy', 'Medium', 'Hard', 'Elite'];

// Check if entire tier is completed
function isTierCompleted(tier: DiaryTier): boolean {
  const tierData = props.region.tiers[tier];
  if (!tierData || !tierData.tasks.length) return false;
  return tierData.tasks.every((task) => playerStore.completedDiaryTasks.includes(task.id));
}

// Progress for current tier
const currentTierTasks = computed(() => props.region.tiers[activeTier.value]?.tasks || []);

const currentTierCompletedCount = computed(() => {
  return currentTierTasks.value.filter((t) => playerStore.completedDiaryTasks.includes(t.id)).length;
});

const currentTierProgressPercent = computed(() => {
  if (!currentTierTasks.value.length) return 0;
  return Math.round((currentTierCompletedCount.value / currentTierTasks.value.length) * 100);
});

// Items for active tier
const currentTierItems = computed(() => props.region.tiers[activeTier.value]?.items?.required || []);

// Check if player meets skill requirements for a task
function getSkillCheck(skills: Record<string, number>) {
  const result: { skill: string; required: number; current: number; met: boolean }[] = [];
  for (const [skill, required] of Object.entries(skills)) {
    const current = playerStore.skills[skill] || 1;
    result.push({
      skill,
      required,
      current,
      met: current >= required,
    });
  }
  return result;
}

function handleToggleTask(taskId: string) {
  const wasCompleted = playerStore.isDiaryTaskCompleted(taskId);
  playerStore.toggleDiaryTask(taskId);

  // If task just became completed, check if that completed the whole tier
  if (!wasCompleted) {
    const tierData = props.region.tiers[activeTier.value];
    const willBeCompleted = tierData.tasks.every((t) =>
      t.id === taskId ? true : playerStore.completedDiaryTasks.includes(t.id)
    );
    if (willBeCompleted) {
      fireMilestoneConfetti(`${props.region.name} ${activeTier.value} Diary Complete!`);
    }
  }
}

function toggleEntireTier() {
  const taskIds = currentTierTasks.value.map((t) => t.id);
  const allCompleted = isTierCompleted(activeTier.value);
  playerStore.batchCompleteDiaryTasks(taskIds, !allCompleted);
}

// Current tier video ID
const currentTierVideoId = computed(() => props.region.tiers[activeTier.value]?.youtubeVideoId);
</script>

<template>
  <div class="card-hover bg-osrs-surface rounded-2xl border border-white/10 hover:border-osrs-gold/40 shadow-m3-elevation-1 overflow-hidden flex flex-col transition-all">
    <!-- Regional Card Header -->
    <div class="p-4 sm:p-5 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="text-lg font-bold font-cinzel text-white flex items-center gap-2">
            {{ region.name }}
            <span class="text-xs font-sans font-normal text-gray-400">
              ({{ region.rewardItemName }})
            </span>
          </h3>
        </div>

        <!-- Video Guide Toggle Button -->
        <button
          type="button"
          @click="showVideo = !showVideo"
          class="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors"
          :class="showVideo ? 'bg-osrs-gold text-black border-osrs-gold font-semibold' : 'bg-osrs-elevated text-gray-300 hover:text-white border-white/10'"
          title="Toggle YouTube Video Guide"
        >
          <Video class="w-3.5 h-3.5" />
          <span>{{ showVideo ? 'Hide Guide' : 'Video' }}</span>
        </button>
      </div>

      <!-- Tabbed Navigation: Easy, Medium, Hard, Elite with Authentic Equipment Sprites -->
      <div class="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
        <button
          v-for="tier in tiers"
          :key="tier"
          type="button"
          @click="activeTier = tier"
          class="group relative flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-all text-xs font-semibold"
          :class="[
            activeTier === tier
              ? 'bg-osrs-elevated text-osrs-gold shadow-sm border border-osrs-gold/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
          ]"
        >
          <!-- Authentic Tiered Equipment Sprite -->
          <div class="relative w-6 h-6 flex-shrink-0 flex items-center justify-center">
            <img
              :src="getDiaryEquipmentSprite(region.id, tier)"
              :alt="`${region.name} ${tier}`"
              class="w-6 h-6 object-contain transition-all duration-300"
              :class="[
                isTierCompleted(tier)
                  ? 'opacity-100 drop-shadow hover:filter hover:drop-shadow-[0_0_8px_rgba(229,184,66,0.6)]'
                  : 'opacity-40 grayscale group-hover:opacity-70 group-hover:grayscale-0'
              ]"
              @error="(e) => handleImageFallback(e, 'shield')"
            />

            <!-- Tier completion indicator checkmark -->
            <span
              v-if="isTierCompleted(tier)"
              class="absolute -bottom-1 -right-1 w-3 h-3 bg-osrs-completed text-black rounded-full flex items-center justify-center text-[8px] font-black"
            >
              ✓
            </span>
          </div>

          <span class="text-[11px] sm:text-xs truncate">{{ tier }}</span>
        </button>
      </div>

      <!-- Collapse / Expand Tasks Toggle Bar -->
      <div class="mt-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5">
        <div class="flex items-center gap-2 text-xs">
          <span class="text-gray-400">
            {{ activeTier }} Tasks ({{ currentTierCompletedCount }} / {{ currentTierTasks.length }})
          </span>
          <span class="font-bold text-xs" :class="currentTierProgressPercent === 100 ? 'text-osrs-completed' : 'text-osrs-gold'">
            {{ currentTierProgressPercent }}%
          </span>
        </div>

        <button
          type="button"
          @click="isCollapsed = !isCollapsed"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          :title="isCollapsed ? 'Expand tasks checklist' : 'Collapse tasks checklist'"
        >
          <component :is="isCollapsed ? ChevronDown : ChevronUp" class="w-3.5 h-3.5 text-osrs-gold" />
          <span>{{ isCollapsed ? 'Show Tasks' : 'Collapse Tasks' }}</span>
        </button>
      </div>
    </div>

    <!-- Video Facade Accordion/Panel -->
    <div v-if="showVideo" class="p-4 bg-black/30 border-b border-white/5 transition-all">
      <div class="flex items-center justify-between mb-2.5 text-xs">
        <span class="font-semibold text-gray-200">
          {{ region.name }} {{ activeTier }} Quick Guide
        </span>
        <a
          href="https://www.youtube.com/@KaozOSRS"
          target="_blank"
          rel="noopener noreferrer"
          class="text-osrs-gold hover:text-osrs-gold-light inline-flex items-center gap-1 font-semibold transition-colors"
        >
          <span>Guide by @KaozOSRS</span>
          <ExternalLink class="w-3 h-3" />
        </a>
      </div>
      <VideoFacade
        :video-id="currentTierVideoId"
        :title="`${region.name} ${activeTier} Diary Quick Guide by Kaoz OSRS`"
      />
    </div>

    <!-- Card Content: Tier Progress & Task Checklist (Collapsible) -->
    <div v-show="!isCollapsed" class="p-4 sm:p-5 flex-1 flex flex-col justify-between transition-all">
      <!-- Tier Progress Header with Complete All Button -->
      <div class="flex items-center justify-between mb-3 text-xs gap-2">
        <div class="flex items-center gap-2">
          <span class="font-medium text-gray-400">
            {{ activeTier }} Tasks ({{ currentTierCompletedCount }} / {{ currentTierTasks.length }})
          </span>
          <span class="font-bold" :class="currentTierProgressPercent === 100 ? 'text-osrs-completed' : 'text-osrs-gold'">
            {{ currentTierProgressPercent }}%
          </span>
        </div>

        <!-- Complete All / Reset Tier Button -->
        <button
          type="button"
          @click="toggleEntireTier"
          class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5"
          :class="isTierCompleted(activeTier) ? 'bg-osrs-completed/10 text-osrs-completed border-osrs-completed/30 hover:bg-osrs-completed/20' : 'bg-osrs-gold/10 text-osrs-gold border-osrs-gold/30 hover:bg-osrs-gold/20'"
        >
          <CheckCheck v-if="!isTierCompleted(activeTier)" class="w-3.5 h-3.5" />
          <RotateCcw v-else class="w-3.5 h-3.5" />
          <span>{{ isTierCompleted(activeTier) ? 'Reset Tier' : 'Complete All' }}</span>
        </button>
      </div>

      <!-- Mini progress bar -->
      <div class="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-3">
        <div
          class="h-full transition-all duration-300 rounded-full"
          :class="currentTierProgressPercent === 100 ? 'bg-osrs-completed' : 'bg-osrs-gold'"
          :style="{ width: `${currentTierProgressPercent}%` }"
        />
      </div>

      <!-- Tier Items Needed Summary -->
      <div v-if="currentTierItems.length > 0" class="mb-4 p-2.5 rounded-xl bg-black/40 border border-white/5">
        <div class="text-[11px] font-semibold text-osrs-gold flex items-center gap-1.5 mb-1.5">
          <Package class="w-3.5 h-3.5 text-osrs-gold" />
          <span>Items Needed for {{ activeTier }} Tier:</span>
        </div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(item, idx) in currentTierItems"
            :key="idx"
            class="text-[10px] sm:text-[11px] bg-white/[0.04] text-gray-300 border border-white/10 px-2 py-0.5 rounded"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <!-- Task Item Checklist -->
      <div class="space-y-2.5 flex-1 max-h-[450px] overflow-y-auto pr-1 overscroll-contain">
        <div
          v-for="task in currentTierTasks"
          :key="task.id"
          @click="handleToggleTask(task.id)"
          class="group relative flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all"
          :class="[
            playerStore.isDiaryTaskCompleted(task.id)
              ? 'bg-osrs-completed/5 border-osrs-completed/20 text-gray-300'
              : 'bg-osrs-base/40 hover:bg-osrs-elevated/80 border-white/5 hover:border-white/15 text-gray-200'
          ]"
        >
          <!-- Checkbox Circle -->
          <div class="pt-0.5 flex-shrink-0">
            <CheckCircle2
              v-if="playerStore.isDiaryTaskCompleted(task.id)"
              class="w-5 h-5 text-osrs-completed transition-transform group-hover:scale-110"
            />
            <Circle
              v-else
              class="w-5 h-5 text-gray-500 group-hover:text-osrs-gold transition-colors"
            />
          </div>

          <!-- Task Description & Requirements -->
          <div class="flex-1 min-w-0">
            <p
              class="text-xs sm:text-sm font-normal leading-relaxed"
              :class="{ 'line-through text-gray-500': playerStore.isDiaryTaskCompleted(task.id) }"
            >
              {{ task.description }}
            </p>

            <!-- Skill & Item Badges -->
            <div class="flex flex-wrap items-center gap-1.5 mt-2">
              <!-- Skill Badges -->
              <div
                v-for="check in getSkillCheck(task.skills)"
                :key="check.skill"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border"
                :class="[
                  check.met
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                ]"
                :title="`${check.skill}: Player Lv ${check.current} / Req Lv ${check.required}`"
              >
                <span>{{ check.skill }} {{ check.required }}</span>
                <span class="text-[10px] opacity-75">({{ check.current }})</span>
                <AlertCircle v-if="!check.met" class="w-3 h-3 text-red-400" />
              </div>

              <!-- Task Item Badges -->
              <span
                v-for="(item, idx) in (task.items?.required || [])"
                :key="idx"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-gray-400 border border-white/5"
              >
                🎒 {{ item }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
