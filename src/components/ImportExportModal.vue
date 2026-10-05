<script setup lang="ts">
import { ref } from 'vue';
import { usePlayerStore } from '@/stores/playerStore';
import { X, Upload, Download, Check, AlertCircle } from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const playerStore = usePlayerStore();
const jsonInput = ref('');
const errorMsg = ref('');
const successMsg = ref('');

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
    errorMsg.value = 'Failed to parse JSON. Please check the format.';
  }
}

function handleExport() {
  const data = playerStore.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `osrs-progress-${playerStore.rsn || 'profile'}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="relative w-full max-w-lg bg-osrs-surface border border-osrs-gold/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <Upload class="w-4 h-4 text-osrs-gold" />
            <span>Import / Export Data</span>
          </h3>
          <button
            @click="emit('close')"
            class="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-gray-400 mb-4">
          Import progress from a previous export or RuneLite Quest Helper JSON backup. You can also export your current setup to safely save it offline.
        </p>

        <!-- Status alerts -->
        <div v-if="successMsg" class="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <Check class="w-4 h-4" />
          <span>{{ successMsg }}</span>
        </div>

        <div v-if="errorMsg" class="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4" />
          <span>{{ errorMsg }}</span>
        </div>

        <!-- JSON Textarea -->
        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-300 mb-1.5">
            Paste JSON Data
          </label>
          <textarea
            v-model="jsonInput"
            rows="6"
            placeholder='{"completedQuests": ["cooks-assistant", "dragon-slayer-i"], "skills": {"Attack": 70, "Strength": 75}}'
            class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-osrs-gold/50"
          />
        </div>

        <!-- Buttons -->
        <div class="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            @click="handleImport"
            class="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-osrs-gold hover:bg-osrs-gold-light text-black font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all"
          >
            <Upload class="w-4 h-4 text-black" />
            Import JSON
          </button>

          <button
            type="button"
            @click="handleExport"
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-osrs-elevated hover:bg-osrs-drawer text-gray-200 font-semibold text-xs border border-white/10 transition-colors"
          >
            <Download class="w-4 h-4 text-osrs-gold" />
            Export Backup
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>
