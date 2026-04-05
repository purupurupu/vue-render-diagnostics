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

  it('detects slow-mount as warn with threshold value', () => {
    const issues = detectIssues(makeMetrics({ mountTimeMs: 80 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'slow-mount', severity: 'warn', value: 80, threshold: 50 }),
    );
  });

  it('detects slow-mount as error with 2x threshold value', () => {
    const issues = detectIssues(makeMetrics({ mountTimeMs: 120 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({
        id: 'slow-mount',
        severity: 'error',
        value: 120,
        threshold: 100,
      }),
    );
  });

  it('detects slow-update from avgUpdateMs with threshold', () => {
    const issues = detectIssues(makeMetrics({ avgUpdateMs: 20 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({
        id: 'slow-update',
        metric: 'avgUpdateMs',
        severity: 'warn',
        threshold: 16,
      }),
    );
  });

  it('detects slow-update as error from maxUpdateMs with 2x threshold', () => {
    const issues = detectIssues(makeMetrics({ maxUpdateMs: 40 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({
        id: 'slow-update',
        metric: 'maxUpdateMs',
        severity: 'error',
        threshold: 32,
      }),
    );
  });

  it('detects slow-paint with threshold', () => {
    const issues = detectIssues(makeMetrics({ paintTimeMs: 60 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'slow-paint', severity: 'warn', threshold: 50 }),
    );
  });

  it('detects large-dom with threshold', () => {
    const issues = detectIssues(makeMetrics({ nodeCount: 1200 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({
        id: 'large-dom',
        severity: 'warn',
        value: 1200,
        threshold: 1000,
      }),
    );
  });

  it('detects excessive-updates with threshold', () => {
    const issues = detectIssues(makeMetrics({ updateCount: 25 }), thresholds);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'excessive-updates', severity: 'warn', threshold: 20 }),
    );
  });

  it('detects multiple issues simultaneously', () => {
    const issues = detectIssues(
      makeMetrics({ mountTimeMs: 80, nodeCount: 1200, updateCount: 25 }),
      thresholds,
    );
    expect(issues).toHaveLength(3);
  });

  it('uses custom thresholds in threshold field', () => {
    const custom: VRTThresholds = { ...DEFAULT_THRESHOLDS, mountTimeMs: 30 };
    const issues = detectIssues(makeMetrics({ mountTimeMs: 40 }), custom);
    expect(issues).toContainEqual(
      expect.objectContaining({ id: 'slow-mount', severity: 'warn', threshold: 30 }),
    );
  });
});
