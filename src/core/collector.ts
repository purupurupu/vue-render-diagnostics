import type { VRDComponentLog, VRDMetrics, VRDSignals, VRDThresholds } from '../types.ts';
import type { TimerHandle } from './timer.ts';
import { DEFAULT_THRESHOLDS } from '../constants.ts';
import { detectIssues } from './detector.ts';
import { startTimer } from './timer.ts';

interface ComponentTracker {
  componentName: string;
  mountTimer: TimerHandle | null;
  mountTimeMs: number | null;
  paintTimeMs: number | null;
  updateCount: number;
  totalUpdateMs: number;
  maxUpdateMs: number;
  nodeCount: number;
  clockSkewDetected: boolean;
  updateTimer: TimerHandle | null;
}

export class Collector {
  private trackers = new Map<number, ComponentTracker>();
  private thresholds: VRDThresholds;

  constructor(thresholds?: Partial<VRDThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  trackMountStart(name: string, uid: number): void {
    this.trackers.set(uid, {
      componentName: name,
      mountTimer: startTimer(),
      mountTimeMs: null,
      paintTimeMs: null,
      updateCount: 0,
      totalUpdateMs: 0,
      maxUpdateMs: 0,
      nodeCount: 0,
      clockSkewDetected: false,
      updateTimer: null,
    });
  }

  trackMountEnd(uid: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker?.mountTimer) return;
    const duration = tracker.mountTimer.stop();
    tracker.mountTimer = null;
    if (duration < 0) {
      tracker.clockSkewDetected = true;
      return;
    }
    tracker.mountTimeMs = duration;
  }

  trackPaint(uid: number, paintTimeMs: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker) return;
    tracker.paintTimeMs = paintTimeMs;
  }

  trackUpdateStart(uid: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker) return;
    if (tracker.updateTimer) tracker.updateTimer = null;
    tracker.updateTimer = startTimer();
  }

  trackUpdateEnd(uid: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker?.updateTimer) return;
    const duration = tracker.updateTimer.stop();
    tracker.updateTimer = null;
    if (duration < 0) {
      tracker.clockSkewDetected = true;
      return;
    }
    tracker.updateCount++;
    tracker.totalUpdateMs += duration;
    if (duration > tracker.maxUpdateMs) tracker.maxUpdateMs = duration;
  }

  trackNodeCount(uid: number, count: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker) return;
    tracker.nodeCount = count;
  }

  getUpdateCount(uid: number): number {
    return this.trackers.get(uid)?.updateCount ?? 0;
  }

  peek(uid: number): VRDComponentLog | null {
    const tracker = this.trackers.get(uid);
    if (!tracker) return null;
    return this.buildLog(tracker);
  }

  flush(uid: number): VRDComponentLog | null {
    const tracker = this.trackers.get(uid);
    if (!tracker) return null;
    this.trackers.delete(uid);
    return this.buildLog(tracker);
  }

  private buildLog(tracker: ComponentTracker): VRDComponentLog {
    const metrics: VRDMetrics = {
      mountTimeMs: tracker.mountTimeMs ?? 0,
      paintTimeMs: tracker.paintTimeMs ?? 0,
      updateCount: tracker.updateCount,
      avgUpdateMs: tracker.updateCount > 0 ? tracker.totalUpdateMs / tracker.updateCount : 0,
      maxUpdateMs: tracker.maxUpdateMs,
      nodeCount: tracker.nodeCount,
    };

    const signals: VRDSignals = {
      dataUpdateDetected: tracker.updateCount > 0,
      clockSkewDetected: tracker.clockSkewDetected,
    };

    return {
      type: 'vrt:component',
      component: tracker.componentName,
      timestamp: Date.now(),
      metrics,
      signals,
      issues: detectIssues(metrics, this.thresholds),
    };
  }
}
