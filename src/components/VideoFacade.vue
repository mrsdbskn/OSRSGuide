<script setup lang="ts">
import { ref, computed } from 'vue';
import { Play, VideoOff } from 'lucide-vue-next';

const props = defineProps<{
  videoId?: string | null;
  title?: string;
  aspectRatio?: string;
}>();

const isPlaying = ref(false);

const thumbnailUrl = computed(() => {
  if (!props.videoId) return '';
  return `https://i.ytimg.com/vi/${props.videoId}/hqdefault.jpg`;
});

const embedUrl = computed(() => {
  if (!props.videoId) return '';
  return `https://www.youtube-nocookie.com/embed/${props.videoId}?autoplay=1&rel=0`;
});

function handlePlay() {
  if (props.videoId) {
    isPlaying.value = true;
  }
}
</script>

<template>
  <div class="relative w-full rounded-xl overflow-hidden bg-osrs-surface border border-white/5 shadow-md">
    <!-- Active YouTube Embed -->
    <div v-if="isPlaying && videoId" class="relative w-full aspect-video">
      <iframe
        :src="embedUrl"
        :title="title || 'YouTube video player'"
        class="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
    </div>

    <!-- Video Available Facade -->
    <div
      v-else-if="videoId"
      @click="handlePlay"
      class="group relative w-full aspect-video cursor-pointer overflow-hidden bg-black/60 flex items-center justify-center select-none"
    >
      <!-- YouTube Thumbnail -->
      <img
        :src="thumbnailUrl"
        :alt="title || 'Video guide thumbnail'"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-85 group-hover:opacity-100"
        loading="lazy"
      />

      <!-- Subtle Dark Overlay Gradient -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 group-hover:from-black/60 transition-colors" />

      <!-- Center Play Button (Material 3 Style) -->
      <div class="absolute flex flex-col items-center gap-2 transform transition-transform duration-200 group-hover:scale-110">
        <div class="w-14 h-14 rounded-full bg-osrs-gold/90 text-black flex items-center justify-center shadow-gold-glow transition-all duration-300 group-hover:bg-osrs-gold group-hover:shadow-gold-glow-lg">
          <Play class="w-7 h-7 fill-black ml-1 text-black" />
        </div>
        <span class="text-xs font-semibold uppercase tracking-wider text-gray-200 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
          Watch Guide
        </span>
      </div>

      <!-- Video Duration / Guide Label in corner -->
      <div class="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-gray-300 pointer-events-none">
        <span class="truncate font-medium drop-shadow">{{ title || 'Video Guide' }}</span>
        <span class="bg-black/80 text-osrs-gold text-[10px] font-bold px-2 py-0.5 rounded tracking-wide border border-osrs-gold/30">
          YouTube
        </span>
      </div>
    </div>

    <!-- Pending Video Badge -->
    <div
      v-else
      class="w-full aspect-video bg-osrs-elevated/40 flex flex-col items-center justify-center p-6 text-center border border-dashed border-white/10"
    >
      <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 mb-2">
        <VideoOff class="w-6 h-6" />
      </div>
      <span class="text-sm font-semibold text-gray-300">Video Guide: Pending</span>
      <p class="text-xs text-gray-500 mt-1 max-w-xs">
        Official walkthrough video will be linked here once published.
      </p>
    </div>
  </div>
</template>
