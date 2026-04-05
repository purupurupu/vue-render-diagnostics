<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const count = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => count.value++, 100);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div>Updates: {{ count }}</div>
</template>
