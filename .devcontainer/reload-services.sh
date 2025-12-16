#!/usr/bin/env bash
# ======================================================================
# reload-services.sh - Script para recarregar serviços após mudanças no .env
# ======================================================================
# Este script reaplica todas as configurações dos módulos e reinicia os serviços
# Use este script quando modificar o arquivo .env e quiser aplicar as mudanças
# sem reconstruir o container
#
# EN: reload-services.sh - Reapply module configurations and restart services
# EN: Run this after editing `.devcontainer/.env` to apply changes without
# EN: rebuilding the devcontainer image.
# ======================================================================

set -euo pipefail

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log_section() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_info() {
    echo -e "${GREEN}[reload]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[reload]${NC} $1"
}

log_error() {
    echo -e "${RED}[reload]${NC} $1"
}

# ==============================================================================
# Detectar workspace
# ==============================================================================

detect_workspace() {
    # Tentar detectar o workspace automaticamente
    if [ -n "${CODESPACE_NAME:-}" ]; then
        # Estamos em um Codespace
        echo "/workspaces/$(basename "$PWD")"
    elif [ -d "/workspaces" ]; then
        # Procurar por diretório em /workspaces
        local workspace_dir=$(find /workspaces -maxdepth 1 -type d ! -path /workspaces | head -n1)
        if [ -n "$workspace_dir" ]; then
            echo "$workspace_dir"
        else
            echo "$PWD"
        fi
    else
        echo "$PWD"
    fi
}

WORKDIR=$(detect_workspace)

log_section "RECARREGANDO CONFIGURAÇÕES E SERVIÇOS"
log_info "Workspace: $WORKDIR"

# ==============================================================================
# Carregar variáveis de ambiente do .env
# ==============================================================================

ENV_FILE="${WORKDIR}/.devcontainer/.env"

if [ -f "$ENV_FILE" ]; then
    log_info "Carregando variáveis de ambiente de $ENV_FILE"
    
    # Carregar .env, ignorando comentários e linhas vazias
    set -a
    source <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | sed 's/\r$//')
    set +a
    
    log_info "✓ Variáveis de ambiente carregadas"
else
    log_warn "Arquivo .env não encontrado em $ENV_FILE"
    log_warn "Usando valores padrão das variáveis de ambiente"
fi

# ==============================================================================
# Reconfigurar PHP
# ==============================================================================

log_section "RECONFIGURANDO PHP"
if command -v configure-php.sh >/dev/null 2>&1; then
    if configure-php.sh; then
        log_info "✓ PHP reconfigurado"
    else
        log_warn "Erro ao reconfigurar PHP"
    fi
else
    log_warn "Script configure-php.sh não encontrado"
fi

# ==============================================================================
# Reconfigurar Apache
# ==============================================================================

log_section "RECONFIGURANDO APACHE"
if command -v configure-apache.sh >/dev/null 2>&1; then
    if configure-apache.sh "$WORKDIR"; then
        log_info "✓ Apache reconfigurado"
    else
        log_error "Erro ao reconfigurar Apache"
    fi
else
    log_error "Script configure-apache.sh não encontrado"
fi

# ==============================================================================
# Reconfigurar phpMyAdmin
# ==============================================================================

log_section "RECONFIGURANDO PHPMYADMIN"
if command -v configure-phpmyadmin.sh >/dev/null 2>&1; then
    if configure-phpmyadmin.sh; then
        log_info "✓ phpMyAdmin reconfigurado"
    else
        log_warn "Erro ao reconfigurar phpMyAdmin"
    fi
else
    log_warn "Script configure-phpmyadmin.sh não encontrado"
fi

# ==============================================================================
# Reiniciar serviços
# ==============================================================================

log_section "REINICIANDO SERVIÇOS"

# Reiniciar Apache
log_info "Reiniciando Apache..."
if service apache2 restart 2>/dev/null; then
    log_info "✓ Apache reiniciado"
elif service httpd restart 2>/dev/null; then
    log_info "✓ Apache (httpd) reiniciado"
else
    log_error "Falha ao reiniciar Apache"
fi

# Reiniciar MySQL/MariaDB
log_info "Reiniciando MySQL/MariaDB..."
if service mariadb restart 2>/dev/null; then
    log_info "✓ MariaDB reiniciado"
elif service mysql restart 2>/dev/null; then
    log_info "✓ MySQL reiniciado"
elif service mysqld restart 2>/dev/null; then
    log_info "✓ MySQLd reiniciado"
else
    log_warn "Não foi possível reiniciar MySQL/MariaDB"
fi

# Aguardar MySQL estar pronto
if command -v mysqladmin >/dev/null 2>&1; then
    log_info "Aguardando MySQL/MariaDB estar pronto..."
    i=0
    until mysqladmin ping --silent >/dev/null 2>&1; do
        i=$((i+1))
        if [ "$i" -ge 20 ]; then
            log_warn "Timeout aguardando MySQL/MariaDB"
            break
        fi
        sleep 1
    done
    if [ "$i" -lt 20 ]; then
        log_info "✓ MySQL/MariaDB está pronto"
    fi
fi

# ==============================================================================
# Verificar status dos serviços
# ==============================================================================

log_section "STATUS DOS SERVIÇOS"

# Verificar Apache
if service apache2 status 2>/dev/null | grep -q "active (running)"; then
    log_info "✓ Apache está rodando"
elif service httpd status 2>/dev/null | grep -q "active (running)"; then
    log_info "✓ Apache (httpd) está rodando"
else
    log_warn "⚠ Apache pode não estar rodando"
fi

# Verificar MySQL
if service mariadb status 2>/dev/null | grep -q "active (running)"; then
    log_info "✓ MariaDB está rodando"
elif service mysql status 2>/dev/null | grep -q "active (running)"; then
    log_info "✓ MySQL está rodando"
else
    log_warn "⚠ MySQL/MariaDB pode não estar rodando"
fi

# ==============================================================================
# Finalização
# ==============================================================================

log_section "RELOAD CONCLUÍDO"
log_info ""
log_info "✨ Serviços recarregados com sucesso!"
log_info ""
log_info "📝 Logs disponíveis em:"
log_info "   Apache: /var/log/apache2/error.log"
log_info "   MySQL: /var/log/mysql/error.log"
log_info "   PHP: /var/log/php_errors.log"
log_info ""
log_info "💡 Dica: Se as mudanças não surtirem efeito, tente:"
log_info "   1. Reconstruir o container (rebuild)"
log_info "   2. Executar: bash .devcontainer/init.sh <repo-name>"
log_info ""