# Changelog

## 0.1.0 (2026-04-05)

### Features

- **KeepAlive support** — `activated`/`deactivated` lifecycle hooks tracked with proper flush and re-initialization
- **Cancellable paint measurement** — `measurePaint` returns a `PaintHandle` with `cancel()` to prevent orphaned rAF callbacks
- **Race condition fix** — components unmounting before paint measurement completes now emit logs with `paintTimeMs: 0` instead of being silently dropped
- **SSR safety** — guards for `requestAnimationFrame` and `Element` prevent crashes in Node.js/SSR environments
- **Production guard** — plugin defaults to `enabled: false` to prevent accidental production overhead
- **Log level support** — `logLevel` option (`'all'` | `'issues'` | `'warn'` | `'error'` | `'silent'`) controls console output; uses `console.warn`/`console.error` for matching severity
- **Runtime metrics API** — `useRenderMetrics()` composable for programmatic read-only access to component metrics
- **Anonymous component tracking** — components without names are tracked with `Anonymous#uid` fallback; `useRenderDiagnostics()` warns on anonymous components
- **Threshold in issues** — `VRTIssue` includes the `threshold` value that was exceeded, with effective multiplier for severity escalation
- **Clock skew detection** — `clockSkewDetected` signal in `VRTSignals` flags measurement failures from non-monotonic clocks
- **Per-app context** — filter state (`filterCache`, `explicitlyTracked`) is scoped per Vue app instance via `provide`/`inject`, fixing multi-app state leaks

### Bug Fixes

- **RegExp lastIndex** — `include`/`exclude` filters with global flag no longer produce intermittent results
- **Math.max stack overflow** — replaced unbounded `updates[]` array with O(1) incremental aggregates (`updateCount`, `totalUpdateMs`, `maxUpdateMs`)
- **Duplicate timer discard** — `trackUpdateStart` nulls in-flight timers before starting new ones
- **filterCache leak** — `Anonymous#` prefixed names skip cache to prevent unbounded Map growth
- **countNodes safety** — `querySelectorAll` wrapped in try/catch for disconnected DOM / SVG edge cases
- **Distinct issue IDs** — `slow-update` split into `slow-update-avg` and `slow-update-max`
- **Types path** — `package.json` types field corrected to match actual `dist/src/index.d.ts` output

### Performance

- **countNodes throttled** — `querySelectorAll` only runs on log emission, not every `updated` hook
- **Timing centralized** — `Collector` delegates all timing to `timer.ts` via `startTimer()`/`TimerHandle`

### Infrastructure

- GitHub Actions CI workflow (fmt, lint, typecheck, test, build)
- Default thresholds adjusted to reduce false positives (`mountTimeMs: 100`, `paintTimeMs: 100`, `nodeCount: 1500`, `updateCount: 50`)

### Breaking Changes

- `hasAsyncInSetup` removed from `VRTSignals` (was dead code, always `false`)
- `slow-update` issue ID split into `slow-update-avg` / `slow-update-max`
- `enabled` defaults to `false` — must explicitly set `enabled: true`
- `clearFilterCache()` removed (no longer needed with per-app context)
