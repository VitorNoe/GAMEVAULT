#!/usr/bin/env bash
# ======================================================================
# init.sh - Script principal de inicialização do ambiente de desenvolvimento
# ======================================================================
# Este script orquestra todos os módulos de configuração usando variáveis
# de ambiente definidas no arquivo .env
#
# EN: init.sh - Main bootstrap script for the development environment
# EN: This script orchestrates the modular configuration scripts using
# EN: environment variables defined in `.devcontainer/.env`.
# ======================================================================

set -euo pipefail

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ==============================================================================
# Funções auxiliares
# ==============================================================================

log_section() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_info() {
    echo -e "${GREEN}[init]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[init]${NC} $1"
}

log_error() {
    echo -e "${RED}[init]${NC} $1"
}

# ==============================================================================
# Validação e configuração inicial
# ==============================================================================

REPO_BASENAME="${1:-}"
if [ -z "$REPO_BASENAME" ]; then
    log_error "Usage: init.sh <repo-basename>"
    exit 1
fi

WORKDIR="/workspaces/${REPO_BASENAME}"

log_section "INICIANDO CONFIGURAÇÃO DO AMBIENTE"
log_info "Repository: ${REPO_BASENAME}"
log_info "Workspace: ${WORKDIR}"

# ==============================================================================
# Carregar variáveis de ambiente do .env (se existir)
# ==============================================================================

ENV_FILE="/workspaces/${REPO_BASENAME}/.devcontainer/.env"

if [ -f "$ENV_FILE" ]; then
    log_info "Carregando variáveis de ambiente de $ENV_FILE"
    
    # Carregar .env, ignorando comentários e linhas vazias
    set -a
    source <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | sed 's/\r$//')
    set +a
    
    log_info "✓ Variáveis de ambiente carregadas com sucesso"
else
    log_warn "Arquivo .env não encontrado em $ENV_FILE"
    log_warn "Usando valores padrão das variáveis de ambiente"
    log_warn "Copie .env.example para .env e personalize as configurações"
fi

# ==============================================================================
# Exibir configurações que serão aplicadas
# ==============================================================================

log_section "CONFIGURAÇÕES DO AMBIENTE"
log_info "MySQL/MariaDB:"
log_info "  - Database: ${MYSQL_DATABASE:-devdb}"
log_info "  - User: ${MYSQL_USER:-devuser}"
log_info "  - Host: ${MYSQL_HOST:-127.0.0.1}"
log_info ""
log_info "Apache:"
log_info "  - DocumentRoot: ${APACHE_DOCUMENT_ROOT:-public}"
log_info "  - Port: ${APACHE_PORT:-80}"
log_info "  - ServerName: ${APACHE_SERVER_NAME:-localhost}"
log_info ""
log_info "PHP:"
log_info "  - Memory Limit: ${PHP_MEMORY_LIMIT:-256M}"
log_info "  - Upload Max: ${PHP_UPLOAD_MAX_FILESIZE:-64M}"
log_info "  - Timezone: ${TZ:-America/Sao_Paulo}"

# ==============================================================================
# Executar módulos de configuração
# ==============================================================================

# Módulo 1: Configurar MySQL/MariaDB
log_section "CONFIGURANDO MYSQL/MARIADB"
if command -v configure-mysql.sh >/dev/null 2>&1; then
    if ! configure-mysql.sh; then
        log_error "Erro ao configurar MySQL/MariaDB"
        exit 1
    fi
else
    log_error "Script configure-mysql.sh não encontrado"
    exit 1
fi

# Módulo 2: Configurar PHP
log_section "CONFIGURANDO PHP"
if command -v configure-php.sh >/dev/null 2>&1; then
    if ! configure-php.sh; then
        log_warn "Erro ao configurar PHP (não crítico)"
    fi
else
    log_warn "Script configure-php.sh não encontrado"
fi

# Módulo 3: Configurar Apache
log_section "CONFIGURANDO APACHE"
if command -v configure-apache.sh >/dev/null 2>&1; then
    if ! configure-apache.sh "$WORKDIR"; then
        log_error "Erro ao configurar Apache"
        exit 1
    fi
else
    log_error "Script configure-apache.sh não encontrado"
    exit 1
fi

# Módulo 4: Configurar phpMyAdmin
log_section "CONFIGURANDO PHPMYADMIN"
if command -v configure-phpmyadmin.sh >/dev/null 2>&1; then
    if ! configure-phpmyadmin.sh; then
        log_warn "Erro ao configurar phpMyAdmin (não crítico)"
    fi
else
    log_warn "Script configure-phpmyadmin.sh não encontrado"
fi

# ==============================================================================
# Ajustar permissões finais
# ==============================================================================

log_section "AJUSTANDO PERMISSÕES"
log_info "Ajustando permissões do workspace..."
chown -R www-data:www-data "${WORKDIR}" 2>/dev/null || true
log_info "Permissões ajustadas"

# ==============================================================================
# Finalização
# ==============================================================================

log_section "AMBIENTE CONFIGURADO COM SUCESSO!"

# Exibir resumo final
echo ""
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "RESUMO - COMO ACESSAR"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info ""
log_info "🌐 Aplicação Web:"
log_info "   http://localhost:${APACHE_PORT:-80}"
log_info ""
log_info "🗄️  phpMyAdmin:"
log_info "   http://localhost:${APACHE_PORT:-80}/phpmyadmin"
log_info "   User: root / Password: ${MYSQL_ROOT_PASSWORD:-root}"
log_info ""
log_info "🔧 MySQL/MariaDB (CLI):"
log_info "   mysql -u root -p${MYSQL_ROOT_PASSWORD:-root}"
log_info "   mysql -u ${MYSQL_USER:-devuser} -p${MYSQL_PASSWORD:-devpass} ${MYSQL_DATABASE:-devdb}"
log_info ""
log_info "📁 DocumentRoot:"
doc_root_path="${WORKDIR}/${APACHE_DOCUMENT_ROOT:-public}"
if [[ "${APACHE_DOCUMENT_ROOT:-public}" == /* ]]; then
    doc_root_path="${APACHE_DOCUMENT_ROOT:-public}"
fi
log_info "   ${doc_root_path}"
log_info ""
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info ""
log_info "✨ Ambiente pronto para desenvolvimento!"
log_info "💡 Dica: Para reconfigurar, edite .devcontainer/.env e execute:"
log_info "   bash .devcontainer/reload-services.sh"
log_info ""