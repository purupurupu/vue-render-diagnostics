import type { VRTComponentLog } from '../types.ts';
import { getCurrentInstance, inject } from 'vue';
import { VRT_CONTEXT_KEY } from '../constants.ts';

export type RenderMetricsHandle = { peek: () => VRTComponentLog | null };

/**
 * Read-only composable for programmatic metric retrieval.
 * Call in setup() to get a handle that can query current metrics
 * for the calling component at any time.
 *
 * Returns null if the plugin is not installed or called outside setup().
 */
export function useRenderMetrics(): RenderMetricsHandle | null {
  const instance = getCurrentInstance();
  if (!instance) return null;

  const context = inject(VRT_CONTEXT_KEY, null);
  if (!context) return null;

  const uid = instance.uid;

  return {
    peek: () => context.collector.peek(uid),
  };
}
