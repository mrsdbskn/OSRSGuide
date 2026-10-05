<script setup lang="ts">
import { computed } from 'vue';
import type { Quest } from '@/types/osrs';
import { useMilestoneStore } from '@/stores/milestoneStore';
import { usePlayerStore } from '@/stores/playerStore';
import { AlertTriangle, CheckCheck, X } from 'lucide-vue-next';

const props = defineProps<{
  targetQuest: Quest | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'confirm-all', questIds: string[]): void;
  (e: 'confirm-single', questId: string): void;
  (e: 'close'): void;
}>();

const milestoneStore = useMilestoneStore();
const playerStore = usePlayerStore();

// Recursively find all incomplete prerequisites
const missingPrerequisites = computed<Quest[]>(() => {
  if (!props.targetQuest) return [];

  const missingIds = new Set<string>();

  function collectPrereqs(questId: string) {
    const q = milestoneStore.quests.find((x) => x.id === questId);
    if (!q) return;

    for (const prereqId of q.requirements.quests) {
      if (!playerStore.completedQuests.includes(prereqId)) {
        missingIds.add(prereqId);
        collectPrereqs(prereqId);
      }
    }
  }

  collectPrereqs(props.targetQuest.id);

  return milestoneStore.quests.filter((q) => missingIds.has(q.id));
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen && targetQuest"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="relative w-full max-w-lg bg-osrs-surface border border-osrs-gold/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <!-- Header -->
        <div class="flex items-start gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-osrs-gold/15 flex items-center justify-center text-osrs-gold flex-shrink-0">
            <AlertTriangle class="w-5 h-5 text-osrs-gold" />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-bold text-white">
              Prerequisite Cascade
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">
              You marked <span class="text-osrs-gold font-semibold">{{ targetQuest.name }}</span> as complete.
            </p>
          </div>
          <button
            @click="emit('close')"
            class="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Missing Prereqs Message -->
        <div class="mb-4 bg-black/30 p-3.5 rounded-xl border border-white/5">
          <p class="text-xs text-gray-300 font-medium mb-2">
            Would you like to mark all {{ missingPrerequisites.length }} prerequisite quests as complete as well?
          </p>
          <div class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            <div
              v-for="q in missingPrerequisites"
              :key="q.id"
              class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <span class="text-gray-200">{{ q.name }}</span>
              <span class="text-[10px] text-osrs-gold font-semibold">{{ q.difficulty }} ({{ q.questPoints }} QP)</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            @click="emit('confirm-all', [targetQuest.id, ...missingPrerequisites.map(q => q.id)])"
            class="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-osrs-gold hover:bg-osrs-gold-light text-black font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all"
          >
            <CheckCheck class="w-4 h-4 text-black" />
            Mark All ({{ missingPrerequisites.length + 1 }}) Complete
          </button>

          <button
            type="button"
            @click="emit('confirm-single', targetQuest.id)"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-osrs-elevated hover:bg-osrs-drawer text-gray-200 font-semibold text-xs border border-white/10 transition-colors"
          >
            Only This Quest
          </button>

          <button
            type="button"
            @click="emit('close')"
            class="w-full sm:w-auto px-3 py-2.5 rounded-xl text-gray-400 hover:text-white text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
