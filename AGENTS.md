# AI Agent Instructions

> **Human contributors:** see [CLAUDE.md](./CLAUDE.md) for commands and project overview.

## Code Style

- ESM modules, `import type` for type-only imports (`verbatimModuleSyntax`)
- No barrel exports — import directly from source modules
- SFC order: `<script setup>` then `<template>`
- Tests follow `*.test.ts` naming, colocated in `src/`
- `src/core/` modules must be pure functions with zero Vue API dependency
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
