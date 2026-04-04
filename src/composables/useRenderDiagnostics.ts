import { getCurrentInstance } from 'vue';
import { markTracked } from '../plugin/lifecycle-tracker.ts';

/**
 * Opt-in a component for VRT tracking.
 * Call in setup() to ensure this component emits [VRT] logs on mount,
 * regardless of plugin include/exclude filters.
 */
export function useRenderDiagnostics(): void {
  const instance = getCurrentInstance();
  if (!instance) return;

  const name = instance.type.__name || instance.type.name;
  if (name) {
    markTracked(name);
  }
}
