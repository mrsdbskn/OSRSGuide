<script setup lang="ts">
import { computed } from 'vue';
import type { CombatTask } from '@/types/osrs';
import { usePlayerStore } from '@/stores/playerStore';
import { useMilestoneStore, CA_THRESHOLDS } from '@/stores/milestoneStore';
import { getCATierSwordSprite, handleImageFallback } from '@/utils/assets';
import { fireMilestoneConfetti } from '@/utils/confetti';
import { CheckCircle2, Circle } from 'lucide-vue-next';

const props = defineProps<{
  task: CombatTask;
}>();

const playerStore = usePlayerStore();
const milestoneStore = useMilestoneStore();

const isCompleted = computed(() => playerStore.isCombatTaskCompleted(props.task.id));

const tierColor = computed(() => {
  switch (props.task.tier) {
    case 'Easy':
      return 'text-amber-600 bg-amber-600/10 border-amber-600/20';
    case 'Medium':
      return 'text-gray-300 bg-gray-400/10 border-gray-400/20';
    case 'Hard':
      return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    case 'Elite':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'Master':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'Grandmaster':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    default:
      return 'text-gray-300 bg-gray-500/10 border-gray-500/20';
  }
});

const typeColor = computed(() => {
  switch (props.task.type) {
    case 'Kill Count':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'Perfection':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'Restriction':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'Speed':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'Stamina':
      return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
    default:
      return 'text-gray-400 bg-white/5 border-white/10';
  }
});

function handleToggle() {
  const currentPts = milestoneStore.completedCombatPoints;
  const wasComp = isCompleted.value;

  playerStore.toggleCombatTask(props.task.id);

  if (!wasComp) {
    const newPts = currentPts + props.task.points;
    // Check if new threshold reached
    for (const t of CA_THRESHOLDS) {
      if (currentPts < t.points && newPts >= t.points) {
        fireMilestoneConfetti(`Combat Achievements ${t.tier} Tier Unlocked!`);
        break;
      }
    }
  }
}
</script>

<template>
  <div
    @click="handleToggle"
    class="group card-hover relative flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all"
    :class="[
      isCompleted
        ? 'bg-osrs-completed/5 border-osrs-completed/30 shadow-sm'
        : 'bg-osrs-surface/90 hover:bg-osrs-elevated border-white/5 hover:border-white/15'
    ]"
  >
    <!-- Left: Checkbox + Sword Icon + Task Info -->
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <!-- Checkbox -->
      <div class="flex-shrink-0">
        <CheckCircle2
          v-if="isCompleted"
          class="w-5 h-5 text-osrs-completed transition-transform group-hover:scale-110"
        />
        <Circle
          v-else
          class="w-5 h-5 text-gray-500 group-hover:text-osrs-gold transition-colors"
        />
      </div>

      <!-- Tier Sword Sprite -->
      <div class="w-6 h-6 flex-shrink-0 flex items-center justify-center">
        <img
          :src="getCATierSwordSprite(task.tier)"
          :alt="task.tier"
          class="w-5 h-5 object-contain drop-shadow transition-transform group-hover:scale-110"
          @error="(e) => handleImageFallback(e, 'sword')"
        />
      </div>

      <!-- Task Details -->
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
          <span
            class="font-semibold text-xs sm:text-sm text-gray-100 group-hover:text-osrs-gold transition-colors truncate"
            :class="{ 'line-through text-gray-400': isCompleted }"
          >
            {{ task.name }}
          </span>

          <!-- Monster Badge -->
          <span class="text-[10px] font-medium bg-black/40 text-gray-300 px-2 py-0.5 rounded border border-white/5">
            {{ task.monster }}
          </span>

          <!-- Task Type Badge -->
          <span
            class="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
            :class="typeColor"
          >
            {{ task.type }}
          </span>
        </div>

        <p
          class="text-xs text-gray-400 line-clamp-2"
          :class="{ 'text-gray-500': isCompleted }"
        >
          {{ task.description }}
        </p>
      </div>
    </div>

    <!-- Right: Points Badge & Tier -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <span
        class="text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 shadow-sm"
        :class="tierColor"
      >
        <span>+{{ task.points }}</span>
        <span class="text-[10px] uppercase tracking-wider font-semibold opacity-80">{{ task.tier }}</span>
      </span>
    </div>
  </div>
</template>
