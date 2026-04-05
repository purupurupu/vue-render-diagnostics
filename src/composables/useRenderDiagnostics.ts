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

  const name =
    instance.type.name || instance.type.__name || (instance.type as Record<string, unknown>).__file;

  if (!name) {
    console.warn(
      '[VRT] useRenderDiagnostics() called on a component without a name. Add a `name` option or use <script setup> for automatic name inference.',
    );
    return;
  }

  context.explicitlyTracked.add(name as string);
  context.filterCache.delete(name as string);
}
