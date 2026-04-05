import type { Collector } from '../core/collector.ts';
import type { VRDPluginOptions } from '../types.ts';

export interface VRDContext {
  readonly collector: Collector;
  readonly options: VRDPluginOptions;
  readonly filterCache: Map<string, boolean>;
  readonly explicitlyTracked: Set<string>;
}

export function createVRDContext(collector: Collector, options: VRDPluginOptions): VRDContext {
  return { collector, options, filterCache: new Map(), explicitlyTracked: new Set() };
}
