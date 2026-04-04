import type { VRTIssue, VRTMetrics, VRTThresholds } from '../types.ts';

export function detectIssues(metrics: VRTMetrics, thresholds: VRTThresholds): VRTIssue[] {
  const issues: VRTIssue[] = [];

  if (metrics.mountTimeMs > thresholds.mountTimeMs) {
    const isError = metrics.mountTimeMs > thresholds.mountTimeMs * 2;
    issues.push({
      id: 'slow-mount',
      severity: isError ? 'error' : 'warn',
      metric: 'mountTimeMs',
      value: metrics.mountTimeMs,
      threshold: isError ? thresholds.mountTimeMs * 2 : thresholds.mountTimeMs,
    });
  }

  if (metrics.avgUpdateMs > thresholds.updateTimeMs) {
    const isError = metrics.avgUpdateMs > thresholds.updateTimeMs * 2;
    issues.push({
      id: 'slow-update',
      severity: isError ? 'error' : 'warn',
      metric: 'avgUpdateMs',
      value: metrics.avgUpdateMs,
      threshold: isError ? thresholds.updateTimeMs * 2 : thresholds.updateTimeMs,
    });
  }

  if (metrics.maxUpdateMs > thresholds.updateTimeMs * 2) {
    issues.push({
      id: 'slow-update',
      severity: 'error',
      metric: 'maxUpdateMs',
      value: metrics.maxUpdateMs,
      threshold: thresholds.updateTimeMs * 2,
    });
  }

  if (metrics.paintTimeMs > thresholds.paintTimeMs) {
    const isError = metrics.paintTimeMs > thresholds.paintTimeMs * 2;
    issues.push({
      id: 'slow-paint',
      severity: isError ? 'error' : 'warn',
      metric: 'paintTimeMs',
      value: metrics.paintTimeMs,
      threshold: isError ? thresholds.paintTimeMs * 2 : thresholds.paintTimeMs,
    });
  }

  if (metrics.nodeCount > thresholds.nodeCount) {
    const isError = metrics.nodeCount > thresholds.nodeCount * 2;
    issues.push({
      id: 'large-dom',
      severity: isError ? 'error' : 'warn',
      metric: 'nodeCount',
      value: metrics.nodeCount,
      threshold: isError ? thresholds.nodeCount * 2 : thresholds.nodeCount,
    });
  }

  if (metrics.updateCount > thresholds.updateCount) {
    const isError = metrics.updateCount > thresholds.updateCount * 2;
    issues.push({
      id: 'excessive-updates',
      severity: isError ? 'error' : 'warn',
      metric: 'updateCount',
      value: metrics.updateCount,
      threshold: isError ? thresholds.updateCount * 2 : thresholds.updateCount,
    });
  }

  return issues;
}
