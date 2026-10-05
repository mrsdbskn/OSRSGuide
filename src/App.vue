<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterView } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import TopMilestoneHud from '@/components/TopMilestoneHud.vue';
import CommandPalette from '@/components/CommandPalette.vue';
import ImportExportModal from '@/components/ImportExportModal.vue';

const isCommandPaletteOpen = ref(false);
const isImportOpen = ref(false);

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    isCommandPaletteOpen.value = !isCommandPaletteOpen.value;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <div class="min-h-screen bg-osrs-base text-gray-100 flex flex-col font-sans selection:bg-osrs-gold selection:text-black">
    <!-- Header -->
    <AppHeader @open-import="isImportOpen = true" />

    <!-- Sticky Top Milestone HUD -->
    <TopMilestoneHud @open-command-palette="isCommandPaletteOpen = true" />

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <RouterView />
    </main>

    <!-- Global Command Palette (Ctrl+K) -->
    <CommandPalette
      :is-open="isCommandPaletteOpen"
      @close="isCommandPaletteOpen = false"
    />

    <!-- Import / Export Modal -->
    <ImportExportModal
      :is-open="isImportOpen"
      @close="isImportOpen = false"
    />

    <!-- Footer -->
    <footer class="border-t border-white/5 bg-black/40 py-8 text-center text-xs text-gray-400">
      <div class="max-w-7xl mx-auto px-4 space-y-2">
        <p>
          Old School RuneScape is a trademark of Jagex Limited. This application is an unofficial open-source progress tracker.
        </p>
        <p class="text-gray-400">
          Powered by Vue 3, Pinia, Tailwind CSS & Wise Old Man API. Optimized for GitHub Pages.
        </p>
      </div>
    </footer>
  </div>
</template>
