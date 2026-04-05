export { VueRenderDiagnostics } from './plugin/install.ts';
export { useRenderDiagnostics } from './composables/useRenderDiagnostics.ts';
export { useRenderMetrics } from './composables/useRenderMetrics.ts';
export type { RenderMetricsHandle } from './composables/useRenderMetrics.ts';
export type {
  VRDComponentLog,
  VRDIssue,
  VRDIssueId,
  VRDIssueSeverity,
  VRDLogLevel,
  VRDMetrics,
  VRDPluginOptions,
  VRDSignals,
  VRDThresholds,
} from './types.ts';
