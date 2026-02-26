# Contributing to GameVault

Thank you for your interest in contributing to GameVault! This document explains
how to set up a development environment, run the project, and submit changes.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Running Tests](#running-tests)
6. [Code Style](#code-style)
7. [Database Changes](#database-changes)
8. [Submitting Changes](#submitting-changes)
9. [Demo Accounts & Seed Data](#demo-accounts--seed-data)

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | 18 + | Backend & Frontend runtime |
| **npm** | 9 + | Package management |
| **Docker** | 20 + | PostgreSQL, Redis, MinIO containers |
| **Docker Compose** | v2 | Multi-container orchestration |
| **Git** | 2.30 + | Version control |

> **Tip:** If you use VS Code with the Dev Containers extension, open the repo
> and select *Reopen in Container* — all tooling is pre-installed.

---

## Quick Start

### Option A — Local Node + Docker DB (recommended)

```bash
git clone https://github.com/VitorNoe/GAMEVAULT.git
cd GAMEVAULT

# One command does it all: copies .env, installs deps, starts DB, runs
# migrations and seeds demo data.
./scripts/dev-setup.sh

# Then start the servers:
cd backend   && npm run dev       # Terminal 1 — API on :3000
cd frontend-web && npm start      # Terminal 2 — UI  on :3001
```

### Option B — Full Docker Compose

```bash
git clone https://github.com/VitorNoe/GAMEVAULT.git
cd GAMEVAULT

./scripts/dev-setup.sh --docker
# Everything is now running in containers with hot-reload.
```

### Option C — Make targets

```bash
make dev-setup          # same as Option A
make dev-setup-docker   # same as Option B
make up-dev             # start dev containers (skip setup)
make db-setup           # run migrations + seed only
make db-reset           # wipe DB and recreate from scratch
```

---

## Project Structure

```
GAMEVAULT/
├── backend/              Express + TypeScript REST API
│   ├── src/
│   │   ├── config/       App, DB, Swagger, Sentry, Metrics config
│   │   ├── controllers/  Route handlers
│   │   ├── middlewares/   Auth, error handling, rate limiting, metrics
│   │   ├── models/       Sequelize models
│   │   ├── routes/       Express routers
│   │   ├── services/     Business logic
│   │   ├── scripts/      migrate.ts, seed.ts
│   │   └── utils/        Helpers & error classes
│   └── __tests__/        Jest test suites
├── frontend-web/         React + TypeScript SPA
├── mobile-app/           Flutter mobile client
├── mobile-app-rn/        React Native mobile client
├── database/             SQL schema, seed, migrations
├── scripts/              Dev-setup & quickstart helpers
├── docker-compose.yml    Full stack orchestration
└── Makefile              Common task shortcuts
```

---

## Development Workflow

1. **Create a feature branch** from `master`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes**. The backend auto-reloads via `ts-node-dev`; the
   frontend uses React's HMR.

3. **Verify** your changes compile and tests pass:
   ```bash
   cd backend && npx tsc --noEmit && npm test -- --forceExit
   ```

4. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(collection): add bulk import from CSV
   fix(auth): handle expired refresh tokens gracefully
   docs(readme): update API endpoints table
   ```

5. **Push** and open a **Pull Request** against `master`.

---

## Running Tests

```bash
# Backend unit / integration tests
cd backend && npm test -- --forceExit

# Run a single test file
cd backend && npx jest src/__tests__/auth.test.ts --forceExit

# Frontend tests
cd frontend-web && npx react-scripts test --watchAll=false --forceExit
```

---

## Code Style

- **TypeScript** strict mode is enabled (`tsconfig.json`).
- Use **ESLint** rules defined in the repo. Run `npm run lint` in backend.
- Prefer `async/await` over raw promises.
- Keep controllers thin — put logic in `services/`.

---

## Database Changes

We use a lightweight migration runner (`backend/src/scripts/migrate.ts`).

1. Create a new file in `backend/src/migrations/` following the naming
   convention:
   ```
   009_describe_change.ts
   ```

2. Export `up(qi)` and `down(qi)` functions using Sequelize's `QueryInterface`.

3. Run the migration:
   ```bash
   cd backend && npm run migrate
   ```

4. If you need to rollback:
   ```bash
   cd backend && npm run migrate:rollback
   ```

---

## Submitting Changes

1. Ensure your branch is up to date with `master`.
2. All tests pass (`npm test`).
3. TypeScript compiles without errors (`npx tsc --noEmit`).
4. Open a Pull Request with a clear description of what changed and why.
5. Link any related GitHub issue (e.g. `Closes #31`).

---

## Demo Accounts & Seed Data

After running the seed script (`npm run seed` or `make db-setup`), the
following demo accounts are available. **All passwords are `Password123!`**.

| Email | Role | Notes |
|---|---|---|
| `admin@gamevault.com` | Admin | Full access |
| `john@example.com` | Regular | Has collection, reviews, wishlist |
| `jane@example.com` | Regular | Has collection, reviews, wishlist |
| `demo@gamevault.com` | Regular | Focused on newer titles |
| `speedrun@example.com` | Regular | Speedrun-focused collection |
| `retro@example.com` | Regular | Unverified email |

### What the seed data covers

- **20+ games** across PC, PlayStation, Xbox, Nintendo
- **GOTY winners**: Baldur's Gate 3 (2023), Elden Ring (2022), TLOU2 (2020), Zelda BotW (2017)
- **RAWG-imported examples**: GTA V, Portal 2, Skyrim, Dark Souls III, God of War (with `rawg_id` set)
- **Abandonware flow**: Command & Conquer: Red Alert, System Shock 2, No One Lives Forever
- **Re-released title**: Grim Fandango (abandonware → remastered)
- **Early Access**: Hades II (65% development)
- **Upcoming / In Development**: Hollow Knight: Silksong, GTA VI
- **Preservation sources**: Internet Archive, VGHF, GOG.com, National Videogame Museum
- **Rerelease requests** with community votes
- **Reviews, collections, wishlists, notifications, user activity** across multiple users

---

## Useful Links

- **API Docs (Swagger):** http://localhost:3000/api/docs
- **Prometheus Metrics:** http://localhost:3000/metrics
- **Health Check:** http://localhost:3000/api/health
- **pgAdmin:** http://localhost:5050 (when running `make up-dev` or `--docker` mode)
