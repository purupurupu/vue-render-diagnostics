<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRenderMetrics } from '../../src/index.ts';

const metrics = useRenderMetrics();
const snapshot = ref<ReturnType<NonNullable<typeof metrics>['peek']>>(null);

const refresh = () => {
  snapshot.value = metrics?.peek() ?? null;
};

onMounted(refresh);
</script>

<template>
  <div>
    <button @click="refresh">Refresh Metrics</button>
    <pre v-if="snapshot">{{ JSON.stringify(snapshot.metrics, null, 2) }}</pre>
    <p v-else>No metrics available</p>
  </div>
</template>
