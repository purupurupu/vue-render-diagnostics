import { describe, it, expect } from 'vitest';
import { detectIssues } from './detector.ts';
import type { VRTMetrics, VRTThresholds } from '../types.ts';
import { DEFAULT_THRESHOLDS } from '../constants.ts';

function makeMetrics(overrides: Partial<VRTMetrics> = {}): VRTMetrics {
  return {
    mountTimeMs: 10,
    paintTimeMs: 10,
    updateCount: 0,
    avgUpdateMs: 0,
    maxUpdateMs: 0,
    nodeCount: 100,
    ...overrides,
  };
}

describe('detectIssues', () => {
  const thresholds: VRTThresholds = DEFAULT_THRESHOLDS;

  it('returns empty array for metrics within thresholds', () => {
    const issues = detectIssues(makeMetrics(), thresholds);
    expect(issues).toEqual([]);
  });

  it('detects slow-mount as warn when above threshold', () => {
    const issues = detectIssues(makeMetrics({ mountTimeMs: 80 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'slow-mount', severity: 'warn', value: 80 }),
    );
  });

  it('detects slow-mount as error when above 2x threshold', () => {
    const issues = detectIssues(makeMetrics({ mountTimeMs: 120 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'slow-mount', severity: 'error', value: 120 }),
    );
  });

  it('detects slow-update from avgUpdateMs', () => {
    const issues = detectIssues(makeMetrics({ avgUpdateMs: 20 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'slow-update', metric: 'avgUpdateMs', severity: 'warn' }),
    );
  });

  it('detects slow-update as error from maxUpdateMs above 2x threshold', () => {
    const issues = detectIssues(makeMetrics({ maxUpdateMs: 40 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'slow-update', metric: 'maxUpdateMs', severity: 'error' }),
    );
  });

  it('detects slow-paint', () => {
    const issues = detectIssues(makeMetrics({ paintTimeMs: 60 }), thresholds);
    expect(issues).toContainEqual(expect.objectContaining({ id: 'slow-paint', severity: 'warn' }));
  });

  it('detects large-dom', () => {
    const issues = detectIssues(makeMetrics({ nodeCount: 1200 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'large-dom', severity: 'warn', value: 1200 }),
    );
  });

  it('detects excessive-updates', () => {
    const issues = detectIssues(makeMetrics({ updateCount: 25 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'excessive-updates', severity: 'warn' }),
    );
  });

  it('detects multiple issues simultaneously', () => {
    const issues = detectIssues(
      makeMetrics({ mountTimeMs: 80, nodeCount: 1200, updateCount: 25 }),
      thresholds,
    );
    expect(issues).toHaveLength(3);
  });
});
