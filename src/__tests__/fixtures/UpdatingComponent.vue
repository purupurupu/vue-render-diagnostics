<template>
  <div>{{ value }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const value = ref(0);

function increment() {
  value.value++;
}

defineExpose({ increment });
</script>
