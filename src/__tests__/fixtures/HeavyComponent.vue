<script setup lang="ts">
defineProps<{ count?: number }>();
</script>

<template>
  <div>
    <span v-for="i in count" :key="i">{{ i }}</span>
  </div>
</template>
