import type { ComponentOptions, ComponentPublicInstance } from 'vue';
import type { VRDContext } from './context.ts';
import type { PaintHandle } from '../core/timer.ts';
import { measurePaint } from '../core/timer.ts';
import { emitLog } from '../core/logger.ts';
import { countNodes } from '../utils/dom.ts';
import { resolveComponentName } from '../utils/component-name.ts';

/**
 * $.uid is ComponentInternalInstance.uid — not part of Vue's public API
 * but stable across all 3.x versions and used by vue-devtools/pinia.
 * If a future Vue version removes it, replace with a WeakMap-based ID.
 */
type VueInstance = ComponentPublicInstance & { $: { uid: number } };

function shouldTrack(instance: VueInstance, context: VRDContext): boolean {
  const name = getComponentName(instance);

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

  if (!name.startsWith('Anonymous#')) {
    context.filterCache.set(name, result);
  }
  return result;
}

function getComponentName(instance: VueInstance): string {
  return resolveComponentName(instance.$);
}

export function createLifecycleTracker(context: VRDContext): ComponentOptions {
  const { collector, options } = context;
  const pendingPaints = new Map<number, PaintHandle>();

  function schedulePaint(uid: number): void {
    const handle = measurePaint((paintMs) => {
      pendingPaints.delete(uid);
      collector.trackPaint(uid, paintMs);
      const log = collector.peek(uid);
      if (log) emitLog(log, options);
    });
    pendingPaints.set(uid, handle);
  }

  return {
    beforeMount(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      collector.trackMountStart(getComponentName(this), this.$.uid);
    },
    mounted(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      const uid = this.$.uid;
      collector.trackMountEnd(uid);
      collector.trackNodeCount(uid, countNodes(this.$el));
      schedulePaint(uid);
    },
    beforeUpdate(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      collector.trackUpdateStart(this.$.uid);
    },
    updated(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      const uid = this.$.uid;
      collector.trackUpdateEnd(uid);
      if (options.updateLogInterval && options.updateLogInterval > 0) {
        const count = collector.getUpdateCount(uid);
        if (count > 0 && count % options.updateLogInterval === 0) {
          collector.trackNodeCount(uid, countNodes(this.$el));
          const log = collector.peek(uid);
          if (log) emitLog(log, options);
        }
      }
    },
    activated(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      const uid = this.$.uid;
      if (collector.peek(uid)) return;
      const name = getComponentName(this);
      collector.trackMountStart(name, uid);
      collector.trackMountEnd(uid);
      collector.trackNodeCount(uid, countNodes(this.$el));
      schedulePaint(uid);
    },
    deactivated(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      const uid = this.$.uid;
      const pending = pendingPaints.get(uid);
      if (pending) {
        pending.cancel();
        pendingPaints.delete(uid);
      }
      const log = collector.flush(uid);
      if (log) emitLog(log, options);
    },
    unmounted(this: VueInstance) {
      if (!shouldTrack(this, context)) return;
      const uid = this.$.uid;
      const pending = pendingPaints.get(uid);
      if (pending) {
        pending.cancel();
        pendingPaints.delete(uid);
        const log = collector.flush(uid);
        if (log) emitLog(log, options);
      } else {
        collector.flush(uid);
      }
    },
  };
}
