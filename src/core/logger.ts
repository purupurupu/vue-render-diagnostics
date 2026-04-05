import type { VRTComponentLog, VRTIssueSeverity, VRTLogLevel, VRTPluginOptions } from '../types.ts';
import { VRT_PREFIX } from '../constants.ts';

const SEVERITY_ORDER: Record<VRTIssueSeverity, number> = { info: 0, warn: 1, error: 2 };
const LEVEL_THRESHOLD: Record<VRTLogLevel, number> = {
  all: -1,
  issues: 0,
  warn: 1,
  error: 2,
  silent: 3,
};

function getMaxSeverity(issues: VRTComponentLog['issues']): VRTIssueSeverity | null {
  if (issues.length === 0) return null;
  let max: VRTIssueSeverity = issues[0].severity;
  for (let i = 1; i < issues.length; i++) {
    if (SEVERITY_ORDER[issues[i].severity] > SEVERITY_ORDER[max]) {
      max = issues[i].severity;
    }
  }
  return max;
}

function shouldLog(maxSeverity: VRTIssueSeverity | null, level: VRTLogLevel): boolean {
  if (level === 'silent') return false;
  if (level === 'all') return true;
  if (maxSeverity === null) return false;
  return SEVERITY_ORDER[maxSeverity] >= LEVEL_THRESHOLD[level];
}

export function emitLog(log: VRTComponentLog, options: VRTPluginOptions): void {
  if (options.logToConsole !== false) {
    const level = options.logLevel ?? 'all';
    const maxSeverity = getMaxSeverity(log.issues);

    if (shouldLog(maxSeverity, level)) {
      const method = maxSeverity === 'error' ? 'error' : maxSeverity === 'warn' ? 'warn' : 'log';
      console[method](VRT_PREFIX, JSON.stringify(log));
    }
  }
  options.onLog?.(log);
}
