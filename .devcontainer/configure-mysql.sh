#!/usr/bin/env bash
# ======================================================================
# configure-mysql.sh - Script modular para configuração do MySQL/MariaDB
# ======================================================================
# Este script configura o MySQL/MariaDB usando variáveis de ambiente
# Variáveis esperadas:
#   - MYSQL_ROOT_PASSWORD
#   - MYSQL_DATABASE
#   - MYSQL_USER
#   - MYSQL_PASSWORD
#   - MYSQL_HOST
#   - MYSQL_CHARSET
#   - MYSQL_COLLATION
#
# EN: configure-mysql.sh - Modular script to configure MySQL/MariaDB
# EN: Expected environment variables:
# EN:   - MYSQL_ROOT_PASSWORD
# EN:   - MYSQL_DATABASE
# EN:   - MYSQL_USER
# EN:   - MYSQL_PASSWORD
# EN:   - MYSQL_HOST
# EN:   - MYSQL_CHARSET
# EN:   - MYSQL_COLLATION
# ======================================================================

set -euo pipefail

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[MySQL Config]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[MySQL Config]${NC} $1"
}

log_error() {
    echo -e "${RED}[MySQL Config]${NC} $1"
}

# ==============================================================================
# Função: Iniciar serviço MySQL/MariaDB
# ==============================================================================
start_mysql_service() {
    log_info "Iniciando serviço MySQL/MariaDB..."
    
    if service mariadb start 2>/dev/null; then
        log_info "MariaDB iniciado com sucesso"
        return 0
    elif service mysql start 2>/dev/null; then
        log_info "MySQL iniciado com sucesso"
        return 0
    elif service mysqld start 2>/dev/null; then
        log_info "MySQLd iniciado com sucesso"
        return 0
    else
        log_error "Falha ao iniciar MySQL/MariaDB"
        return 1
    fi
}

# ==============================================================================
# Função: Aguardar MySQL/MariaDB estar pronto
# ==============================================================================
wait_for_mysql() {
    local max_attempts=${1:-30}
    local attempt=0
    
    log_info "Aguardando MySQL/MariaDB estar pronto (máx: ${max_attempts}s)..."
    
    if ! command -v mysqladmin >/dev/null 2>&1; then
        log_warn "mysqladmin não encontrado, pulando verificação de disponibilidade"
        sleep 3
        return 0
    fi
    
    while ! mysqladmin ping --silent 2>/dev/null; do
        attempt=$((attempt + 1))
        if [ "$attempt" -ge "$max_attempts" ]; then
            log_error "Timeout aguardando MySQL/MariaDB após ${max_attempts}s"
            return 1
        fi
        sleep 1
    done
    
    log_info "MySQL/MariaDB está pronto após ${attempt}s"
    return 0
}

# ==============================================================================
# Função: Configurar MySQL/MariaDB
# ==============================================================================
configure_mysql() {
    local root_pass="${MYSQL_ROOT_PASSWORD:-root}"
    local db_name="${MYSQL_DATABASE:-devdb}"
    local db_user="${MYSQL_USER:-devuser}"
    local db_pass="${MYSQL_PASSWORD:-devpass}"
    local db_charset="${MYSQL_CHARSET:-utf8mb4}"
    local db_collation="${MYSQL_COLLATION:-utf8mb4_unicode_ci}"
    
    log_info "Aplicando configurações do MySQL/MariaDB..."
    log_info "  - Root Password: ${root_pass:0:3}*** (oculto)"
    log_info "  - Database: $db_name"
    log_info "  - User: $db_user"
    log_info "  - Charset: $db_charset"
    log_info "  - Collation: $db_collation"
    
    # Determinar comando mysql/mariadb
    local mysql_cmd="mysql"
    if command -v mariadb >/dev/null 2>&1; then
        mysql_cmd="mariadb"
    fi
    
    # Executar SQL de configuração (idempotente)
    # MariaDB usa unix_socket por padrão, precisamos executar como usuário mysql do sistema
    # ou usar sudo -u root para assumir identidade de root do sistema
    if ! sudo -i $mysql_cmd <<SQL; then
-- Configurar senha do root (permitir autenticação por senha também)
ALTER USER IF EXISTS 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('${root_pass}');
FLUSH PRIVILEGES;

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS \`${db_name}\` 
    CHARACTER SET ${db_charset} 
    COLLATE ${db_collation};

-- Criar usuário e conceder permissões
CREATE USER IF NOT EXISTS '${db_user}'@'localhost' IDENTIFIED BY '${db_pass}';
CREATE USER IF NOT EXISTS '${db_user}'@'127.0.0.1' IDENTIFIED BY '${db_pass}';
CREATE USER IF NOT EXISTS '${db_user}'@'%' IDENTIFIED BY '${db_pass}';

-- Conceder permissões totais no banco de dados
GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'localhost';
GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'%';

-- Aplicar mudanças
FLUSH PRIVILEGES;
SQL
        log_error "Falha ao executar SQL de configuração"
        return 1
    fi
    
    log_info "Configurações do MySQL/MariaDB aplicadas com sucesso!"
    return 0
}

# ==============================================================================
# Função: Criar arquivo de configuração MySQL para cliente
# ==============================================================================
create_mysql_client_config() {
    local root_pass="${MYSQL_ROOT_PASSWORD:-root}"
    local config_file="/root/.my.cnf"
    
    log_info "Criando arquivo de configuração do cliente MySQL em $config_file"
    
    cat > "$config_file" <<EOF
[client]
user=root
password=${root_pass}
host=localhost

[mysql]
database=${MYSQL_DATABASE:-devdb}

[mysqldump]
user=root
password=${root_pass}
EOF
    
    chmod 600 "$config_file"
    log_info "Arquivo de configuração criado com sucesso"
}

# ==============================================================================
# Função: Exibir informações de conexão
# ==============================================================================
show_connection_info() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "INFORMAÇÕES DE CONEXÃO DO MYSQL/MARIADB"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Host: ${MYSQL_HOST:-127.0.0.1}"
    log_info "Port: ${MYSQL_PORT:-3306}"
    log_info "Database: ${MYSQL_DATABASE:-devdb}"
    log_info "Username: ${MYSQL_USER:-devuser}"
    log_info "Password: ${MYSQL_PASSWORD:-devpass}"
    log_info ""
    log_info "Root Username: root"
    log_info "Root Password: ${MYSQL_ROOT_PASSWORD:-root}"
    log_info ""
    log_info "Conectar como root:"
    log_info "  mysql -u root -p${MYSQL_ROOT_PASSWORD:-root}"
    log_info ""
    log_info "Conectar como usuário:"
    log_info "  mysql -u ${MYSQL_USER:-devuser} -p${MYSQL_PASSWORD:-devpass} ${MYSQL_DATABASE:-devdb}"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ==============================================================================
# MAIN - Execução principal
# ==============================================================================
main() {
    log_info "Iniciando configuração do MySQL/MariaDB..."
    
    # Passo 1: Iniciar serviço
    if ! start_mysql_service; then
        log_error "Não foi possível iniciar o MySQL/MariaDB"
        exit 1
    fi
    
    # Passo 2: Aguardar serviço estar pronto
    if ! wait_for_mysql 30; then
        log_warn "MySQL/MariaDB pode não estar completamente pronto"
    fi
    
    # Passo 3: Configurar MySQL
    if ! configure_mysql; then
        log_error "Erro ao configurar MySQL/MariaDB"
        exit 1
    fi
    
    # Passo 4: Criar configuração do cliente
    create_mysql_client_config
    
    # Passo 5: Exibir informações
    show_connection_info
    
    log_info "Configuração do MySQL/MariaDB concluída com sucesso!"
}

# Executar apenas se chamado diretamente (não via source)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
