import type { Plugin } from 'vue';
import type { VRTPluginOptions } from './types.ts';
import { VRT_COLLECTOR_KEY } from './constants.ts';
import { Collector } from './core/collector.ts';
import { createVRTMixin } from './hooks/mixin.ts';

export const VueRenderDiagnostics: Plugin<[VRTPluginOptions?]> = {
  install(app, options: VRTPluginOptions = {}) {
    if (options.enabled === false) return;

    const collector = new Collector(options.thresholds);
    app.provide(VRT_COLLECTOR_KEY, collector);
    app.mixin(createVRTMixin(collector, options));
  },
};
