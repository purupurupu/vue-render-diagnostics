import type { Plugin } from 'vue';
import type { VRDPluginOptions } from '../types.ts';
import { VRD_COLLECTOR_KEY, VRD_CONTEXT_KEY } from '../constants.ts';
import { Collector } from '../core/collector.ts';
import { createVRDContext } from './context.ts';
import { createLifecycleTracker } from './lifecycle-tracker.ts';

export const VueRenderDiagnostics: Plugin<[VRDPluginOptions?]> = {
  install(app, options: VRDPluginOptions = {}) {
    if (options.enabled !== true) return;

    const collector = new Collector(options.thresholds);
    const context = createVRDContext(collector, options);
    app.provide(VRD_COLLECTOR_KEY, collector);
    app.provide(VRD_CONTEXT_KEY, context);
    app.mixin(createLifecycleTracker(context));
  },
};
