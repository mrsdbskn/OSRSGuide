<script setup lang="ts">
import { computed } from 'vue';
import type { Quest } from '@/types/osrs';
import { usePlayerStore } from '@/stores/playerStore';
import { useMilestoneStore } from '@/stores/milestoneStore';
import { useBodyScrollLock } from '@/composables/useBodyScrollLock';
import VideoFacade from './VideoFacade.vue';
import { X, CheckCircle2, Circle, Scroll, Award, AlertCircle, ExternalLink, Package } from 'lucide-vue-next';

const props = defineProps<{
  quest: Quest | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle', quest: Quest): void;
}>();

// Lock background scrolling on mobile & desktop when drawer is open
useBodyScrollLock(computed(() => props.isOpen && !!props.quest));

const playerStore = usePlayerStore();
const milestoneStore = useMilestoneStore();

const isCompleted = computed(() => {
  if (!props.quest) return false;
  return playerStore.isQuestCompleted(props.quest.id);
});

// Check skill requirements
const skillChecks = computed(() => {
  if (!props.quest) return [];
  return Object.entries(props.quest.requirements.skills).map(([skill, required]) => {
    const current = playerStore.skills[skill] || 1;
    return {
      skill,
      required,
      current,
      met: current >= required,
    };
  });
});

// Check quest prereqs
const questPrereqChecks = computed(() => {
  if (!props.quest) return [];
  return props.quest.requirements.quests.map((prereqId) => {
    const found = milestoneStore.quests.find((q) => q.id === prereqId);
    const completed = playerStore.isQuestCompleted(prereqId);
    return {
      id: prereqId,
      name: found ? found.name : prereqId,
      completed,
    };
  });
});

const wikiUrl = computed(() => {
  if (!props.quest) return '#';
  return `https://oldschool.runescape.wiki/w/${encodeURIComponent(props.quest.name.replace(/ /g, '_'))}`;
});
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="isOpen && quest"
      class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity overscroll-contain"
      @click="emit('close')"
      @touchmove.prevent
    >
      <!-- Slide-over Drawer Panel -->
      <div
        class="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10"
        @click.stop
      >
        <div class="w-screen max-w-full sm:max-w-md bg-osrs-surface border-l border-white/10 shadow-2xl flex flex-col h-full overflow-hidden overscroll-contain">
          
          <!-- Drawer Header -->
          <div class="p-5 border-b border-white/10 bg-osrs-elevated/70 flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border"
                  :class="{
                    'bg-blue-500/10 text-blue-400 border-blue-500/20': quest.difficulty === 'Novice',
                    'bg-green-500/10 text-green-400 border-green-500/20': quest.difficulty === 'Intermediate',
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': quest.difficulty === 'Experienced',
                    'bg-orange-500/10 text-orange-400 border-orange-500/20': quest.difficulty === 'Master',
                    'bg-purple-500/10 text-purple-400 border-purple-500/20': quest.difficulty === 'Grandmaster' || quest.difficulty === 'Special',
                  }"
                >
                  {{ quest.difficulty }}
                </span>
                <span class="text-xs text-osrs-gold font-semibold">
                  {{ quest.questPoints }} Quest Point{{ quest.questPoints > 1 ? 's' : '' }}
                </span>
                <span v-if="quest.members" class="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/20">
                  Members
                </span>
                <span v-if="quest.isUnreleased" class="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/40 uppercase">
                  Upcoming / Unreleased
                </span>
              </div>
              <h2 class="text-xl font-bold font-cinzel text-white leading-tight">
                {{ quest.name }}
              </h2>
            </div>

            <button
              @click="emit('close')"
              class="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Drawer Body (Scrollable) -->
          <div class="p-5 overflow-y-auto space-y-6 flex-1 overscroll-contain">
            <!-- Unreleased / Upcoming Content Disclaimer Banner -->
            <div
              v-if="quest.isUnreleased"
              class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 shadow-sm"
            >
              <div class="flex items-center gap-1.5 font-bold text-amber-400 text-sm">
                <AlertCircle class="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Unreleased Quest Notice</span>
              </div>
              <p class="text-xs leading-relaxed text-amber-200/90">
                This quest was revealed by Jagex (e.g. at the Summer/Winter Summit) but has not yet been released into Old School RuneScape.
                Prerequisites, skill requirements, and rewards are tentative and do not count toward the official 343 Quest Point Cape.
              </p>
            </div>

            <!-- Completion Status Button -->
            <button
              type="button"
              @click="emit('toggle', quest)"
              class="w-full flex items-center justify-between p-3.5 rounded-xl border transition-all"
              :class="[
                isCompleted
                  ? 'bg-osrs-completed/10 border-osrs-completed/40 text-osrs-completed'
                  : 'bg-osrs-elevated hover:bg-osrs-drawer border-white/10 text-gray-200'
              ]"
            >
              <div class="flex items-center gap-3">
                <CheckCircle2 v-if="isCompleted" class="w-5 h-5 text-osrs-completed" />
                <Circle v-else class="w-5 h-5 text-gray-400" />
                <span class="font-bold text-sm">
                  {{ isCompleted ? 'Quest Completed' : 'Mark Quest as Completed' }}
                </span>
              </div>
              <span class="text-xs opacity-75">Click to toggle</span>
            </button>

            <!-- Video Guide Facade -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
                Video Walkthrough
              </h3>
              <VideoFacade
                :video-id="quest.youtubeVideoId"
                :title="`${quest.name} Quick Guide`"
                :is-unreleased="quest.isUnreleased"
              />
            </div>

            <!-- Skill Requirements -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center justify-between">
                <span>Skill Requirements</span>
                <span class="text-[11px] font-normal text-gray-500">Live verified</span>
              </h3>

              <div v-if="skillChecks.length > 0" class="grid grid-cols-2 gap-2">
                <div
                  v-for="check in skillChecks"
                  :key="check.skill"
                  class="flex items-center justify-between p-2 rounded-lg border text-xs"
                  :class="[
                    check.met
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-gray-200'
                      : 'bg-red-500/10 border-red-500/30 text-red-200'
                  ]"
                >
                  <span class="font-medium">{{ check.skill }}</span>
                  <div class="flex items-center gap-1.5 font-bold">
                    <span :class="check.met ? 'text-emerald-400' : 'text-red-400'">
                      {{ check.current }} / {{ check.required }}
                    </span>
                    <AlertCircle v-if="!check.met" class="w-3.5 h-3.5 text-red-400" />
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-gray-500 italic">
                No skill requirements.
              </p>
            </div>

            <!-- Quest Prerequisites -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
                Quest Prerequisites
              </h3>
              <div v-if="questPrereqChecks.length > 0" class="space-y-1.5">
                <div
                  v-for="prereq in questPrereqChecks"
                  :key="prereq.id"
                  class="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 text-xs"
                >
                  <span class="text-gray-200 font-medium">{{ prereq.name }}</span>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded"
                    :class="prereq.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'"
                  >
                    {{ prereq.completed ? 'Completed' : 'Missing' }}
                  </span>
                </div>
              </div>
              <p v-else class="text-xs text-gray-500 italic">
                None.
              </p>
            </div>

            <!-- Items Required & Recommended -->
            <div v-if="(quest.items?.required?.length || 0) > 0 || (quest.items?.recommended?.length || 0) > 0">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
                <Package class="w-3.5 h-3.5 text-osrs-gold" />
                <span>Items</span>
              </h3>

              <div class="space-y-3">
                <!-- Required items -->
                <div v-if="quest.items?.required && quest.items.required.length > 0">
                  <div class="text-[11px] font-semibold text-osrs-gold mb-1.5">Required Items:</div>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="(item, idx) in quest.items.required"
                      :key="idx"
                      class="px-2.5 py-1 rounded-lg bg-black/40 border border-osrs-gold/20 text-xs text-gray-200"
                    >
                      {{ item }}
                    </span>
                  </div>
                </div>

                <!-- Recommended items -->
                <div v-if="quest.items?.recommended && quest.items.recommended.length > 0">
                  <div class="text-[11px] font-semibold text-cyan-400 mb-1.5">Recommended Items:</div>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="(item, idx) in quest.items.recommended"
                      :key="idx"
                      class="px-2.5 py-1 rounded-lg bg-black/40 border border-cyan-400/20 text-xs text-gray-300"
                    >
                      {{ item }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quest Rewards -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
                <Award class="w-3.5 h-3.5 text-osrs-gold" />
                <span>Rewards</span>
              </h3>

              <div class="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                <!-- QP -->
                <div class="flex items-center justify-between text-gray-300">
                  <span>Quest Points</span>
                  <span class="font-bold text-osrs-gold">+{{ quest.rewards.questPoints }} QP</span>
                </div>

                <!-- XP -->
                <div v-if="quest.rewards.experience && Object.keys(quest.rewards.experience).length > 0" class="pt-2 border-t border-white/5 space-y-1">
                  <div class="text-[11px] text-gray-400 font-semibold mb-1">Experience:</div>
                  <div
                    v-for="(xp, skill) in quest.rewards.experience"
                    :key="skill"
                    class="flex items-center justify-between text-gray-300 text-xs"
                  >
                    <span>{{ skill }}</span>
                    <span class="text-emerald-400 font-medium">+{{ xp.toLocaleString() }} XP</span>
                  </div>
                </div>

                <!-- Items & Unlocks -->
                <div v-if="quest.rewards.items && quest.rewards.items.length > 0" class="pt-2 border-t border-white/5 space-y-1">
                  <div class="text-[11px] text-gray-400 font-semibold mb-1">Items & Unlocks:</div>
                  <ul class="list-disc list-inside text-gray-300 space-y-0.5">
                    <li v-for="item in quest.rewards.items" :key="item">
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Official Wiki Guide Link -->
            <a
              :href="wikiUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-osrs-elevated hover:bg-osrs-drawer text-gray-300 hover:text-white border border-white/10 text-xs font-medium transition-colors"
            >
              <span>View Official OSRS Wiki Guide</span>
              <ExternalLink class="w-3.5 h-3.5 text-osrs-gold" />
            </a>

          </div>

          <!-- Sticky Drawer Footer Action -->
          <div class="p-3.5 sm:p-4 border-t border-white/10 bg-osrs-elevated/95 backdrop-blur-md flex items-center gap-2.5">
            <button
              type="button"
              @click="emit('toggle', quest)"
              class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all min-h-[48px] select-none"
              :class="isCompleted ? 'bg-osrs-completed hover:bg-emerald-600 text-black shadow-emerald-900/40' : 'bg-osrs-gold hover:bg-osrs-gold-light text-black shadow-gold-glow'"
            >
              <CheckCircle2 v-if="isCompleted" class="w-4 h-4 text-black" />
              <Circle v-else class="w-4 h-4 text-black/60" />
              <span>{{ isCompleted ? 'Quest Completed' : 'Mark Completed' }}</span>
            </button>
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold min-h-[48px] select-none"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>
