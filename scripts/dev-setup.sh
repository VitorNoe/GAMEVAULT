#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# GameVault — Developer Setup
# One command to bootstrap a fresh dev environment with demo data.
#
# Usage:
#   ./scripts/dev-setup.sh          # local mode (bare-metal Node + Docker DB)
#   ./scripts/dev-setup.sh --docker # full Docker Compose mode
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${BLUE}ℹ  $*${NC}"; }
ok()    { echo -e "${GREEN}✅ $*${NC}"; }
warn()  { echo -e "${YELLOW}⚠️  $*${NC}"; }
fail()  { echo -e "${RED}❌ $*${NC}"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

MODE="local"
[[ "${1:-}" == "--docker" ]] && MODE="docker"

echo ""
echo -e "${BOLD}🎮  GameVault — Developer Setup ($MODE mode)${NC}"
echo "─────────────────────────────────────────────"
echo ""

# ── Pre-flight checks ───────────────────────────────────────
command -v node  &>/dev/null || fail "Node.js is required. Install 18+ from https://nodejs.org"
command -v docker &>/dev/null || fail "Docker is required. Install from https://docs.docker.com/get-docker"

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
(( NODE_VER >= 18 )) || fail "Node.js 18+ required (found v$NODE_VER)"

ok "Node.js $(node -v)  •  npm $(npm -v)"
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
echo ""

# ── Env files ────────────────────────────────────────────────
create_env() {
  local src="$1" dst="$2"
  if [[ ! -f "$dst" ]]; then
    cp "$src" "$dst"
    ok "Created $dst from example"
  else
    warn "$dst already exists — skipping"
  fi
}

create_env "$ROOT_DIR/.env.example"             "$ROOT_DIR/.env"
create_env "$ROOT_DIR/backend/.env.example"     "$ROOT_DIR/backend/.env"
[[ -f "$ROOT_DIR/frontend-web/.env.example" ]] && \
  create_env "$ROOT_DIR/frontend-web/.env.example" "$ROOT_DIR/frontend-web/.env"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DOCKER MODE — everything via docker compose
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if [[ "$MODE" == "docker" ]]; then
  info "Starting all services via Docker Compose (dev profile)…"
  cd "$ROOT_DIR"
  docker compose --profile dev up --build -d

  info "Waiting for Postgres to be healthy…"
  for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U postgres -d gamevault &>/dev/null; then
      break
    fi
    sleep 2
  done
  ok "Postgres is ready"

  info "Running migrations…"
  docker compose exec -T backend-dev npx ts-node src/scripts/migrate.ts || true

  info "Seeding demo data…"
  docker compose exec -T backend-dev npx ts-node src/scripts/seed.ts || true

  echo ""
  echo -e "${BOLD}🎉  GameVault is running!${NC}"
  echo ""
  echo "  🌐 Frontend:   http://localhost:3001"
  echo "  🔌 Backend:    http://localhost:3000"
  echo "  📖 API Docs:   http://localhost:3000/api/docs"
  echo "  📊 Metrics:    http://localhost:3000/metrics"
  echo "  💾 pgAdmin:    http://localhost:5050  (admin@gamevault.com / admin)"
  echo ""
  echo "  Stop:  docker compose --profile dev down"
  echo ""
  exit 0
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LOCAL MODE — Docker only for DB, Node runs natively
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. Start infrastructure containers (postgres, redis)
info "Starting Postgres & Redis via Docker Compose…"
cd "$ROOT_DIR"
docker compose up -d postgres redis
info "Waiting for Postgres to be healthy…"
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U postgres -d gamevault &>/dev/null; then
    break
  fi
  sleep 2
done
ok "Postgres is ready"
echo ""

# 2. Install dependencies
info "Installing backend dependencies…"
cd "$ROOT_DIR/backend"
npm install --silent
ok "Backend deps installed"

info "Installing frontend dependencies…"
cd "$ROOT_DIR/frontend-web"
npm install --silent --legacy-peer-deps 2>/dev/null || npm install --silent
ok "Frontend deps installed"
echo ""

# 3. Migrations + Seed
cd "$ROOT_DIR/backend"

info "Running migrations…"
npx ts-node src/scripts/migrate.ts || true

info "Seeding demo data…"
npx ts-node src/scripts/seed.ts || true
echo ""

# 4. Print summary
echo -e "${BOLD}🎉  Setup complete!${NC}"
echo ""
echo "Start the servers:"
echo ""
echo -e "  ${BLUE}Terminal 1 — Backend:${NC}"
echo "    cd backend && npm run dev"
echo ""
echo -e "  ${BLUE}Terminal 2 — Frontend:${NC}"
echo "    cd frontend-web && npm start"
echo ""
echo "  🔌 Backend:    http://localhost:3000"
echo "  🌐 Frontend:   http://localhost:3001"
echo "  📖 API Docs:   http://localhost:3000/api/docs"
echo "  📊 Metrics:    http://localhost:3000/metrics"
echo ""
echo -e "${BOLD}Demo accounts (password: Password123!):${NC}"
echo "  Admin:  admin@gamevault.com"
echo "  User:   john@example.com  |  jane@example.com"
echo "  Demo:   demo@gamevault.com | speedrun@example.com"
echo ""
