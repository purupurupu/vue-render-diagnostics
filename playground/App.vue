<script setup lang="ts">
import { ref } from 'vue';
import { useRenderDiagnostics } from '../src/index.ts';
import HeavyList from './HeavyList.vue';

// Opt-in App component for VRT tracking
useRenderDiagnostics();

const count = ref(0);
const showHeavy = ref(false);
</script>

<template>
  <div>
    <h1>VRT Playground</h1>
    <p>Open the browser console to see [VRT] logs.</p>

    <button @click="count++">Count: {{ count }}</button>

    <button @click="showHeavy = !showHeavy">
      {{ showHeavy ? 'Hide' : 'Show' }} Heavy Component
    </button>

    <HeavyList v-if="showHeavy" :items="500" />
  </div>
</template>
