import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { VueRenderDiagnostics } from '../plugin/install.ts';
import { useRenderDiagnostics } from '../composables/useRenderDiagnostics.ts';
import { clearFilterCache } from '../plugin/lifecycle-tracker.ts';
import type { VRTComponentLog } from '../types.ts';
import SimpleComponent from './fixtures/SimpleComponent.vue';
import UpdatingComponent from './fixtures/UpdatingComponent.vue';

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

describe('VueRenderDiagnostics plugin', () => {
  beforeEach(() => {
    clearFilterCache();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits log on component unmount', () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = mountWithPlugin(SimpleComponent, {
      pluginOptions: { onLog: (log) => logs.push(log) },
      props: { message: 'hello' },
    });

    wrapper.unmount();

    const componentLogs = logsFor(logs, 'SimpleComponent');
    expect(componentLogs).toHaveLength(1);
    expect(componentLogs[0].type).toBe('vrt:unmount');
    expect(componentLogs[0].metrics.mountTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('tracks update metrics', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = mountWithPlugin(UpdatingComponent, {
      pluginOptions: { onLog: (log) => logs.push(log) },
    });

    wrapper.vm.increment();
    await nextTick();

    wrapper.vm.increment();
    await nextTick();

    wrapper.unmount();

    const componentLogs = logsFor(logs, 'UpdatingComponent');
    expect(componentLogs).toHaveLength(1);
    expect(componentLogs[0].metrics.updateCount).toBe(2);
    expect(componentLogs[0].signals.dataUpdateDetected).toBe(true);
  });

  it('does not track when enabled is false', () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = mountWithPlugin(SimpleComponent, {
      pluginOptions: { enabled: false, onLog: (log) => logs.push(log) },
    });

    wrapper.unmount();
    expect(logs).toHaveLength(0);
  });

  it('respects include filter', () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = mountWithPlugin(SimpleComponent, {
      pluginOptions: {
        include: ['NonExistentComponent'],
        onLog: (log) => logs.push(log),
      },
    });

    wrapper.unmount();
    const componentLogs = logsFor(logs, 'SimpleComponent');
    expect(componentLogs).toHaveLength(0);
  });

  it('respects exclude filter', () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = mountWithPlugin(SimpleComponent, {
      pluginOptions: {
        exclude: ['SimpleComponent'],
        onLog: (log) => logs.push(log),
      },
    });

    wrapper.unmount();
    const componentLogs = logsFor(logs, 'SimpleComponent');
    expect(componentLogs).toHaveLength(0);
  });

  it('logs to console by default', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const wrapper = mountWithPlugin(SimpleComponent);

    wrapper.unmount();

    expect(consoleSpy).toHaveBeenCalledWith('[VRT]', expect.any(String));
  });

  it('does not log to console when logToConsole is false', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const wrapper = mountWithPlugin(SimpleComponent, {
      pluginOptions: { logToConsole: false },
    });

    wrapper.unmount();
    expect(consoleSpy).not.toHaveBeenCalledWith('[VRT]', expect.any(String));
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

    // metrics available right after mount, before unmount
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
