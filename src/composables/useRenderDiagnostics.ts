import { getCurrentInstance, inject } from 'vue';
import { VRT_CONTEXT_KEY } from '../constants.ts';
import { resolveComponentName } from '../utils/component-name.ts';

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

  const name = resolveComponentName(instance);

  if (name.startsWith('Anonymous#')) {
    console.warn(
      '[VRT] useRenderDiagnostics() called on a component without a name. Add a `name` option or use <script setup> for automatic name inference.',
    );
  }

  context.explicitlyTracked.add(name);
  context.filterCache.delete(name);
}
