import type { ComponentInternalInstance } from 'vue';

export function resolveComponentName(instance: ComponentInternalInstance): string {
  const type = instance.type as Record<string, unknown>;
  return (
    (type.name as string) ||
    (type.__name as string) ||
    (type.__file as string) ||
    `Anonymous#${instance.uid}`
  );
}
