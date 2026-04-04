import type { Collector } from '../core/collector.ts';
import type { VRTPluginOptions } from '../types.ts';

export interface VRTContext {
  readonly collector: Collector;
  readonly options: VRTPluginOptions;
  readonly filterCache: Map<string, boolean>;
  readonly explicitlyTracked: Set<string>;
}

export function createVRTContext(collector: Collector, options: VRTPluginOptions): VRTContext {
  return { collector, options, filterCache: new Map(), explicitlyTracked: new Set() };
}
