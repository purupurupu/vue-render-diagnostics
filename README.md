# vue-render-diagnostics

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
app.use(VueRenderDiagnostics);
app.mount('#app');
```

Open your browser console — you'll see `[VRT]` prefixed JSON logs when components mount.

### Plugin Options

```ts
app.use(VueRenderDiagnostics, {
  enabled: true, // default: true
  include: ['UserList', 'Header'], // track only these components (string[] or RegExp)
  exclude: /^Internal/, // skip matching components (string[] or RegExp)
  logToConsole: true, // default: true
  logLevel: 'all', // 'all' | 'issues' | 'warn' | 'error' | 'silent'
  updateLogInterval: 10, // emit snapshot every 10 updates (default: disabled)
  thresholds: {
    mountTimeMs: 50, // default: 50
    updateTimeMs: 16, // default: 16 (one frame at 60fps)
    paintTimeMs: 50, // default: 50
    nodeCount: 1000, // default: 1000
    updateCount: 20, // default: 20
  },
  onLog: (log) => {
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
  "type": "vrt:component",
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
    "hasAsyncInSetup": true,
    "dataUpdateDetected": true
  },
  "issues": [
    {
      "id": "slow-mount",
      "severity": "warn",
      "metric": "mountTimeMs",
      "value": 120
    }
  ]
}
```

## MCP Integration

Logs use the `[VRT]` prefix for easy extraction by AI tools:

1. Extract `[VRT]` prefixed lines from console output
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
