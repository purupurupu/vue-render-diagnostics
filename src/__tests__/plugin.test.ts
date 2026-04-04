import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
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

    expect(logs).toHaveLength(mountLogs);
  });
});

describe('useRenderDiagnostics composable', () => {
  beforeEach(() => {
    clearFilterCache();
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
