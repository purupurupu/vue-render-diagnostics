import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref, nextTick, KeepAlive, h } from 'vue';
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

    // Unmount before rAF fires — cancels pending paint and emits log via flush
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

describe('KeepAlive activated/deactivated hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createKeepAliveWrapper(logs: VRTComponentLog[]) {
    const ChildA = defineComponent({
      name: 'ChildA',
      template: '<div>A</div>',
    });

    const ChildB = defineComponent({
      name: 'ChildB',
      template: '<div>B</div>',
    });

    const Wrapper = defineComponent({
      name: 'KAWrapper',
      setup() {
        const current = ref('ChildA');
        return { current };
      },
      render() {
        return h(KeepAlive, null, {
          default: () => h(this.current === 'ChildA' ? ChildA : ChildB),
        });
      },
    });

    return mount(Wrapper, {
      global: {
        plugins: [[VueRenderDiagnostics, { onLog: (log: VRTComponentLog) => logs.push(log) }]],
      },
    });
  }

  it('emits log on deactivation', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = createKeepAliveWrapper(logs);

    await flushRaf();
    const afterMount = logsFor(logs, 'ChildA').length;

    // Switch to ChildB — deactivates ChildA
    wrapper.vm.current = 'ChildB';
    await nextTick();
    await flushRaf();

    // Deactivation should have emitted a log for ChildA
    expect(logsFor(logs, 'ChildA').length).toBe(afterMount + 1);

    wrapper.unmount();
  });

  it('re-initializes tracker on reactivation after flush', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = createKeepAliveWrapper(logs);

    await flushRaf();

    // Deactivate ChildA (flushes tracker)
    wrapper.vm.current = 'ChildB';
    await nextTick();
    await flushRaf();

    // Reactivate ChildA — tracker was flushed, activated should re-init
    wrapper.vm.current = 'ChildA';
    await nextTick();
    await flushRaf();

    // Deactivate again — should emit another log
    wrapper.vm.current = 'ChildB';
    await nextTick();
    await flushRaf();

    // ChildA: mount paint log + deactivation flush + reactivation paint log + deactivation flush = 4
    const childALogs = logsFor(logs, 'ChildA');
    expect(childALogs.length).toBe(4);

    wrapper.unmount();
  });

  it('does not overwrite tracker on first activation after mount', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = createKeepAliveWrapper(logs);

    await flushRaf();

    // The mount log should have real mountTimeMs (not overwritten by activated)
    const mountLog = logsFor(logs, 'ChildA')[0];
    expect(mountLog.metrics.mountTimeMs).toBeGreaterThanOrEqual(0);

    wrapper.unmount();
  });

  it('schedules measurePaint on reactivation and emits paint log', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = createKeepAliveWrapper(logs);

    await flushRaf();

    // Deactivate then reactivate
    wrapper.vm.current = 'ChildB';
    await nextTick();
    wrapper.vm.current = 'ChildA';
    await nextTick();

    // Flush rAF to let reactivation paint measurement complete
    await flushRaf();

    // The reactivation paint log should have been emitted
    const childALogs = logsFor(logs, 'ChildA');
    const reactivationPaintLog = childALogs.find((l, i) => i > 0 && l.metrics.paintTimeMs >= 0);
    expect(reactivationPaintLog).toBeDefined();

    wrapper.unmount();
  });

  it('unmounted after deactivation is a no-op for the deactivated component', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = createKeepAliveWrapper(logs);

    await flushRaf();

    // Deactivate ChildA
    wrapper.vm.current = 'ChildB';
    await nextTick();
    await flushRaf();

    const childALogsAfterDeactivation = logsFor(logs, 'ChildA').length;

    // Unmount entire wrapper — unmounted fires but ChildA's tracker already flushed
    wrapper.unmount();

    // No extra logs should be emitted for ChildA
    expect(logsFor(logs, 'ChildA').length).toBe(childALogsAfterDeactivation);
  });

  it('cancels pending paint on deactivation before rAF fires', async () => {
    const logs: VRTComponentLog[] = [];
    const wrapper = createKeepAliveWrapper(logs);

    // Don't flush rAF — paint is still pending
    // Deactivate immediately
    wrapper.vm.current = 'ChildB';
    await nextTick();

    // Deactivation should emit a log with paintTimeMs 0 (paint was cancelled)
    const childALogs = logsFor(logs, 'ChildA');
    expect(childALogs).toHaveLength(1);
    expect(childALogs[0].metrics.paintTimeMs).toBe(0);

    // rAF should not emit another log (callback was cancelled)
    await flushRaf();
    expect(logsFor(logs, 'ChildA')).toHaveLength(1);

    wrapper.unmount();
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
