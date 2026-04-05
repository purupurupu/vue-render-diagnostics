export interface VRTMetrics {
  mountTimeMs: number;
  paintTimeMs: number;
  updateCount: number;
  avgUpdateMs: number;
  maxUpdateMs: number;
  nodeCount: number;
}

/**
 * Async setup detection (hasAsyncInSetup) was removed because Vue 3 provides
 * no public API to reliably detect async setup() from a global mixin.
 * See: https://github.com/purupurupu/vue-render-diagnostics/issues/34
 */
export interface VRTSignals {
  dataUpdateDetected: boolean;
  clockSkewDetected: boolean;
}

export type VRTIssueSeverity = 'info' | 'warn' | 'error';

export type VRTIssueId =
  | 'slow-mount'
  | 'slow-update-avg'
  | 'slow-update-max'
  | 'slow-paint'
  | 'large-dom'
  | 'excessive-updates';

export interface VRTIssue {
  id: VRTIssueId;
  severity: VRTIssueSeverity;
  metric: keyof VRTMetrics;
  value: number;
  threshold: number;
}

export interface VRTComponentLog {
  type: 'vrt:component';
  component: string;
  timestamp: number;
  metrics: VRTMetrics;
  signals: VRTSignals;
  issues: VRTIssue[];
}

export interface VRTThresholds {
  mountTimeMs: number;
  updateTimeMs: number;
  paintTimeMs: number;
  nodeCount: number;
  updateCount: number;
}

export type VRTLogLevel = 'all' | 'issues' | 'warn' | 'error' | 'silent';

export interface VRTPluginOptions {
  enabled?: boolean;
  include?: string[] | RegExp;
  exclude?: string[] | RegExp;
  thresholds?: Partial<VRTThresholds>;
  logToConsole?: boolean;
  logLevel?: VRTLogLevel;
  updateLogInterval?: number;
  onLog?: (log: VRTComponentLog) => void;
}
