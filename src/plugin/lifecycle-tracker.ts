import type { ComponentOptions, ComponentPublicInstance } from 'vue';
import type { VRTPluginOptions } from '../types.ts';
import type { Collector } from '../core/collector.ts';
import { measurePaint } from '../core/timer.ts';
import { emitLog } from '../core/logger.ts';
import { countNodes } from '../utils/dom.ts';

type VueInstance = ComponentPublicInstance & { $: { uid: number } };

const filterCache = new Map<string, boolean>();
const explicitlyTracked = new Set<string>();

/** Mark a component name for tracking, bypassing include/exclude filters. */
export function markTracked(name: string): void {
  explicitlyTracked.add(name);
  filterCache.delete(name);
}

function shouldTrack(name: string | undefined, options: VRTPluginOptions): boolean {
  if (!name) return false;
  if (explicitlyTracked.has(name)) return true;

  const cached = filterCache.get(name);
  if (cached !== undefined) return cached;

  let result = true;

  if (options.include) {
    if (options.include instanceof RegExp) {
      result = options.include.test(name);
    } else {
      result = options.include.includes(name);
    }
  }

  if (result && options.exclude) {
    if (options.exclude instanceof RegExp) {
      result = !options.exclude.test(name);
    } else {
      result = !options.exclude.includes(name);
    }
  }

  filterCache.set(name, result);
  return result;
}

function getComponentName(instance: VueInstance): string | undefined {
  return instance.$options.name || instance.$options.__name;
}

export function createLifecycleTracker(
  collector: Collector,
  options: VRTPluginOptions,
): ComponentOptions {
  return {
    beforeMount(this: VueInstance) {
      const name = getComponentName(this);
      if (!shouldTrack(name, options)) return;
      collector.trackMountStart(name!, this.$.uid);
    },
    mounted(this: VueInstance) {
      const name = getComponentName(this);
      if (!shouldTrack(name, options)) return;
      const uid = this.$.uid;
      collector.trackMountEnd(uid);
      collector.trackNodeCount(uid, countNodes(this.$el));
      measurePaint((paintMs) => {
        collector.trackPaint(uid, paintMs);
        const log = collector.peek(uid);
        if (log) emitLog(log, options);
      });
    },
    beforeUpdate(this: VueInstance) {
      const name = getComponentName(this);
      if (!shouldTrack(name, options)) return;
      collector.trackUpdateStart(this.$.uid);
    },
    updated(this: VueInstance) {
      const name = getComponentName(this);
      if (!shouldTrack(name, options)) return;
      const uid = this.$.uid;
      collector.trackUpdateEnd(uid);
      collector.trackNodeCount(uid, countNodes(this.$el));
      if (options.updateLogInterval && options.updateLogInterval > 0) {
        const count = collector.getUpdateCount(uid);
        if (count > 0 && count % options.updateLogInterval === 0) {
          const log = collector.peek(uid);
          if (log) emitLog(log, options);
        }
      }
    },
    unmounted(this: VueInstance) {
      const name = getComponentName(this);
      if (!shouldTrack(name, options)) return;
      collector.flush(this.$.uid);
    },
  };
}

export function clearFilterCache(): void {
  filterCache.clear();
  explicitlyTracked.clear();
}
