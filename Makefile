# ─────────────────────────────────────────────────────────────
# GameVault — Makefile
# Common tasks for running the project with Docker Compose.
# ─────────────────────────────────────────────────────────────

COMPOSE = docker compose

.PHONY: help up up-dev down build logs \
        migrate seed db-setup \
        test lint shell-backend shell-frontend \
        clean

## ── Help ────────────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

## ── Start / Stop ────────────────────────────────────────────
up: ## Start all services (production build)
	$(COMPOSE) up --build -d

up-dev: ## Start dev services (hot reload, profile: dev)
	$(COMPOSE) --profile dev up --build -d

down: ## Stop and remove containers
	$(COMPOSE) --profile dev --profile tools down

build: ## Build images without starting
	$(COMPOSE) build

logs: ## Follow logs for all services
	$(COMPOSE) logs -f

## ── Database ────────────────────────────────────────────────
migrate: ## Run database migrations
	$(COMPOSE) exec backend node -e "require('./dist/scripts/migrate.js')"

migrate-dev: ## Run migrations in dev container
	$(COMPOSE) exec backend-dev npx ts-node src/scripts/migrate.ts

seed: ## Seed the database
	$(COMPOSE) exec backend node -e "require('./dist/scripts/seed.js')"

seed-dev: ## Seed in dev container
	$(COMPOSE) exec backend-dev npx ts-node src/scripts/seed.ts

db-setup: migrate seed ## Run migrate + seed

db-reset: ## Reset DB: drop volumes, reinit from schema+seed
	$(COMPOSE) down -v
	$(COMPOSE) up -d postgres
	@echo "Waiting for Postgres…"
	@sleep 5
	$(COMPOSE) up --build -d

## ── Quality ─────────────────────────────────────────────────
test: ## Run backend + frontend tests locally
	cd backend && npm test -- --forceExit
	cd frontend-web && npx react-scripts test --watchAll=false --forceExit

lint: ## Run linters locally
	cd backend && npm run lint
	cd frontend-web && npm run lint

## ── Shells ──────────────────────────────────────────────────
shell-backend: ## Open a shell in the backend container
	$(COMPOSE) exec backend sh

shell-frontend: ## Open a shell in the frontend container
	$(COMPOSE) exec frontend sh

## ── Cleanup ─────────────────────────────────────────────────
clean: ## Remove containers, volumes and built images
	$(COMPOSE) --profile dev --profile tools down -v --rmi local
	docker volume prune -f
