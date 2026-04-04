import { inject, shallowRef, onMounted, onUpdated, getCurrentInstance } from 'vue';
import type { ShallowRef } from 'vue';
import type { VRTComponentLog, VRTIssue, VRTMetrics } from '../types.ts';
import { VRT_COLLECTOR_KEY } from '../constants.ts';

export interface UseRenderDiagnosticsReturn {
  metrics: Readonly<ShallowRef<VRTMetrics | null>>;
  issues: Readonly<ShallowRef<VRTIssue[]>>;
  flush: () => VRTComponentLog | null;
}

export function useRenderDiagnostics(_componentName?: string): UseRenderDiagnosticsReturn {
  const collector = inject(VRT_COLLECTOR_KEY);
  const metrics = shallowRef<VRTMetrics | null>(null);
  const issues = shallowRef<VRTIssue[]>([]);

  if (!collector) {
    return { metrics, issues, flush: () => null };
  }

  const c = collector;
  const instance = getCurrentInstance();
  const uid = instance?.uid ?? 0;

  // Schedule ref update outside Vue's render cycle to prevent infinite loops.
  // When metrics ref updates → template re-renders → onUpdated fires → scheduleRefUpdate →
  // but the rAF runs AFTER Vue settles, so the next onUpdated correctly tracks a real user update.
  let rafPending = false;

  function scheduleRefUpdate(): void {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      const snapshot = c.peek(uid);
      if (snapshot) {
        metrics.value = snapshot.metrics;
        issues.value = snapshot.issues;
      }
    });
  }

  // The global mixin handles all lifecycle tracking (trackMountStart/End, trackUpdateStart/End, etc.)
  // This composable only reads from the collector via peek() — no duplicate tracking.

  onMounted(() => {
    scheduleRefUpdate();
  });

  onUpdated(() => {
    scheduleRefUpdate();
  });

  const flush = (): VRTComponentLog | null => {
    return c.flush(uid);
  };

  return { metrics, issues, flush };
}
