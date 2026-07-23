# JoJo Flora

Women's Custom Clothing E-Commerce — Erode, Tamil Nadu

## Quick Start

```bash
# Install dependencies
pnpm install

# Start both dev servers (web :5173 + api :3001)
pnpm dev

# Run unit tests
pnpm test

# Run Playwright E2E tests
pnpm test:e2e

# Format + lint
pnpm format
pnpm lint

# Type check
pnpm typecheck
```

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 · Vite 7 · Tailwind CSS 4 · shadcn/ui |
| Backend | Node.js 20 · Express 5 · TypeScript 5 |
| Testing | Vitest 4 (unit) · Playwright 1.58 (e2e) |
| Quality | ESLint 9 · Prettier 3 · Husky 9 · Commitlint |

## Workspace Structure

```
jojo-flora/
├── apps/web/    ← React frontend
├── apps/api/    ← Express backend
└── package.json ← root scripts + workspace tooling
```

## Commit Convention

This project uses [Conventional Commits](https://conventionalcommits.org).

```
feat(web): add login page
fix(api): prevent duplicate order creation
docs: update README
chore: upgrade dependencies
```

## License

UNLICENSED — Proprietary. All rights reserved.
