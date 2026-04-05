import type { VRDIssue, VRDIssueSeverity, VRDMetrics, VRDThresholds } from '../types.ts';

function classify(
  value: number,
  warnThreshold: number,
): { severity: VRDIssueSeverity; threshold: number } {
  const errorThreshold = warnThreshold * 2;
  return value > errorThreshold
    ? { severity: 'error', threshold: errorThreshold }
    : { severity: 'warn', threshold: warnThreshold };
}

export function detectIssues(metrics: VRDMetrics, thresholds: VRDThresholds): VRDIssue[] {
  const issues: VRDIssue[] = [];

  if (metrics.mountTimeMs > thresholds.mountTimeMs) {
    const { severity, threshold } = classify(metrics.mountTimeMs, thresholds.mountTimeMs);
    issues.push({
      id: 'slow-mount',
      severity,
      metric: 'mountTimeMs',
      value: metrics.mountTimeMs,
      threshold,
    });
  }

  if (metrics.avgUpdateMs > thresholds.updateTimeMs) {
    const { severity, threshold } = classify(metrics.avgUpdateMs, thresholds.updateTimeMs);
    issues.push({
      id: 'slow-update-avg',
      severity,
      metric: 'avgUpdateMs',
      value: metrics.avgUpdateMs,
      threshold,
    });
  }

  if (metrics.maxUpdateMs > thresholds.updateTimeMs * 2) {
    issues.push({
      id: 'slow-update-max',
      severity: 'error',
      metric: 'maxUpdateMs',
      value: metrics.maxUpdateMs,
      threshold: thresholds.updateTimeMs * 2,
    });
  }

  if (metrics.paintTimeMs > thresholds.paintTimeMs) {
    const { severity, threshold } = classify(metrics.paintTimeMs, thresholds.paintTimeMs);
    issues.push({
      id: 'slow-paint',
      severity,
      metric: 'paintTimeMs',
      value: metrics.paintTimeMs,
      threshold,
    });
  }

  if (metrics.nodeCount > thresholds.nodeCount) {
    const { severity, threshold } = classify(metrics.nodeCount, thresholds.nodeCount);
    issues.push({
      id: 'large-dom',
      severity,
      metric: 'nodeCount',
      value: metrics.nodeCount,
      threshold,
    });
  }

  if (metrics.updateCount > thresholds.updateCount) {
    const { severity, threshold } = classify(metrics.updateCount, thresholds.updateCount);
    issues.push({
      id: 'excessive-updates',
      severity,
      metric: 'updateCount',
      value: metrics.updateCount,
      threshold,
    });
  }

  return issues;
}
