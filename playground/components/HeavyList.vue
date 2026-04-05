<script setup lang="ts">
defineProps<{ items: number }>();
</script>

<template>
  <ul>
    <li v-for="i in items" :key="i">Item {{ i }}</li>
  </ul>
</template>
