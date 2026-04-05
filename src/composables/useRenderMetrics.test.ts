import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref, nextTick } from 'vue';
import { VueRenderDiagnostics } from '../plugin/install.ts';
import { useRenderMetrics } from './useRenderMetrics.ts';
import type { RenderMetricsHandle } from './useRenderMetrics.ts';

async function flushRaf(): Promise<void> {
  await vi.advanceTimersToNextFrame();
  await vi.advanceTimersToNextFrame();
}

describe('useRenderMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns null when plugin is not installed', () => {
    let handle: RenderMetricsHandle | null = null;

    const Comp = defineComponent({
      name: 'NoPlugin',
      setup() {
        handle = useRenderMetrics();
      },
      template: '<div />',
    });

    const wrapper = mount(Comp);
    expect(handle).toBeNull();
    wrapper.unmount();
  });

  it('returns a handle with peek when plugin is installed', async () => {
    let handle: RenderMetricsHandle | null = null;

    const Comp = defineComponent({
      name: 'WithPlugin',
      setup() {
        handle = useRenderMetrics();
      },
      template: '<div />',
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[VueRenderDiagnostics]],
      },
    });

    await flushRaf();

    expect(handle).not.toBeNull();
    expect(typeof handle!.peek).toBe('function');
    wrapper.unmount();
  });

  it('peek returns current metrics after mount', async () => {
    let handle: RenderMetricsHandle | null = null;

    const Comp = defineComponent({
      name: 'PeekTest',
      setup() {
        handle = useRenderMetrics();
      },
      template: '<div>hello</div>',
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[VueRenderDiagnostics]],
      },
    });

    await flushRaf();

    const log = handle!.peek();
    expect(log).not.toBeNull();
    expect(log!.type).toBe('vrt:component');
    expect(log!.component).toBe('PeekTest');
    expect(log!.metrics.mountTimeMs).toBeGreaterThanOrEqual(0);
    expect(log!.metrics.updateCount).toBe(0);
    wrapper.unmount();
  });

  it('peek reflects accumulated updates', async () => {
    let handle: RenderMetricsHandle | null = null;

    const Comp = defineComponent({
      name: 'UpdateTest',
      setup() {
        handle = useRenderMetrics();
        const count = ref(0);
        return { count };
      },
      template: '<div>{{ count }}</div>',
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[VueRenderDiagnostics]],
      },
    });

    await flushRaf();

    // Trigger 3 updates
    for (let i = 0; i < 3; i++) {
      wrapper.vm.count++;
      await nextTick();
    }

    const log = handle!.peek();
    expect(log!.metrics.updateCount).toBe(3);
    wrapper.unmount();
  });

  it('peek returns null after component is unmounted and flushed', async () => {
    let handle: RenderMetricsHandle | null = null;

    const Comp = defineComponent({
      name: 'FlushTest',
      setup() {
        handle = useRenderMetrics();
      },
      template: '<div />',
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[VueRenderDiagnostics]],
      },
    });

    await flushRaf();
    expect(handle!.peek()).not.toBeNull();

    wrapper.unmount();

    // After unmount, collector.flush() was called — peek should return null
    expect(handle!.peek()).toBeNull();
  });

  it('does not expose flush or any mutation methods', () => {
    let handle: RenderMetricsHandle | null = null;

    const Comp = defineComponent({
      name: 'ReadOnlyTest',
      setup() {
        handle = useRenderMetrics();
      },
      template: '<div />',
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[VueRenderDiagnostics]],
      },
    });

    expect(handle).not.toBeNull();
    const keys = Object.keys(handle!);
    expect(keys).toEqual(['peek']);
    expect((handle as Record<string, unknown>)['flush']).toBeUndefined();
    wrapper.unmount();
  });
});
