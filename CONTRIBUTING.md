# Contributing

Thanks for your interest in contributing to vue-render-diagnostics!

## Development Setup

```bash
# Clone and install
git clone https://github.com/purupurupu/vue-render-diagnostics.git
cd vue-render-diagnostics
pnpm install

# Development
pnpm dev          # watch-mode build
pnpm playground   # dev server with test app

# Verify
pnpm fmt          # format
pnpm lint         # lint
pnpm typecheck    # type-check
pnpm test         # run tests
pnpm build        # full build
```

Requires Node.js 24+ and pnpm 10+ (managed via `.mise.toml`).

## Project Structure

- `src/core/` — Pure-function modules (no Vue dependency)
- `src/plugin/` — Vue plugin integration layer
- `src/composables/` — Vue composables
- `src/utils/` — Shared utilities
- `playground/` — Development test app

## Before Submitting a PR

1. Run `pnpm fmt` to format
2. Run `pnpm lint` to lint
3. Run `pnpm test` to verify all tests pass
4. Run `pnpm build` to verify the build succeeds
5. Write tests for new functionality
6. Keep commits small and focused — one logical change per commit

## Commit Messages

Format: `<type>: <why-focused message>`

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`

## Code Style

- ESM modules with `import type` for type-only imports
- No barrel exports — import directly from source modules
- `src/core/` must have zero Vue API dependency
- Tests colocated as `*.test.ts`
