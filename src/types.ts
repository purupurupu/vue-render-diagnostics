export interface VRTMetrics {
  mountTimeMs: number;
  paintTimeMs: number;
  updateCount: number;
  avgUpdateMs: number;
  maxUpdateMs: number;
  nodeCount: number;
}

export interface VRTSignals {
  hasAsyncInSetup: boolean;
  dataUpdateDetected: boolean;
}

export type VRTIssueSeverity = 'info' | 'warn' | 'error';

export type VRTIssueId =
  | 'slow-mount'
  | 'slow-update'
  | 'slow-paint'
  | 'large-dom'
  | 'excessive-updates';

export interface VRTIssue {
  id: VRTIssueId;
  severity: VRTIssueSeverity;
  metric: keyof VRTMetrics;
  value: number;
}

export type VRTLogType = 'vrt:mount' | 'vrt:unmount';

export interface VRTComponentLog {
  type: VRTLogType;
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

export interface VRTPluginOptions {
  enabled?: boolean;
  include?: string[] | RegExp;
  exclude?: string[] | RegExp;
  thresholds?: Partial<VRTThresholds>;
  logToConsole?: boolean;
  onLog?: (log: VRTComponentLog) => void;
}
