<script setup lang="ts">
import { ref } from 'vue';
import { useRenderDiagnostics } from '../src/index.ts';
import HeavyList from './HeavyList.vue';

const count = ref(0);
const showHeavy = ref(false);
const { metrics, issues } = useRenderDiagnostics('App');
</script>

<template>
  <div>
    <h1>VRT Playground</h1>

    <button @click="count++">Count: {{ count }}</button>

    <button @click="showHeavy = !showHeavy">
      {{ showHeavy ? 'Hide' : 'Show' }} Heavy Component
    </button>

    <HeavyList v-if="showHeavy" :items="500" />

    <section v-if="metrics">
      <h2>Real-time Metrics (App)</h2>
      <table>
        <tr><td>mountTimeMs</td><td>{{ metrics.mountTimeMs.toFixed(2) }}</td></tr>
        <tr><td>paintTimeMs</td><td>{{ metrics.paintTimeMs.toFixed(2) }}</td></tr>
        <tr><td>updateCount</td><td>{{ metrics.updateCount }}</td></tr>
        <tr><td>avgUpdateMs</td><td>{{ metrics.avgUpdateMs.toFixed(2) }}</td></tr>
        <tr><td>maxUpdateMs</td><td>{{ metrics.maxUpdateMs.toFixed(2) }}</td></tr>
        <tr><td>nodeCount</td><td>{{ metrics.nodeCount }}</td></tr>
      </table>
    </section>

    <section v-if="issues.length > 0">
      <h2>Issues</h2>
      <ul>
        <li v-for="issue in issues" :key="issue.id">
          [{{ issue.severity }}] {{ issue.id }}: {{ issue.metric }} = {{ issue.value }}
        </li>
      </ul>
    </section>
  </div>
</template>
