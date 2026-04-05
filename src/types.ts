export interface VRDMetrics {
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
export interface VRDSignals {
  dataUpdateDetected: boolean;
  clockSkewDetected: boolean;
}

export type VRDIssueSeverity = 'info' | 'warn' | 'error';

export type VRDIssueId =
  | 'slow-mount'
  | 'slow-update-avg'
  | 'slow-update-max'
  | 'slow-paint'
  | 'large-dom'
  | 'excessive-updates';

export interface VRDIssue {
  id: VRDIssueId;
  severity: VRDIssueSeverity;
  metric: keyof VRDMetrics;
  value: number;
  threshold: number;
}

export interface VRDComponentLog {
  type: 'vrt:component';
  component: string;
  timestamp: number;
  metrics: VRDMetrics;
  signals: VRDSignals;
  issues: VRDIssue[];
}

export interface VRDThresholds {
  mountTimeMs: number;
  updateTimeMs: number;
  paintTimeMs: number;
  nodeCount: number;
  updateCount: number;
}

export type VRDLogLevel = 'all' | 'issues' | 'warn' | 'error' | 'silent';

export interface VRDPluginOptions {
  /** Must be `true` to activate the plugin. Defaults to `false` to prevent accidental production overhead. */
  enabled?: boolean;
  include?: string[] | RegExp;
  exclude?: string[] | RegExp;
  thresholds?: Partial<VRDThresholds>;
  logToConsole?: boolean;
  /** Controls console output filtering. Does NOT affect `onLog` — the callback always receives all logs. */
  logLevel?: VRDLogLevel;
  updateLogInterval?: number;
  /** Called for every log regardless of `logLevel`. Use `logLevel` to control console output only. */
  onLog?: (log: VRDComponentLog) => void;
}
