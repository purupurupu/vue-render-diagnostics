import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref, nextTick } from 'vue';
import { VueRenderDiagnostics } from '../plugin/install.ts';
import { useRenderDiagnostics } from '../composables/useRenderDiagnostics.ts';
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

  it('cleans up tracker on unmount without emitting extra log after paint', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = mountWithPlugin(SimpleComponent, {
      pluginOptions: { onLog: (log) => logs.push(log) },
    });

    await flushRaf();
    const mountLogs = logs.length;

    wrapper.unmount();

    expect(logs).toHaveLength(mountLogs);
  });

  it('emits mount log when component unmounts before paint completes', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = mountWithPlugin(SimpleComponent, {
      pluginOptions: { onLog: (log) => logs.push(log) },
      props: { message: 'short-lived' },
    });

    // Unmount before rAF fires — cancels pending paint and emits log immediately
    wrapper.unmount();

    const componentLogs = logsFor(logs, 'SimpleComponent');
    expect(componentLogs).toHaveLength(1);
    expect(componentLogs[0].type).toBe('vrt:component');
    expect(componentLogs[0].metrics.mountTimeMs).toBeGreaterThanOrEqual(0);
    expect(componentLogs[0].metrics.paintTimeMs).toBe(0);

    // Advancing rAF should not emit a second log (callback was cancelled)
    await flushRaf();
    expect(logsFor(logs, 'SimpleComponent')).toHaveLength(1);
  });

  it('emits update log at configured interval', async () => {
    const logs: VRTComponentLog[] = [];

    const Counter = defineComponent({
      name: 'Counter',
      setup() {
        const count = ref(0);
        return { count };
      },
      template: '<div>{{ count }}</div>',
    });

    const wrapper = mount(Counter, {
      global: {
        plugins: [
          [
            VueRenderDiagnostics,
            { updateLogInterval: 3, onLog: (log: VRTComponentLog) => logs.push(log) },
          ],
        ],
      },
    });

    await flushRaf();
    const afterMount = logsFor(logs, 'Counter').length;

    // Trigger 3 updates
    for (let i = 0; i < 3; i++) {
      wrapper.vm.count++;
      await nextTick();
    }

    expect(logsFor(logs, 'Counter').length).toBe(afterMount + 1);

    // Trigger 3 more updates
    for (let i = 0; i < 3; i++) {
      wrapper.vm.count++;
      await nextTick();
    }

    expect(logsFor(logs, 'Counter').length).toBe(afterMount + 2);

    wrapper.unmount();
  });

  it('does not emit update logs when updateLogInterval is not set', async () => {
    const logs: VRTComponentLog[] = [];

    const Counter = defineComponent({
      name: 'Counter2',
      setup() {
        const count = ref(0);
        return { count };
      },
      template: '<div>{{ count }}</div>',
    });

    const wrapper = mount(Counter, {
      global: {
        plugins: [[VueRenderDiagnostics, { onLog: (log: VRTComponentLog) => logs.push(log) }]],
      },
    });

    await flushRaf();
    const afterMount = logsFor(logs, 'Counter2').length;

    for (let i = 0; i < 10; i++) {
      wrapper.vm.count++;
      await nextTick();
    }

    expect(logsFor(logs, 'Counter2').length).toBe(afterMount);

    wrapper.unmount();
  });

  it('isolates filter state between multiple app instances', async () => {
    const logsA: VRTComponentLog[] = [];
    const logsB: VRTComponentLog[] = [];

    // App A includes only SimpleComponent
    mountWithPlugin(SimpleComponent, {
      pluginOptions: {
        include: ['SimpleComponent'],
        onLog: (log) => logsA.push(log),
      },
    });

    // App B excludes SimpleComponent
    mountWithPlugin(SimpleComponent, {
      pluginOptions: {
        exclude: ['SimpleComponent'],
        onLog: (log) => logsB.push(log),
      },
    });

    await flushRaf();

    expect(logsFor(logsA, 'SimpleComponent')).toHaveLength(1);
    expect(logsFor(logsB, 'SimpleComponent')).toHaveLength(0);
  });
});

describe('useRenderDiagnostics composable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does nothing without plugin installed', () => {
    const TestComp = defineComponent({
      setup() {
        useRenderDiagnostics();
      },
      template: '<div />',
    });

    // Should not throw
    const wrapper = mount(TestComp);
    wrapper.unmount();
  });

  it('opts in a component that would be excluded by filters', async () => {
    const logs: VRTComponentLog[] = [];

    const TrackedComp = defineComponent({
      name: 'TrackedComp',
      setup() {
        useRenderDiagnostics();
      },
      template: '<div />',
    });

    mount(TrackedComp, {
      global: {
        plugins: [
          [
            VueRenderDiagnostics,
            {
              include: ['SomethingElse'],
              onLog: (log: VRTComponentLog) => logs.push(log),
            },
          ],
        ],
      },
    });

    await flushRaf();

    const componentLogs = logsFor(logs, 'TrackedComp');
    expect(componentLogs).toHaveLength(1);
  });
});
