<script setup lang="ts">
import { ref, defineComponent } from 'vue';
import { useRenderDiagnostics } from '../src/index.ts';
import DeepChild from './components/DeepChild.vue';
import FrequentUpdater from './components/FrequentUpdater.vue';
import HeavyList from './components/HeavyList.vue';
import KeepAliveDemo from './components/KeepAliveDemo.vue';
import MetricsViewer from './components/MetricsViewer.vue';

useRenderDiagnostics();

const showSection = ref<Record<string, boolean>>({
  nested: false,
  updates: false,
  heavy: false,
  keepalive: false,
  toggle: false,
  anonymous: false,
  metrics: false,
});

const toggle = (key: string) => {
  showSection.value[key] = !showSection.value[key];
};

// Anonymous component (no name, no SFC)
const AnonComponent = defineComponent({
  template: '<div>I have no name</div>',
});
</script>

<template>
  <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: system-ui">
    <h1>VRD Playground</h1>
    <p>Open the browser console to see <code>[VRD]</code> logs.</p>
    <p style="color: #666">
      Each section tests a different scenario. Toggle them and watch the console.
    </p>

    <hr />

    <section>
      <h2>
        <button @click="toggle('nested')">{{ showSection.nested ? 'Hide' : 'Show' }}</button>
        Deep Nesting (Parent → Child → Grandchild)
      </h2>
      <p>Watch how <code>mountTimeMs</code> accumulates up the tree.</p>
      <div v-if="showSection.nested">
        <DeepChild :depth="4" />
      </div>
    </section>

    <section>
      <h2>
        <button @click="toggle('updates')">{{ showSection.updates ? 'Hide' : 'Show' }}</button>
        Frequent Updates (10/sec)
      </h2>
      <p>
        Set <code>updateLogInterval</code> in plugin options to see periodic update logs. Without
        it, only mount logs appear.
      </p>
      <div v-if="showSection.updates">
        <FrequentUpdater />
      </div>
    </section>

    <section>
      <h2>
        <button @click="toggle('heavy')">{{ showSection.heavy ? 'Hide' : 'Show' }}</button>
        Heavy DOM (1000 nodes)
      </h2>
      <p>
        Should trigger <code>large-dom</code> issue if nodeCount exceeds threshold (default: 1500).
      </p>
      <div v-if="showSection.heavy">
        <HeavyList :items="2000" />
      </div>
    </section>

    <section>
      <h2>
        <button @click="toggle('keepalive')">{{ showSection.keepalive ? 'Hide' : 'Show' }}</button>
        KeepAlive Tabs
      </h2>
      <p>
        Switch tabs to see <code>activated</code>/<code>deactivated</code> logs. State is preserved.
      </p>
      <div v-if="showSection.keepalive">
        <KeepAliveDemo />
      </div>
    </section>

    <section>
      <h2>
        <button @click="toggle('toggle')">{{ showSection.toggle ? 'Hide' : 'Show' }}</button>
        v-if Toggle (mount/unmount cycle)
      </h2>
      <p>Toggle rapidly to test mount → unmount → remount. Check for duplicate logs.</p>
      <div v-if="showSection.toggle">
        <HeavyList :items="100" />
      </div>
    </section>

    <section>
      <h2>
        <button @click="toggle('anonymous')">{{ showSection.anonymous ? 'Hide' : 'Show' }}</button>
        Anonymous Component
      </h2>
      <p>
        Component with no <code>name</code>. Should appear as <code>Anonymous#uid</code> in logs.
      </p>
      <div v-if="showSection.anonymous">
        <AnonComponent />
      </div>
    </section>

    <section>
      <h2>
        <button @click="toggle('metrics')">{{ showSection.metrics ? 'Hide' : 'Show' }}</button>
        useRenderMetrics (Programmatic Access)
      </h2>
      <p>Click "Refresh Metrics" to see current metrics via <code>peek()</code>.</p>
      <div v-if="showSection.metrics">
        <MetricsViewer />
      </div>
    </section>
  </div>
</template>
