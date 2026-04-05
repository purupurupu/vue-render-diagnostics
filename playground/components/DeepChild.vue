<script setup lang="ts">
import { onMounted } from 'vue';

defineProps<{ depth: number; slowMs?: number }>();

onMounted(() => {
  // Simulate slow setup at deepest level
});
</script>

<template>
  <div class="depth">
    <span>Depth {{ depth }}</span>
    <DeepChild v-if="depth > 1" :depth="depth - 1" :slow-ms="slowMs" />
  </div>
</template>
