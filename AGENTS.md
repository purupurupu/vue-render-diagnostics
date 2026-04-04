# AI Agent Instructions

> **Human contributors:** see [CLAUDE.md](./CLAUDE.md) for the full contributor guide.

This file provides context for AI coding agents (Cursor, Copilot, Windsurf, etc.) working in this repository.

## Project Structure

```
src/
  core/            Performance timer, issue detector, logger, metrics collector
  hooks/           Vue mixin and Composition API composable
  utils/           DOM utilities
  plugin.ts        Vue plugin install function
  types.ts         All TypeScript type definitions
  constants.ts     Thresholds, prefix, defaults
  index.ts         Public API exports
```

## Code Style

- ESM modules, `import type` for type-only imports (`verbatimModuleSyntax`)
- No barrel exports — import directly from source modules
- File names use kebab-case (e.g. `use-render-diagnostics.ts`)
- Tests follow `*.test.ts` naming, colocated in `src/`
- Format with Oxfmt (`singleQuote`, trailing commas, `printWidth: 100`)

## Commit & PR Guidelines

- Format: `<type>: <why-focused message>` — types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- One logical change per commit
- PR title: under 70 chars, format `<type>: <concise description>`
- PR body: `## Summary` (bullet points) + `## Test plan` (checklist)
- Write everything in English

## Pre-PR Checklist

```bash
pnpm fmt            # format
pnpm lint           # lint
pnpm build          # type-check + build
pnpm test           # unit tests
```
