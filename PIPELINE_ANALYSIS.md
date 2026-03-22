# Pipeline & Workspace Analysis: Porus Monorepo

This document provides a comprehensive analysis of the current CI/CD pipelines, workspace configuration, and the suggested standards for linting, formatting, and building. Use this as a reference to replicate a similar robust pipeline in other repositories.

## 1. Monorepo Architecture

The project uses a **pnpm-based monorepo** managed by **Turbo**.

- **Package Manager:** `pnpm@9.0.0`
- **Orchestration:** `turbo@2.8.17`
- **Workspaces:**
  - `apps/api`: Express-based backend with Prisma.
  - `apps/web`: Vite/React-based frontend.
  - `packages/ui`: Shared UI utility package.
  - `packages/config/*`: Shared configurations (ESLint, TypeScript).

## 2. Tooling & Standards

### Linting (ESLint)

Both `apps/api` and `apps/web` use **ESLint 9+** (Flat Config).

- **API Standards:** Extends `typescript-eslint`, focuses on Node.js rules.
- **Web Standards:** Extends `typescript-eslint`, `react-hooks`, and `@tanstack/eslint-plugin-query`. Enforces strict type imports and prevents `no-console` and `no-duplicate-imports`.

### Formatting (Prettier)

A global Prettier configuration is used at the root.

- **Plugins:** `prettier-plugin-tailwindcss` and `@trivago/prettier-plugin-sort-imports`.
- **Command:** `prettier --write "**/*.{ts,tsx,md}"`.

### Building

Managed via **Turbo** for efficient caching.

- **API Build:** `tsc -p tsconfig.json` (Compiles TypeScript to `dist/`).
- **Web Build:** `tsc -b && vite build` (Typescript check + Vite build).

### Testing

- **API Testing:** Uses `vitest` in Node environment. Configured in `apps/api/vitest.config.ts`.
- **Command:** `pnpm --filter @porus/api test`

### Releases and Commits

The project follows **Conventional Commits** for standardizing commit messages and automating versioning.

- **Commitizen:** Used for structured commits (`cz` or `pnpm commit`).
- **Standard-Version:** Automates version bumping and changelog generation (`pnpm release`).
- **Commit Format:** Angular/Conventional standard.

## 3. Existing CI/CD Workflows

The repository uses **GitHub Actions** for deployment.

### Backend Deployment (`deploy-api.yml`)

1. **Setup:** Uses Node 24 and pnpm.
2. **Dependency Installation:** `pnpm install --filter @porus/api...` (Uses the `...` syntax to include dependencies).
3. **Database Validation:** Runs a custom script `prisma:check-migrations` to ensure migration order is correct.
4. **Validation:** Runs `pnpm --filter @porus/api lint`.
5. **Build:** Runs `pnpm --filter @porus/api build`.
6. **Deploy:** Uses **Railway CLI** to push the built API and Cron services.

### Frontend Deployment (`deploy-web.yml`)

1. **Setup:** Uses Node 24 and pnpm.
2. **Dependency Installation:** `pnpm install --filter porus-ai...`.
3. **Linting:** Orchestrated via Turbo: `pnpm turbo run lint --filter=porus-ai`.
4. **Environment:** Pulls environment variables via **Vercel CLI**.
5. **Build:** `pnpm build` (inside `apps/web`).
6. **Deploy:** Uses **Vercel CLI** to deploy the production build.

## 4. Recommended Pipeline for New Repositories

Based on this architecture, here is a suggested pipeline for a similar monorepo:

### A. Core Scripts in Root `package.json`

```json
{
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "test": "turbo run test"
  }
}
```

### B. Standardized CI Workflow Template (`.github/workflows/ci.yml`)

This pipeline should run on every pull request.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node & pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check Formatting
        run: pnpm exec prettier --check "**/*.{ts,tsx,md,json}"

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test
```

## 5. Key Takeaways for Porting

- **Strict Node Versioning:** Both workflows enforce Node 24 (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`).
- **Targeted Installation:** Use `--filter <package>...` during CI to speed up installation and avoid unnecessary package downloads.
- **Migration Check:** For database-heavy apps, always validate migrations before deployment to prevent production drift.
- **CLI-based Deployment:** The workflows favor CLI-based deployments (Railway/Vercel) over generic Docker actions for tighter integration with hosting providers.
  \n- Fixed supabase db push command to use supabase link first.
