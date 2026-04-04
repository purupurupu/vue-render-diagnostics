import { getCurrentInstance, inject } from 'vue';
import { VRT_CONTEXT_KEY } from '../constants.ts';

/**
 * Opt-in a component for VRT tracking.
 * Call in setup() to ensure this component emits [VRT] logs on mount,
 * regardless of plugin include/exclude filters.
 */
export function useRenderDiagnostics(): void {
  const instance = getCurrentInstance();
  if (!instance) return;

  const context = inject(VRT_CONTEXT_KEY);
  if (!context) return;

  const name = instance.type.name || instance.type.__name;
  if (name) {
    context.explicitlyTracked.add(name);
    context.filterCache.delete(name);
  }
}
