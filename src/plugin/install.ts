import type { Plugin } from 'vue';
import type { VRTPluginOptions } from '../types.ts';
import { VRT_COLLECTOR_KEY, VRT_CONTEXT_KEY } from '../constants.ts';
import { Collector } from '../core/collector.ts';
import { createVRTContext } from './context.ts';
import { createLifecycleTracker } from './lifecycle-tracker.ts';

export const VueRenderDiagnostics: Plugin<[VRTPluginOptions?]> = {
  install(app, options: VRTPluginOptions = {}) {
    if (options.enabled !== true) return;

    const collector = new Collector(options.thresholds);
    const context = createVRTContext(collector, options);
    app.provide(VRT_COLLECTOR_KEY, collector);
    app.provide(VRT_CONTEXT_KEY, context);
    app.mixin(createLifecycleTracker(context));
  },
};
