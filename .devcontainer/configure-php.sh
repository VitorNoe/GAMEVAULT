#!/usr/bin/env bash
# ======================================================================
# configure-php.sh - Script modular para configuração do PHP
# ======================================================================
# Este script configura o PHP usando variáveis de ambiente
# Variáveis esperadas:
#   - PHP_DISPLAY_ERRORS
#   - PHP_ERROR_REPORTING
#   - PHP_UPLOAD_MAX_FILESIZE
#   - PHP_POST_MAX_SIZE
#   - PHP_MEMORY_LIMIT
#   - PHP_MAX_EXECUTION_TIME
#   - TZ (timezone)
#
# EN: configure-php.sh - Modular script to configure PHP
# EN: Expected environment variables:
# EN:   - PHP_DISPLAY_ERRORS
# EN:   - PHP_ERROR_REPORTING
# EN:   - PHP_UPLOAD_MAX_FILESIZE
# EN:   - PHP_POST_MAX_SIZE
# EN:   - PHP_MEMORY_LIMIT
# EN:   - PHP_MAX_EXECUTION_TIME
# EN:   - TZ (timezone)
# ======================================================================

set -euo pipefail

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[PHP Config]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[PHP Config]${NC} $1"
}

log_error() {
    echo -e "${RED}[PHP Config]${NC} $1"
}

# ==============================================================================
# Função: Detectar versão do PHP e arquivo php.ini
# ==============================================================================
detect_php_ini() {
    local php_version
    php_version=$(php -r "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;" 2>/dev/null || echo "")
    
    if [ -z "$php_version" ]; then
        log_error "PHP não encontrado"
        return 1
    fi
    
    log_info "Versão do PHP detectada: $php_version"
    
    # Possíveis localizações do php.ini
    local possible_paths=(
        "/etc/php/${php_version}/apache2/php.ini"
        "/etc/php/${php_version}/cli/php.ini"
        "/etc/php/php.ini"
        "/usr/local/etc/php/php.ini"
    )
    
    for path in "${possible_paths[@]}"; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    
    log_error "php.ini não encontrado"
    return 1
}

# ==============================================================================
# Função: Atualizar configuração no php.ini
# ==============================================================================
update_php_ini_setting() {
    local php_ini="$1"
    local setting_key="$2"
    local setting_value="$3"
    
    # Verificar se a configuração já existe (comentada ou não)
    if grep -q "^;*${setting_key}" "$php_ini"; then
        # Substituir linha existente
        sed -i "s|^;*${setting_key}.*|${setting_key} = ${setting_value}|" "$php_ini"
    else
        # Adicionar nova linha
        echo "${setting_key} = ${setting_value}" >> "$php_ini"
    fi
}

# ==============================================================================
# Função: Configurar php.ini para Apache
# ==============================================================================
configure_php_ini_apache() {
    log_info "Configurando PHP para Apache..."
    
    local php_ini
    php_ini=$(detect_php_ini | head -n1)
    
    if [ -z "$php_ini" ] || [ ! -f "$php_ini" ]; then
        log_error "php.ini não encontrado, pulando configuração"
        return 1
    fi
    
    log_info "Usando php.ini: $php_ini"
    
    # Fazer backup do php.ini original
    if [ ! -f "${php_ini}.backup" ]; then
        cp "$php_ini" "${php_ini}.backup"
        log_info "Backup criado: ${php_ini}.backup"
    fi
    
    # Aplicar configurações
    local display_errors="${PHP_DISPLAY_ERRORS:-On}"
    local error_reporting="${PHP_ERROR_REPORTING:-E_ALL}"
    local upload_max="${PHP_UPLOAD_MAX_FILESIZE:-64M}"
    local post_max="${PHP_POST_MAX_SIZE:-64M}"
    local memory_limit="${PHP_MEMORY_LIMIT:-256M}"
    local max_execution="${PHP_MAX_EXECUTION_TIME:-300}"
    local timezone="${TZ:-America/Sao_Paulo}"
    
    log_info "Aplicando configurações:"
    log_info "  - display_errors: $display_errors"
    log_info "  - error_reporting: $error_reporting"
    log_info "  - upload_max_filesize: $upload_max"
    log_info "  - post_max_size: $post_max"
    log_info "  - memory_limit: $memory_limit"
    log_info "  - max_execution_time: $max_execution"
    log_info "  - date.timezone: $timezone"
    
    update_php_ini_setting "$php_ini" "display_errors" "$display_errors"
    update_php_ini_setting "$php_ini" "error_reporting" "$error_reporting"
    update_php_ini_setting "$php_ini" "upload_max_filesize" "$upload_max"
    update_php_ini_setting "$php_ini" "post_max_size" "$post_max"
    update_php_ini_setting "$php_ini" "memory_limit" "$memory_limit"
    update_php_ini_setting "$php_ini" "max_execution_time" "$max_execution"
    update_php_ini_setting "$php_ini" "date.timezone" "$timezone"
    
    # Configurações extras para desenvolvimento
    update_php_ini_setting "$php_ini" "display_startup_errors" "On"
    update_php_ini_setting "$php_ini" "log_errors" "On"
    update_php_ini_setting "$php_ini" "error_log" "/var/log/php_errors.log"
    
    log_info "Configurações do php.ini aplicadas com sucesso"
}

# ==============================================================================
# Função: Configurar php.ini para CLI
# ==============================================================================
configure_php_ini_cli() {
    log_info "Configurando PHP CLI..."
    
    local php_version
    php_version=$(php -r "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;" 2>/dev/null || echo "")
    
    if [ -z "$php_version" ]; then
        log_warn "PHP não encontrado, pulando configuração CLI"
        return 0
    fi
    
    local cli_ini="/etc/php/${php_version}/cli/php.ini"
    
    if [ ! -f "$cli_ini" ]; then
        log_warn "php.ini CLI não encontrado em $cli_ini"
        return 0
    fi
    
    log_info "Usando php.ini CLI: $cli_ini"
    
    # Fazer backup
    if [ ! -f "${cli_ini}.backup" ]; then
        cp "$cli_ini" "${cli_ini}.backup"
    fi
    
    # Aplicar configurações similares
    local memory_limit="${PHP_MEMORY_LIMIT:-256M}"
    local max_execution="${PHP_MAX_EXECUTION_TIME:-300}"
    local timezone="${TZ:-America/Sao_Paulo}"
    
    update_php_ini_setting "$cli_ini" "memory_limit" "$memory_limit"
    update_php_ini_setting "$cli_ini" "max_execution_time" "$max_execution"
    update_php_ini_setting "$cli_ini" "date.timezone" "$timezone"
    
    log_info "Configurações do php.ini CLI aplicadas"
}

# ==============================================================================
# Função: Verificar extensões do PHP
# ==============================================================================
check_php_extensions() {
    log_info "Verificando extensões do PHP instaladas..."
    
    local required_extensions=(
        "mysqli"
        "pdo_mysql"
        "mbstring"
        "zip"
        "gd"
        "xml"
        "curl"
        "intl"
    )
    
    local missing_extensions=()
    
    for ext in "${required_extensions[@]}"; do
        if php -m | grep -q "^${ext}$"; then
            log_info "  ✓ $ext"
        else
            log_warn "  ✗ $ext (não instalado)"
            missing_extensions+=("$ext")
        fi
    done
    
    if [ ${#missing_extensions[@]} -gt 0 ]; then
        log_warn "Extensões faltando: ${missing_extensions[*]}"
        log_warn "Considere instalar: apt-get install php-${missing_extensions[0]}"
    else
        log_info "Todas as extensões essenciais estão instaladas"
    fi
}

# ==============================================================================
# Função: Configurar Xdebug (se instalado)
# ==============================================================================
configure_xdebug() {
    if ! php -m | grep -q "xdebug"; then
        log_info "Xdebug não instalado, pulando configuração"
        return 0
    fi
    
    log_info "Xdebug detectado, configurando..."
    
    local php_version
    php_version=$(php -r "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;" 2>/dev/null || echo "")
    
    local xdebug_ini="/etc/php/${php_version}/mods-available/xdebug.ini"
    
    if [ ! -f "$xdebug_ini" ]; then
        log_warn "Arquivo de configuração do Xdebug não encontrado"
        return 0
    fi
    
    # Configuração básica do Xdebug 3 para desenvolvimento
    cat > "$xdebug_ini" <<EOF
zend_extension=xdebug.so
xdebug.mode=debug,develop
xdebug.start_with_request=yes
xdebug.client_host=localhost
xdebug.client_port=9003
xdebug.log=/var/log/xdebug.log
EOF
    
    log_info "Xdebug configurado para modo de desenvolvimento"
}

# ==============================================================================
# Função: Exibir informações do PHP
# ==============================================================================
show_php_info() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "INFORMAÇÕES DO PHP"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if command -v php >/dev/null 2>&1; then
        php -v | head -n1 | sed "s/^/${GREEN}[PHP Config]${NC} /"
        
        log_info ""
        log_info "Configurações principais:"
        log_info "  - memory_limit: $(php -r "echo ini_get('memory_limit');")"
        log_info "  - upload_max_filesize: $(php -r "echo ini_get('upload_max_filesize');")"
        log_info "  - post_max_size: $(php -r "echo ini_get('post_max_size');")"
        log_info "  - max_execution_time: $(php -r "echo ini_get('max_execution_time');")"
        log_info "  - display_errors: $(php -r "echo ini_get('display_errors');")"
        log_info "  - timezone: $(php -r "echo ini_get('date.timezone');")"
    else
        log_error "PHP não encontrado no PATH"
    fi
    
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ==============================================================================
# MAIN - Execução principal
# ==============================================================================
main() {
    log_info "Iniciando configuração do PHP..."
    
    # Passo 1: Configurar php.ini para Apache
    if ! configure_php_ini_apache; then
        log_error "Erro ao configurar php.ini para Apache"
        exit 1
    fi
    
    # Passo 2: Configurar php.ini para CLI
    configure_php_ini_cli
    
    # Passo 3: Verificar extensões
    check_php_extensions
    
    # Passo 4: Configurar Xdebug se disponível
    configure_xdebug
    
    # Passo 5: Exibir informações
    show_php_info
    
    log_info "Configuração do PHP concluída com sucesso!"
}

# Executar apenas se chamado diretamente (não via source)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
