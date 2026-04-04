import type { VRTComponentLog, VRTMetrics, VRTSignals, VRTThresholds } from '../types.ts';
import { DEFAULT_THRESHOLDS } from '../constants.ts';
import { detectIssues } from './detector.ts';

interface ComponentTracker {
  componentName: string;
  mountStart: number | null;
  mountTimeMs: number | null;
  paintTimeMs: number | null;
  updates: number[];
  nodeCount: number;
  hasAsyncInSetup: boolean;
  updateStart: number | null;
}

export class Collector {
  private trackers = new Map<number, ComponentTracker>();
  private thresholds: VRTThresholds;

  constructor(thresholds?: Partial<VRTThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  trackMountStart(name: string, uid: number): void {
    this.trackers.set(uid, {
      componentName: name,
      mountStart: performance.now(),
      mountTimeMs: null,
      paintTimeMs: null,
      updates: [],
      nodeCount: 0,
      hasAsyncInSetup: false,
      updateStart: null,
    });
  }

  trackMountEnd(uid: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker || tracker.mountStart === null) return;
    tracker.mountTimeMs = performance.now() - tracker.mountStart;
  }

  trackPaint(uid: number, paintTimeMs: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker) return;
    tracker.paintTimeMs = paintTimeMs;
  }

  trackUpdateStart(uid: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker) return;
    tracker.updateStart = performance.now();
  }

  trackUpdateEnd(uid: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker || tracker.updateStart === null) return;
    tracker.updates.push(performance.now() - tracker.updateStart);
    tracker.updateStart = null;
  }

  trackNodeCount(uid: number, count: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker) return;
    tracker.nodeCount = count;
  }

  trackAsyncSetup(uid: number): void {
    const tracker = this.trackers.get(uid);
    if (!tracker) return;
    tracker.hasAsyncInSetup = true;
  }

  getUpdateCount(uid: number): number {
    return this.trackers.get(uid)?.updates.length ?? 0;
  }

  peek(uid: number): VRTComponentLog | null {
    const tracker = this.trackers.get(uid);
    if (!tracker) return null;
    return this.buildLog(tracker);
  }

  flush(uid: number): VRTComponentLog | null {
    const tracker = this.trackers.get(uid);
    if (!tracker) return null;
    this.trackers.delete(uid);
    return this.buildLog(tracker);
  }

  private buildLog(tracker: ComponentTracker): VRTComponentLog {
    const updateCount = tracker.updates.length;
    const totalUpdateMs = tracker.updates.reduce((sum, d) => sum + d, 0);

    const metrics: VRTMetrics = {
      mountTimeMs: tracker.mountTimeMs ?? 0,
      paintTimeMs: tracker.paintTimeMs ?? 0,
      updateCount,
      avgUpdateMs: updateCount > 0 ? totalUpdateMs / updateCount : 0,
      maxUpdateMs: updateCount > 0 ? Math.max(...tracker.updates) : 0,
      nodeCount: tracker.nodeCount,
    };

    const signals: VRTSignals = {
      hasAsyncInSetup: tracker.hasAsyncInSetup,
      dataUpdateDetected: updateCount > 0,
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
