import type { InjectionKey } from 'vue';
import type { VRTThresholds } from './types.ts';
import type { Collector } from './core/collector.ts';
import type { VRTContext } from './plugin/context.ts';

export const VRT_PREFIX = '[VRT]';

export const VRT_COLLECTOR_KEY: InjectionKey<Collector> = Symbol('vrt-collector');
export const VRT_CONTEXT_KEY: InjectionKey<VRTContext> = Symbol('vrt-context');

export const DEFAULT_THRESHOLDS: VRTThresholds = {
  mountTimeMs: 100,
  updateTimeMs: 16,
  paintTimeMs: 100,
  nodeCount: 1500,
  updateCount: 50,
};
