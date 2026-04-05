# vue-render-diagnostics

[![npm version](https://img.shields.io/npm/v/vue-render-diagnostics)](https://www.npmjs.com/package/vue-render-diagnostics)
[![CI](https://github.com/purupurupu/vue-render-diagnostics/actions/workflows/ci.yml/badge.svg)](https://github.com/purupurupu/vue-render-diagnostics/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/vue-render-diagnostics)](./LICENSE)

Vue 3 plugin that captures component rendering metrics and outputs AI-optimized structured JSON logs.

## Install

```bash
pnpm add vue-render-diagnostics
```

## Usage

```ts
import { createApp } from 'vue';
import { VueRenderDiagnostics } from 'vue-render-diagnostics';
import App from './App.vue';

const app = createApp(App);
app.use(VueRenderDiagnostics, { enabled: true });
app.mount('#app');
```

The plugin is disabled by default to prevent accidental production overhead. For dev-only activation with Vite:

```ts
app.use(VueRenderDiagnostics, { enabled: import.meta.env.DEV });
```

Open your browser console — you'll see `[VRD]` prefixed JSON logs when components mount.

### Plugin Options

```ts
app.use(VueRenderDiagnostics, {
  enabled: true, // required — default is false (opt-in only)
  include: ['UserList', 'Header'], // track only these components (string[] or RegExp)
  exclude: /^Internal/, // skip matching components (string[] or RegExp)
  logToConsole: true, // default: true
  logLevel: 'all', // console output filter — onLog still receives all logs
  updateLogInterval: 10, // emit snapshot every 10 updates (default: disabled)
  thresholds: {
    mountTimeMs: 100, // default: 100
    updateTimeMs: 16, // default: 16 (one frame at 60fps)
    paintTimeMs: 100, // default: 100
    nodeCount: 1500, // default: 1500
    updateCount: 50, // default: 50
  },
  onLog: (log) => {
    // Called for ALL logs regardless of logLevel
    sendToAnalytics(log);
  },
});
```

### Opt-in Tracking

Use the composable to track a specific component regardless of include/exclude filters:

```ts
import { useRenderDiagnostics } from 'vue-render-diagnostics';

// In setup()
useRenderDiagnostics();
```

### Programmatic Metrics Access

Query current metrics for a component at any time:

```ts
import { useRenderMetrics } from 'vue-render-diagnostics';

// In setup()
const metrics = useRenderMetrics();

// Later (e.g., in an event handler or watcher)
const log = metrics?.peek();
if (log) {
  console.log(log.metrics.updateCount);
}
```

Returns `null` if the plugin is not installed. The `peek()` method returns a read-only snapshot of the current metrics, or `null` after the component unmounts.

## Log Emission Timing

- **Mount completion** — emitted after paint measurement for every tracked component
- **Periodic updates** — when `updateLogInterval` is set, emits a snapshot every N updates
- **Unmount** — cleans up internal tracker (no log emission)

## Log Format

```json
{
  "type": "vrd:component",
  "component": "UserList",
  "timestamp": 1710000000000,
  "metrics": {
    "mountTimeMs": 120,
    "paintTimeMs": 140,
    "updateCount": 5,
    "avgUpdateMs": 18,
    "maxUpdateMs": 40,
    "nodeCount": 1200
  },
  "signals": {
    "dataUpdateDetected": true,
    "clockSkewDetected": false
  },
  "issues": [
    {
      "id": "slow-mount",
      "severity": "warn",
      "metric": "mountTimeMs",
      "value": 120,
      "threshold": 50
    }
  ]
}
```

## Known Limitations

- **Fragment components report `nodeCount: 0`** — components with multiple root nodes (fragments) set `$el` to a Text/Comment node, not an Element. DOM node counting is skipped for these components. Single-root components work correctly.

## MCP Integration

Logs use the `[VRD]` prefix for easy extraction by AI tools:

1. Extract `[VRD]` prefixed lines from console output
2. Parse as JSON
3. Analyze with Claude / Codex

## Design Philosophy

Logs are **data for AI to understand**, not text for humans to read.

- Fully structured JSON
- ID-based (no natural language in keys)
- Explicit units (ms suffix)
- Flat, extractable structure

## License

MIT
