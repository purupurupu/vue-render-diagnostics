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
        dataUpdateDetected: false,
        clockSkewDetected: false,
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

  it('peek returns snapshot without removing tracker', () => {
    const collector = new Collector();

    now = 0;
    collector.trackMountStart('TestComp', 1);
    now = 10;
    collector.trackMountEnd(1);

    const snapshot = collector.peek(1);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.metrics.mountTimeMs).toBe(10);

    // tracker still exists — flush should also work
    const log = collector.flush(1);
    expect(log).not.toBeNull();
    expect(log!.metrics.mountTimeMs).toBe(10);
  });

  it('peek returns null for unknown uid', () => {
    const collector = new Collector();
    expect(collector.peek(999)).toBeNull();
  });

  it('peek reflects updated metrics after each update', () => {
    const collector = new Collector();

    collector.trackMountStart('TestComp', 1);
    collector.trackMountEnd(1);

    now = 100;
    collector.trackUpdateStart(1);
    now = 110;
    collector.trackUpdateEnd(1);

    const first = collector.peek(1);
    expect(first!.metrics.updateCount).toBe(1);

    now = 200;
    collector.trackUpdateStart(1);
    now = 220;
    collector.trackUpdateEnd(1);

    const second = collector.peek(1);
    expect(second!.metrics.updateCount).toBe(2);
    expect(second!.metrics.maxUpdateMs).toBe(20);
  });

  it('handles 200k updates without error or excessive memory', () => {
    const collector = new Collector();

    collector.trackMountStart('StressComp', 1);
    collector.trackMountEnd(1);

    for (let i = 0; i < 200_000; i++) {
      now = i * 2;
      collector.trackUpdateStart(1);
      now = i * 2 + 1;
      collector.trackUpdateEnd(1);
    }

    const log = collector.flush(1);
    expect(log!.metrics.updateCount).toBe(200_000);
    expect(log!.metrics.avgUpdateMs).toBe(1);
    expect(log!.metrics.maxUpdateMs).toBe(1);
  });

  it('ignores trackUpdateEnd without prior trackUpdateStart', () => {
    const collector = new Collector();

    collector.trackMountStart('TestComp', 1);
    collector.trackMountEnd(1);

    // Call trackUpdateEnd without trackUpdateStart
    collector.trackUpdateEnd(1);

    const log = collector.flush(1);
    expect(log!.metrics.updateCount).toBe(0);
    expect(log!.metrics.avgUpdateMs).toBe(0);
    expect(log!.metrics.maxUpdateMs).toBe(0);
  });

  it('discards negative elapsed time from clock skew', () => {
    const collector = new Collector();

    collector.trackMountStart('TestComp', 1);
    collector.trackMountEnd(1);

    now = 100;
    collector.trackUpdateStart(1);
    now = 50; // clock went backwards
    collector.trackUpdateEnd(1);

    // second trackUpdateEnd without new trackUpdateStart must also be discarded
    now = 200;
    collector.trackUpdateEnd(1);

    const log = collector.flush(1);
    expect(log!.metrics.updateCount).toBe(0);
    expect(log!.metrics.avgUpdateMs).toBe(0);
    expect(log!.signals.clockSkewDetected).toBe(true);
  });

  it('handles sub-millisecond update durations without drift', () => {
    const collector = new Collector();

    collector.trackMountStart('TestComp', 1);
    collector.trackMountEnd(1);

    const count = 10_000;
    for (let i = 0; i < count; i++) {
      now = i * 0.1;
      collector.trackUpdateStart(1);
      now = i * 0.1 + 0.1;
      collector.trackUpdateEnd(1);
    }

    const log = collector.flush(1);
    expect(log!.metrics.updateCount).toBe(count);
    expect(log!.metrics.avgUpdateMs).toBeCloseTo(0.1, 5);
    expect(log!.metrics.maxUpdateMs).toBeCloseTo(0.1, 5);
  });

  it('ignores operations on unknown uid', () => {
    const collector = new Collector();

    // None of these should throw
    collector.trackMountEnd(999);
    collector.trackPaint(999, 10);
    collector.trackUpdateStart(999);
    collector.trackUpdateEnd(999);
    collector.trackNodeCount(999, 100);
  });
});
