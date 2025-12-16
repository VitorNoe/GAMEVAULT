# 📊 Resumo da Arquitetura Modular / Modular Architecture Summary

## 🇧🇷 Versão em Português — Resumo

Este repositório oferece uma arquitetura modular para um ambiente de desenvolvimento PHP dentro de GitHub Codespaces / devcontainer. O objetivo é permitir configuração rápida, repetível e facilmente extensível com Apache, PHP, MariaDB/MySQL e phpMyAdmin.

### 🎯 Fluxo de Configuração

```
┌─────────────────────────────────────────────────────────────────┐
# Modular Architecture Summary

This file documents the modular architecture used by this Codespaces / devcontainer template. It explains the configuration flow, reload workflow (no rebuild), modular scripts, environment variables, security recommendations, and how to extend the system.

## Overview

- Purpose: provide a repeatable, easy-to-configure PHP development environment with Apache, PHP, MariaDB/MySQL and phpMyAdmin.
- Approach: modular shell scripts are executed during container initialization (`init.sh`) and can be re-run individually or via `reload-services.sh` to apply changes without rebuilding the image.

## Architecture Diagram (simplified)

```
Codespace start
  └─ devcontainer.json (loads .env, sets build args)
     └─ Dockerfile build (installs base packages and copies scripts)
        └─ postCreateCommand: init.sh
           ├─ configure-mysql.sh
           ├─ configure-php.sh
           ├─ configure-apache.sh
           └─ configure-phpmyadmin.sh
```

## Configuration Flow

1. `devcontainer.json` loads values from the host/local `.env` (via `${localEnv:VAR}`) and sets build args.
2. Dockerfile installs required packages and copies modular scripts into the image.
3. `init.sh` runs on first container start (post-create) and executes the configure scripts in sequence.
4. Each configure script is idempotent and can be re-run to apply changes.

## Reload Workflow (no rebuild)

When you edit `.devcontainer/.env` you can apply changes without rebuilding by running:

```bash
cp .devcontainer/.env.example .devcontainer/.env   # only once to create .env
bash .devcontainer/reload-services.sh
```

`reload-services.sh` loads the new environment variables, re-runs relevant configure scripts (PHP, Apache, phpMyAdmin) and restarts services (Apache, MariaDB) where required.

## Modularity

- Each script in `.devcontainer/` has a single responsibility and can be run independently:
  - `.devcontainer/configure-mysql.sh`
  - `.devcontainer/configure-php.sh`
  - `.devcontainer/configure-apache.sh <workspace-path>`
  - `.devcontainer/configure-phpmyadmin.sh`
- `init.sh` composes these scripts for the initial setup.

## Environment Variables (priority)

Configuration precedence (higher overrides lower):

1. Default values defined in the scripts
2. `build.args` in `Dockerfile`
3. `remoteEnv` in `devcontainer.json`
4. `.devcontainer/.env` (highest priority at runtime)

Key variables live in `.devcontainer/.env.example` and include:

- Database: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`
- Apache: `APACHE_DOCUMENT_ROOT`, `APACHE_PORT`, `APACHE_SERVER_NAME`, `APACHE_ALLOW_OVERRIDE`, `APACHE_INDEXES`, `APACHE_REWRITE`
- PHP: `PHP_MEMORY_LIMIT`, `PHP_UPLOAD_MAX_FILESIZE`, `PHP_DISPLAY_ERRORS`, `PHP_MAX_EXECUTION_TIME`, `TZ`
- Optional: `INSTALL_XDEBUG`, `INSTALL_NODEJS`, `NODEJS_VERSION`, `PHPMYADMIN_BLOWFISH_SECRET`

## Security & Best Practices

- Never commit `.devcontainer/.env` into version control. Keep `.env.example` as a non-secret template.
- Use a strong `PHPMYADMIN_BLOWFISH_SECRET` (≥ 32 characters).
- Use `PHPMYADMIN_ALLOW_NO_PASSWORD=false` for safer defaults.

## Extending the System

To add a new service or module:

1. Create `configure-<service>.sh` using the existing scripts as a pattern.
2. Copy the script into the image via `Dockerfile` and mark it executable (e.g. `COPY configure-<service>.sh /usr/local/bin/` + `RUN chmod +x /usr/local/bin/configure-<service>.sh`).
3. Call the script from `init.sh` (for initial setup) or document it for manual execution.
4. Add configuration keys to `.devcontainer/.env.example` and `devcontainer.json` if needed.

## Common Use Cases & Examples

- Local development (recommended `.env` snippets):

```env
APP_ENV=development
APP_DEBUG=true
PHP_DISPLAY_ERRORS=On
PHPMYADMIN_ALLOW_NO_PASSWORD=false
```

- Testing / CI:

```env
APP_ENV=testing
MYSQL_DATABASE=test_db
PHP_MEMORY_LIMIT=512M
```

- Demo / presentation:

```env
APP_ENV=production
APP_DEBUG=false
APACHE_INDEXES=false
```

## Scripts & Key Files

- `.devcontainer/init.sh` — orchestration script executed on post-create
- `.devcontainer/reload-services.sh` — reapply configuration after `.env` changes
- `.devcontainer/configure-mysql.sh` — database initialization and user setup
- `.devcontainer/configure-php.sh` — updates `php.ini` and configures PHP
- `.devcontainer/configure-apache.sh` — sets DocumentRoot, vhost and Apache modules
- `.devcontainer/configure-phpmyadmin.sh` — writes `config.inc.php` and Apache conf for phpMyAdmin
- `.devcontainer/.env.example` — environment variable template
- `devcontainer.json` and `Dockerfile` — container build and runtime configuration

## Benefits

- Maintainability: clear separation of responsibilities across scripts
- Reusability: modules are portable across projects
- Fast iteration: reload without rebuild saves developer time
- Testability: each script can be run independently for debugging

---

File: `.devcontainer/ARCHITECTURE.md` — English-only, cleaned, concise and focused on the template's purpose and usage.
