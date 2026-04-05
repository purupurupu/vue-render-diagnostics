import type { InjectionKey } from 'vue';
import type { VRDThresholds } from './types.ts';
import type { Collector } from './core/collector.ts';
import type { VRDContext } from './plugin/context.ts';

export const VRD_PREFIX = '[VRD]';

export const VRD_COLLECTOR_KEY: InjectionKey<Collector> = Symbol('vrd-collector');
export const VRD_CONTEXT_KEY: InjectionKey<VRDContext> = Symbol('vrd-context');

export const DEFAULT_THRESHOLDS: VRDThresholds = {
  mountTimeMs: 100,
  updateTimeMs: 16,
  paintTimeMs: 100,
  nodeCount: 1500,
  updateCount: 50,
};
