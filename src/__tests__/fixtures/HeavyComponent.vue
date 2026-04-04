<template>
  <div>
    <span v-for="i in count" :key="i">{{ i }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ count?: number }>();
</script>
