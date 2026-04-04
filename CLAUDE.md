# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vue-render-diagnostics is a Vue 3 plugin that captures component rendering metrics and outputs AI-optimized structured JSON logs. Designed for consumption by Claude, Codex, and MCP tools via the `[VRT]` log prefix.

## Commands

- `pnpm dev` — Watch-mode build (`vite build --watch`)
- `pnpm build` — Type-check with `tsc -b` then bundle with Vite
- `pnpm typecheck` — Type-check only (`tsc -b`)
- `pnpm lint` — Lint with Oxlint
- `pnpm fmt` — Format with Oxfmt
- `pnpm fmt:check` — Check formatting without writing
- `pnpm test` — Run tests with Vitest
- `pnpm test:watch` — Run tests in watch mode

Package manager is **pnpm** (not npm/yarn). Runtime: Node.js 24, pnpm 10 (managed via `.mise.toml`).

## Tech Stack

- **Build**: Vite 8 library mode (ESM + UMD output)
- **Language**: TypeScript 6 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`)
- **Framework**: Vue 3.3+ (peer dependency)
- **Linting**: Oxlint (`.oxlintrc.json`) — plugin: typescript
- **Formatting**: Oxfmt (`.oxfmtrc.jsonc`) — singleQuote, trailingComma all, printWidth 100
- **Testing**: Vitest (`vitest.config.ts`, happy-dom environment)

## Architecture

Vue plugin library distributed as ESM/UMD with TypeScript declarations.

### Core Engine (`src/core/`)

Pure-function modules with zero Vue API dependency — fully testable:

- `timer.ts` — `performance.now()` wrapper and paint time measurement
- `detector.ts` — Issue detection from metrics against thresholds
- `logger.ts` — `[VRT]` prefixed structured JSON console output
- `collector.ts` — Per-component metrics accumulation across lifecycle hooks

### Vue Integration (`src/hooks/`)

- `mixin.ts` — Global mixin for automatic component tracking
- `useRenderDiagnostics.ts` — Composition API composable for per-component opt-in

### Plugin (`src/plugin.ts`)

Vue plugin `install()` function — option merging, collector creation, provide/inject, mixin registration. Disabled in production by default.

### Log Format

```json
{
  "type": "vrt:component",
  "component": "ComponentName",
  "timestamp": 1710000000000,
  "metrics": { "mountTimeMs": 120, "paintTimeMs": 140, ... },
  "signals": { "hasAsyncInSetup": true, ... },
  "issues": [{ "id": "slow-mount", "severity": "warn", ... }]
}
```

## Code Style

- ESM modules (`"type": "module"`)
- Use `import type` for type-only imports (`verbatimModuleSyntax` is enabled)
- No barrel exports — import directly from the source module
- Format with Oxfmt before committing
- Tests colocated in `src/` as `*.test.ts`

## Commit Rules

- Make small, meaningful commits (1 commit = 1 logical change)
- Focus on "why" in commit messages, not "what" changed
- Format: `<type>: <why-focused message>`
  - type: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- Write messages in English
- Add a body after a blank line when extra context is needed
- Run `pnpm fmt` before committing to apply formatting
- Run `pnpm build` or `pnpm lint` before committing to verify nothing is broken

## PR Rules

- Title and body must be written in **English**
- Title: short (under 70 chars), format `<type>: <concise description>`
- Body structure:
  - `## Summary` — bullet points describing what and why
  - `## Test plan` — checklist of verification steps
- Link to related issues if applicable
