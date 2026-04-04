<template>
  <ul>
    <li v-for="i in items" :key="i">Item {{ i }}</li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ items: number }>();
</script>
