<script setup lang="ts">
import { ref, defineComponent, h, KeepAlive } from 'vue';

const TabA = defineComponent({
  name: 'TabA',
  setup() {
    const clicks = ref(0);
    return { clicks };
  },
  template: '<div><button @click="clicks++">Tab A clicks: {{ clicks }}</button></div>',
});

const TabB = defineComponent({
  name: 'TabB',
  template: '<div>Tab B content</div>',
});

const current = ref<'A' | 'B'>('A');
</script>

<template>
  <div>
    <button @click="current = 'A'" :disabled="current === 'A'">Tab A</button>
    <button @click="current = 'B'" :disabled="current === 'B'">Tab B</button>
    <KeepAlive>
      <component :is="current === 'A' ? TabA : TabB" />
    </KeepAlive>
  </div>
</template>
