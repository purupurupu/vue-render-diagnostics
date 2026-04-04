import {
  inject,
  ref,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onUnmounted,
  getCurrentInstance,
} from 'vue';
import type { Ref } from 'vue';
import type { VRTComponentLog, VRTIssue, VRTMetrics } from '../types.ts';
import { VRT_COLLECTOR_KEY } from '../constants.ts';
import { measurePaint } from '../core/timer.ts';
import { countNodes } from '../utils/dom.ts';

export interface UseRenderDiagnosticsReturn {
  metrics: Readonly<Ref<VRTMetrics | null>>;
  issues: Readonly<Ref<VRTIssue[]>>;
  flush: () => VRTComponentLog | null;
}

export function useRenderDiagnostics(componentName?: string): UseRenderDiagnosticsReturn {
  const collector = inject(VRT_COLLECTOR_KEY);
  const metrics = ref<VRTMetrics | null>(null);
  const issues = ref<VRTIssue[]>([]);

  if (!collector) {
    return {
      metrics,
      issues,
      flush: () => null,
    };
  }

  // Assigned to const after null check so closures below can reference it safely
  const c = collector;
  const instance = getCurrentInstance();
  const uid = instance?.uid ?? 0;
  const name = componentName || instance?.type.__name || instance?.type.name || 'Anonymous';

  function updateRefs(): void {
    const snapshot = c.peek(uid);
    if (snapshot) {
      metrics.value = snapshot.metrics;
      issues.value = snapshot.issues;
    }
  }

  onBeforeMount(() => {
    c.trackMountStart(name, uid);
  });

  onMounted(() => {
    c.trackMountEnd(uid);
    c.trackNodeCount(uid, countNodes(instance?.proxy?.$el));
    measurePaint((paintMs) => {
      c.trackPaint(uid, paintMs);
      updateRefs();
    });
    updateRefs();
  });

  onBeforeUpdate(() => {
    c.trackUpdateStart(uid);
  });

  onUpdated(() => {
    c.trackUpdateEnd(uid);
    c.trackNodeCount(uid, countNodes(instance?.proxy?.$el));
    updateRefs();
  });

  onUnmounted(() => {
    const log = c.flush(uid);
    if (log) {
      metrics.value = log.metrics;
      issues.value = log.issues;
    }
  });

  const flush = (): VRTComponentLog | null => {
    return c.flush(uid);
  };

  return { metrics, issues, flush };
}
