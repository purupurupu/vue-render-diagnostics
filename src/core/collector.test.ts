import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Collector } from './collector.ts';

describe('Collector', () => {
  let now: number;

  beforeEach(() => {
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.spyOn(Date, 'now').mockReturnValue(1710000000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks mount time', () => {
    const collector = new Collector();

    now = 100;
    collector.trackMountStart('TestComp', 1);
    now = 150;
    collector.trackMountEnd(1);

    const log = collector.flush(1);
    expect(log).not.toBeNull();
    expect(log!.metrics.mountTimeMs).toBe(50);
  });

  it('tracks paint time', () => {
    const collector = new Collector();

    collector.trackMountStart('TestComp', 1);
    collector.trackMountEnd(1);
    collector.trackPaint(1, 30);

    const log = collector.flush(1);
    expect(log!.metrics.paintTimeMs).toBe(30);
  });

  it('tracks update metrics', () => {
    const collector = new Collector();

    collector.trackMountStart('TestComp', 1);
    collector.trackMountEnd(1);

    now = 200;
    collector.trackUpdateStart(1);
    now = 210;
    collector.trackUpdateEnd(1);

    now = 300;
    collector.trackUpdateStart(1);
    now = 330;
    collector.trackUpdateEnd(1);

    const log = collector.flush(1);
    expect(log!.metrics.updateCount).toBe(2);
    expect(log!.metrics.avgUpdateMs).toBe(20);
    expect(log!.metrics.maxUpdateMs).toBe(30);
    expect(log!.signals.dataUpdateDetected).toBe(true);
  });

  it('tracks node count', () => {
    const collector = new Collector();

    collector.trackMountStart('TestComp', 1);
    collector.trackMountEnd(1);
    collector.trackNodeCount(1, 500);

    const log = collector.flush(1);
    expect(log!.metrics.nodeCount).toBe(500);
  });

  it('tracks async setup signal', () => {
    const collector = new Collector();

    collector.trackMountStart('AsyncComp', 1);
    collector.trackAsyncSetup(1);
    collector.trackMountEnd(1);

    const log = collector.flush(1);
    expect(log!.signals.hasAsyncInSetup).toBe(true);
  });

  it('produces correct log structure', () => {
    const collector = new Collector();

    now = 0;
    collector.trackMountStart('MyComponent', 1);
    now = 10;
    collector.trackMountEnd(1);

    const log = collector.flush(1);
    expect(log).toEqual({
      type: 'vrt:component',
      component: 'MyComponent',
      timestamp: 1710000000000,
      metrics: {
        mountTimeMs: 10,
        paintTimeMs: 0,
        updateCount: 0,
        avgUpdateMs: 0,
        maxUpdateMs: 0,
        nodeCount: 0,
      },
      signals: {
        hasAsyncInSetup: false,
        dataUpdateDetected: false,
      },
      issues: [],
    });
  });

  it('returns null for unknown uid', () => {
    const collector = new Collector();
    expect(collector.flush(999)).toBeNull();
  });

  it('removes tracker after flush', () => {
    const collector = new Collector();

    collector.trackMountStart('TestComp', 1);
    collector.trackMountEnd(1);
    collector.flush(1);

    expect(collector.flush(1)).toBeNull();
  });

  it('detects issues based on thresholds', () => {
    const collector = new Collector({ mountTimeMs: 10 });

    now = 0;
    collector.trackMountStart('SlowComp', 1);
    now = 20;
    collector.trackMountEnd(1);

    const log = collector.flush(1);
    expect(log!.issues).toContainEqual(
      expect.objectContaining({ id: 'slow-mount', severity: 'warn' }),
    );
  });

  it('ignores operations on unknown uid', () => {
    const collector = new Collector();

    // None of these should throw
    collector.trackMountEnd(999);
    collector.trackPaint(999, 10);
    collector.trackUpdateStart(999);
    collector.trackUpdateEnd(999);
    collector.trackNodeCount(999, 100);
    collector.trackAsyncSetup(999);
  });
});
