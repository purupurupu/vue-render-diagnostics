import type { VRTIssue, VRTMetrics, VRTThresholds } from '../types.ts';

export function detectIssues(metrics: VRTMetrics, thresholds: VRTThresholds): VRTIssue[] {
  const issues: VRTIssue[] = [];

  if (metrics.mountTimeMs > thresholds.mountTimeMs) {
    issues.push({
      id: 'slow-mount',
      severity: metrics.mountTimeMs > thresholds.mountTimeMs * 2 ? 'error' : 'warn',
      metric: 'mountTimeMs',
      value: metrics.mountTimeMs,
    });
  }

  if (metrics.avgUpdateMs > thresholds.updateTimeMs) {
    issues.push({
      id: 'slow-update',
      severity: metrics.avgUpdateMs > thresholds.updateTimeMs * 2 ? 'error' : 'warn',
      metric: 'avgUpdateMs',
      value: metrics.avgUpdateMs,
    });
  }

  if (metrics.maxUpdateMs > thresholds.updateTimeMs * 2) {
    issues.push({
      id: 'slow-update',
      severity: 'error',
      metric: 'maxUpdateMs',
      value: metrics.maxUpdateMs,
    });
  }

  if (metrics.paintTimeMs > thresholds.paintTimeMs) {
    issues.push({
      id: 'slow-paint',
      severity: metrics.paintTimeMs > thresholds.paintTimeMs * 2 ? 'error' : 'warn',
      metric: 'paintTimeMs',
      value: metrics.paintTimeMs,
    });
  }

  if (metrics.nodeCount > thresholds.nodeCount) {
    issues.push({
      id: 'large-dom',
      severity: metrics.nodeCount > thresholds.nodeCount * 2 ? 'error' : 'warn',
      metric: 'nodeCount',
      value: metrics.nodeCount,
    });
  }

  if (metrics.updateCount > thresholds.updateCount) {
    issues.push({
      id: 'excessive-updates',
      severity: metrics.updateCount > thresholds.updateCount * 2 ? 'error' : 'warn',
      metric: 'updateCount',
      value: metrics.updateCount,
    });
  }

  return issues;
}
