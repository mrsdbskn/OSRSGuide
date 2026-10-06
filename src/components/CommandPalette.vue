<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMilestoneStore } from '@/stores/milestoneStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useBodyScrollLock } from '@/composables/useBodyScrollLock';
import { Search, X, Scroll, BookOpen, Swords, CheckCircle2 } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

useBodyScrollLock(computed(() => props.isOpen));

const router = useRouter();
const milestoneStore = useMilestoneStore();
const playerStore = usePlayerStore();

const query = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      query.value = '';
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  }
);

interface SearchResult {
  id: string;
  type: 'quest' | 'diary' | 'combat';
  title: string;
  subtitle: string;
  route: string;
  completed: boolean;
}

const filteredResults = computed<SearchResult[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) {
    // Show top suggestions
    return [
      ...milestoneStore.quests.slice(0, 3).map((quest) => ({
        id: quest.id,
        type: 'quest' as const,
        title: quest.name,
        subtitle: `${quest.difficulty} • ${quest.questPoints} QP`,
        route: `/quests?highlight=${quest.id}`,
        completed: playerStore.isQuestCompleted(quest.id),
      })),
      ...milestoneStore.diaries.slice(0, 3).map((diary) => ({
        id: diary.id,
        type: 'diary' as const,
        title: `${diary.name} Diary`,
        subtitle: diary.rewardItemName,
        route: `/diaries?region=${diary.id}`,
        completed: (['Easy', 'Medium', 'Hard', 'Elite'] as const).every((t) =>
          diary.tiers[t]?.tasks.every((task: { id: string }) => playerStore.completedDiaryTasks.includes(task.id))
        ),
      })),
    ];
  }

  const results: SearchResult[] = [];

  // Search Quests
  for (const quest of milestoneStore.quests) {
    if (quest.name.toLowerCase().includes(q) || quest.difficulty.toLowerCase().includes(q)) {
      results.push({
        id: quest.id,
        type: 'quest',
        title: quest.name,
        subtitle: `${quest.difficulty} • ${quest.questPoints} QP`,
        route: `/quests?highlight=${quest.id}`,
        completed: playerStore.isQuestCompleted(quest.id),
      });
    }
  }

  // Search Diaries (Regions and Tasks)
  for (const diary of milestoneStore.diaries) {
    if (diary.name.toLowerCase().includes(q) || diary.rewardItemName.toLowerCase().includes(q)) {
      results.push({
        id: diary.id,
        type: 'diary',
        title: `${diary.name} Diary`,
        subtitle: diary.rewardItemName,
        route: `/diaries?region=${diary.id}`,
        completed: false,
      });
    }
  }

  // Search Combat Tasks / Bosses
  for (const ca of milestoneStore.combatTasks) {
    if (ca.name.toLowerCase().includes(q) || ca.monster.toLowerCase().includes(q) || ca.type.toLowerCase().includes(q)) {
      results.push({
        id: ca.id,
        type: 'combat',
        title: ca.name,
        subtitle: `${ca.monster} • ${ca.tier} (+${ca.points} pts)`,
        route: `/combat-achievements?search=${encodeURIComponent(ca.monster)}`,
        completed: playerStore.isCombatTaskCompleted(ca.id),
      });
    }
  }

  return results.slice(0, 15);
});

function handleSelect(item: SearchResult) {
  emit('close');
  router.push(item.route);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm overscroll-contain"
      @click.self="emit('close')"
      @touchmove.prevent
    >
      <div
        class="relative w-full max-w-xl bg-osrs-surface border border-osrs-gold/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all animate-in fade-in zoom-in-95 duration-150 overscroll-contain"
      >
        <!-- Search Input Bar -->
        <div class="flex items-center px-4 py-3.5 border-b border-white/10 bg-osrs-elevated/80 gap-3">
          <Search class="w-5 h-5 text-osrs-gold flex-shrink-0" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="Search quests, diaries, CA bosses (e.g. Vorkath, Falador)..."
            class="w-full bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none"
          />
          <button
            v-if="query"
            @click="query = ''"
            class="p-1 rounded-md text-gray-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </button>
          <kbd class="hidden sm:inline-block bg-black/50 text-gray-400 px-2 py-0.5 rounded text-[11px] font-mono border border-white/10">
            ESC
          </kbd>
        </div>

        <!-- Search Results List -->
        <div class="overflow-y-auto p-2 divide-y divide-white/5 space-y-1 overscroll-contain">
          <div
            v-for="item in filteredResults"
            :key="item.id"
            @click="handleSelect(item)"
            class="flex items-center justify-between p-2.5 rounded-xl hover:bg-osrs-elevated cursor-pointer group transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
              <!-- Type Icon -->
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="{
                  'bg-blue-500/10 text-blue-400': item.type === 'quest',
                  'bg-emerald-500/10 text-emerald-400': item.type === 'diary',
                  'bg-amber-500/10 text-osrs-gold': item.type === 'combat',
                }"
              >
                <Scroll v-if="item.type === 'quest'" class="w-4 h-4" />
                <BookOpen v-else-if="item.type === 'diary'" class="w-4 h-4" />
                <Swords v-else class="w-4 h-4" />
              </div>

              <!-- Title & Subtitle -->
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-gray-200 group-hover:text-osrs-gold transition-colors truncate">
                    {{ item.title }}
                  </span>
                  <span
                    v-if="item.completed"
                    class="text-[10px] font-bold text-osrs-completed bg-osrs-completed/10 px-1.5 py-0.2 rounded border border-osrs-completed/20"
                  >
                    Done
                  </span>
                </div>
                <span class="text-xs text-gray-400 block truncate">
                  {{ item.subtitle }}
                </span>
              </div>
            </div>

            <!-- Action hint -->
            <span class="text-[11px] text-gray-500 group-hover:text-gray-300 font-medium">
              Jump →
            </span>
          </div>

          <div
            v-if="filteredResults.length === 0"
            class="p-8 text-center text-gray-400 text-sm"
          >
            No results found for "<span class="text-osrs-gold">{{ query }}</span>"
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
          <span>Search OSRS Milestones</span>
          <div class="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
