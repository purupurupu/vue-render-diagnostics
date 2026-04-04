import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { VueRenderDiagnostics } from '../plugin/install.ts';
import { useRenderDiagnostics } from '../composables/useRenderDiagnostics.ts';
import { clearFilterCache } from '../plugin/lifecycle-tracker.ts';
import type { VRTComponentLog } from '../types.ts';
import SimpleComponent from './fixtures/SimpleComponent.vue';

function mountWithPlugin<T extends Record<string, unknown>>(
  component: Parameters<typeof mount>[0],
  options?: { pluginOptions?: Parameters<typeof VueRenderDiagnostics.install>[1]; props?: T },
) {
  return mount(component, {
    props: options?.props,
    global: {
      plugins: [[VueRenderDiagnostics, options?.pluginOptions ?? {}]],
    },
  });
}

function logsFor(logs: VRTComponentLog[], name: string): VRTComponentLog[] {
  return logs.filter((l) => l.component === name);
}

async function flushRaf(): Promise<void> {
  await vi.advanceTimersToNextFrame();
  await vi.advanceTimersToNextFrame();
}

describe('VueRenderDiagnostics plugin', () => {
  beforeEach(() => {
    clearFilterCache();
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('emits log after mount paint completion', async () => {
    const logs: VRTComponentLog[] = [];
    mountWithPlugin(SimpleComponent, {
      pluginOptions: { onLog: (log) => logs.push(log) },
      props: { message: 'hello' },
    });

    await flushRaf();

    const componentLogs = logsFor(logs, 'SimpleComponent');
    expect(componentLogs).toHaveLength(1);
    expect(componentLogs[0].type).toBe('vrt:component');
    expect(componentLogs[0].metrics.mountTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('tracks update metrics via composable', async () => {
    const TestComp = defineComponent({
      name: 'UpdateTracker',
      setup() {
        const { metrics } = useRenderDiagnostics();
        const count = ref(0);
        return { metrics, count };
      },
      template: '<div>{{ count }}</div>',
    });

    const wrapper = mount(TestComp, {
      global: {
        plugins: [[VueRenderDiagnostics, { logToConsole: false }]],
      },
    });

    wrapper.vm.count = 1;
    await nextTick();
    expect(wrapper.vm.metrics!.updateCount).toBe(1);

    wrapper.vm.count = 2;
    await nextTick();
    expect(wrapper.vm.metrics!.updateCount).toBe(2);
    expect(wrapper.vm.metrics!.avgUpdateMs).toBeGreaterThanOrEqual(0);

    wrapper.unmount();
  });

  it('does not track when enabled is false', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = mountWithPlugin(SimpleComponent, {
      pluginOptions: { enabled: false, onLog: (log) => logs.push(log) },
    });

    await flushRaf();
    wrapper.unmount();
    expect(logs).toHaveLength(0);
  });

  it('respects include filter', async () => {
    const logs: VRTComponentLog[] = [];
    mountWithPlugin(SimpleComponent, {
      pluginOptions: {
        include: ['NonExistentComponent'],
        onLog: (log) => logs.push(log),
      },
    });

    await flushRaf();
    const componentLogs = logsFor(logs, 'SimpleComponent');
    expect(componentLogs).toHaveLength(0);
  });

  it('respects exclude filter', async () => {
    const logs: VRTComponentLog[] = [];
    mountWithPlugin(SimpleComponent, {
      pluginOptions: {
        exclude: ['SimpleComponent'],
        onLog: (log) => logs.push(log),
      },
    });

    await flushRaf();
    const componentLogs = logsFor(logs, 'SimpleComponent');
    expect(componentLogs).toHaveLength(0);
  });

  it('logs to console after mount', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    mountWithPlugin(SimpleComponent);

    await flushRaf();

    expect(consoleSpy).toHaveBeenCalledWith('[VRT]', expect.any(String));
  });

  it('does not log to console when logToConsole is false', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    mountWithPlugin(SimpleComponent, {
      pluginOptions: { logToConsole: false },
    });

    await flushRaf();
    expect(consoleSpy).not.toHaveBeenCalledWith('[VRT]', expect.any(String));
  });

  it('cleans up tracker on unmount without emitting log', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = mountWithPlugin(SimpleComponent, {
      pluginOptions: { onLog: (log) => logs.push(log) },
    });

    await flushRaf();
    const mountLogs = logs.length;

    wrapper.unmount();

    // no additional log emitted on unmount
    expect(logs).toHaveLength(mountLogs);
  });
});

describe('useRenderDiagnostics composable', () => {
  beforeEach(() => {
    clearFilterCache();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null metrics without plugin installed', () => {
    const TestComp = defineComponent({
      setup() {
        const { metrics, issues } = useRenderDiagnostics();
        return { metrics, issues };
      },
      template: '<div />',
    });

    const wrapper = mount(TestComp);
    expect(wrapper.vm.metrics).toBeNull();
    expect(wrapper.vm.issues).toEqual([]);
    wrapper.unmount();
  });

  it('provides metrics immediately after mount', () => {
    const TestComp = defineComponent({
      name: 'ComposableTest',
      setup() {
        const { metrics, issues } = useRenderDiagnostics();
        return { metrics, issues };
      },
      template: '<div />',
    });

    const wrapper = mount(TestComp, {
      global: {
        plugins: [[VueRenderDiagnostics, { logToConsole: false }]],
      },
    });

    expect(wrapper.vm.metrics).not.toBeNull();
    expect(wrapper.vm.metrics!.mountTimeMs).toBeGreaterThanOrEqual(0);
    wrapper.unmount();
  });

  it('updates metrics reactively on each update', async () => {
    const TestComp = defineComponent({
      name: 'ReactiveTest',
      setup() {
        const { metrics, issues } = useRenderDiagnostics();
        const count = ref(0);
        return { metrics, issues, count };
      },
      template: '<div>{{ count }}</div>',
    });

    const wrapper = mount(TestComp, {
      global: {
        plugins: [[VueRenderDiagnostics, { logToConsole: false }]],
      },
    });

    expect(wrapper.vm.metrics!.updateCount).toBe(0);

    wrapper.vm.count = 1;
    await nextTick();
    expect(wrapper.vm.metrics!.updateCount).toBe(1);

    wrapper.vm.count = 2;
    await nextTick();
    expect(wrapper.vm.metrics!.updateCount).toBe(2);

    wrapper.unmount();
  });
});
