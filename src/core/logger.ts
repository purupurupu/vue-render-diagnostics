import type { VRTComponentLog, VRTPluginOptions } from '../types.ts';
import { VRT_PREFIX } from '../constants.ts';

export function emitLog(log: VRTComponentLog, options: VRTPluginOptions): void {
  if (options.logToConsole !== false) {
    console.log(VRT_PREFIX, JSON.stringify(log));
  }
  options.onLog?.(log);
}
