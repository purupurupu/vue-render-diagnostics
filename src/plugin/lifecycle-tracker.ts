import type { ComponentOptions, ComponentPublicInstance } from 'vue';
import type { VRTContext } from './context.ts';
import { measurePaint } from '../core/timer.ts';
import { emitLog } from '../core/logger.ts';
import { countNodes } from '../utils/dom.ts';

type VueInstance = ComponentPublicInstance & { $: { uid: number } };

function shouldTrack(instance: VueInstance, context: VRTContext): boolean {
  const name = getComponentName(instance);
  if (!name) return false;

  if (context.explicitlyTracked.has(name)) return true;

  const cached = context.filterCache.get(name);
  if (cached !== undefined) return cached;

  let result = true;

  if (context.options.include) {
    if (context.options.include instanceof RegExp) {
      context.options.include.lastIndex = 0;
      result = context.options.include.test(name);
    } else {
      result = context.options.include.includes(name);
    }
  }

  if (result && context.options.exclude) {
    if (context.options.exclude instanceof RegExp) {
      context.options.exclude.lastIndex = 0;
      result = !context.options.exclude.test(name);
    } else {
      result = !context.options.exclude.includes(name);
    }
  }

  context.filterCache.set(name, result);
  return result;
}

function getComponentName(instance: VueInstance): string | undefined {
  return instance.$options.name || instance.$options.__name;
}

export function createLifecycleTracker(context: VRTContext): ComponentOptions {
  const { collector, options } = context;

  return {
    beforeMount(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      collector.trackMountStart(getComponentName(this)!, this.$.uid);
    },
    mounted(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      const uid = this.$.uid;
      collector.trackMountEnd(uid);
      collector.trackNodeCount(uid, countNodes(this.$el));
      const mountSnapshot = collector.peek(uid);
      measurePaint((paintMs) => {
        collector.trackPaint(uid, paintMs);
        const log = collector.peek(uid) ?? mountSnapshot;
        if (log) emitLog(log, options);
      });
    },
    beforeUpdate(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      collector.trackUpdateStart(this.$.uid);
    },
    updated(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
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
      if (!shouldTrack(this, context)) return;
      collector.flush(this.$.uid);
    },
  };
}
