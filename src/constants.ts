import type { InjectionKey } from 'vue';
import type { VRTThresholds } from './types.ts';
import type { Collector } from './core/collector.ts';

export const VRT_PREFIX = '[VRT]';

export const VRT_COLLECTOR_KEY: InjectionKey<Collector> = Symbol('vrt-collector');

export const DEFAULT_THRESHOLDS: VRTThresholds = {
  mountTimeMs: 50,
  updateTimeMs: 16,
  paintTimeMs: 50,
  nodeCount: 1000,
  updateCount: 20,
};
