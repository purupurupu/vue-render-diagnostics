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
- `pnpm playground` — Dev server for the playground app

Package manager is **pnpm** (not npm/yarn).
