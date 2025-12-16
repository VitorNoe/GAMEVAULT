#!/usr/bin/env bash
# configure-apache.sh - Script modular para configuração do Apache# ======================================================================

#
# EN: configure-apache.sh - Modular script to configure Apache
# EN: Expected environment variables:
# EN:   - APACHE_DOCUMENT_ROOT
# EN:   - APACHE_PORT
# EN:   - APACHE_SERVER_NAME
# EN:   - APACHE_ALLOW_OVERRIDE
# EN:   - APACHE_INDEXES
# EN:   - APACHE_REWRITE
# ======================================================================

set -euo pipefail

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[Apache Config]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[Apache Config]${NC} $1"
}

log_error() {
    echo -e "${RED}[Apache Config]${NC} $1"
}

# ==============================================================================
# Função: Determinar o DocumentRoot absoluto
# ==============================================================================
get_document_root() {
    local doc_root="${APACHE_DOCUMENT_ROOT:-public}"
    local workspace="${1:-/var/www/html}"
    
    # Se começar com /, é caminho absoluto
    if [[ "$doc_root" == /* ]]; then
        echo "$doc_root"
        return 0
    fi
    
    # Senão, é relativo ao workspace
    echo "${workspace}/${doc_root}"
}

# ==============================================================================
# Função: Criar diretório DocumentRoot se não existir
# ==============================================================================
ensure_document_root() {
    local doc_root="$1"
    
    if [ ! -d "$doc_root" ]; then
        log_info "DocumentRoot $doc_root não existe, criando..."
        mkdir -p "$doc_root"
        
        # Criar index.php de exemplo
        cat > "$doc_root/index.php" <<'PHP'
<?php
phpinfo();
PHP
        log_info "Criado $doc_root/index.php com phpinfo()"
    else
        log_info "DocumentRoot $doc_root já existe"
    fi
    
    # Ajustar permissões
    chown -R www-data:www-data "$doc_root" 2>/dev/null || true
    chmod -R 755 "$doc_root" 2>/dev/null || true
}

# ==============================================================================
# Função: Configurar VirtualHost do Apache
# ==============================================================================
configure_virtualhost() {
    local doc_root="$1"
    local server_name="${APACHE_SERVER_NAME:-localhost}"
    local port="${APACHE_PORT:-80}"
    local allow_override="${APACHE_ALLOW_OVERRIDE:-true}"
    local indexes="${APACHE_INDEXES:-true}"
    
    local site_conf="/etc/apache2/sites-available/000-default.conf"
    
    log_info "Configurando VirtualHost do Apache..."
    log_info "  - DocumentRoot: $doc_root"
    log_info "  - ServerName: $server_name"
    log_info "  - Port: $port"
    log_info "  - AllowOverride: $allow_override"
    log_info "  - Indexes: $indexes"
    
    # Determinar opções do Directory
    local options="FollowSymLinks"
    if [ "$indexes" = "true" ]; then
        options="Indexes $options"
    fi
    
    local override_value="None"
    if [ "$allow_override" = "true" ]; then
        override_value="All"
    fi
    
    # Criar configuração do VirtualHost
    cat > "$site_conf" <<EOF
<VirtualHost *:${port}>
    ServerName ${server_name}
    ServerAdmin webmaster@localhost
    DocumentRoot ${doc_root}

    <Directory ${doc_root}>
        Options ${options}
        AllowOverride ${override_value}
        Require all granted
    </Directory>

    # Logs
    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined

    # Configurações adicionais para desenvolvimento
    <IfModule dir_module>
        DirectoryIndex index.php index.html index.htm
    </IfModule>
</VirtualHost>
EOF
    
    log_info "VirtualHost configurado em $site_conf"
}

# ==============================================================================
# Função: Configurar apache2.conf para o DocumentRoot
# ==============================================================================
configure_apache_conf() {
    local doc_root="$1"
    local apache_conf="/etc/apache2/apache2.conf"
    
    log_info "Verificando $apache_conf para Directory do DocumentRoot..."
    
    # Verificar se já existe configuração para este diretório
    if grep -q "<Directory ${doc_root}>" "$apache_conf" 2>/dev/null; then
        log_info "Configuração já existe em $apache_conf"
        return 0
    fi
    
    # Adicionar configuração do Directory
    log_info "Adicionando configuração de Directory para $doc_root em $apache_conf"
    
    local allow_override="${APACHE_ALLOW_OVERRIDE:-true}"
    local indexes="${APACHE_INDEXES:-true}"
    
    local options="FollowSymLinks"
    if [ "$indexes" = "true" ]; then
        options="Indexes $options"
    fi
    
    local override_value="None"
    if [ "$allow_override" = "true" ]; then
        override_value="All"
    fi
    
    cat >> "$apache_conf" <<EOF

# Custom DocumentRoot configuration
<Directory ${doc_root}>
    Options ${options}
    AllowOverride ${override_value}
    Require all granted
</Directory>
EOF
    
    log_info "Configuração adicionada ao $apache_conf"
}

# ==============================================================================
# Função: Habilitar módulos do Apache
# ==============================================================================
enable_apache_modules() {
    local rewrite="${APACHE_REWRITE:-true}"
    
    log_info "Habilitando módulos do Apache..."
    
    # Sempre habilitar mod_rewrite se solicitado
    if [ "$rewrite" = "true" ]; then
        a2enmod rewrite >/dev/null 2>&1 || true
        log_info "  - mod_rewrite habilitado"
    fi
    
    # Outros módulos úteis
    a2enmod headers >/dev/null 2>&1 || true
    log_info "  - mod_headers habilitado"
    
    a2enmod expires >/dev/null 2>&1 || true
    log_info "  - mod_expires habilitado"
}

# ==============================================================================
# Função: Configurar porta do Apache
# ==============================================================================
configure_apache_port() {
    local port="${APACHE_PORT:-80}"
    local ports_conf="/etc/apache2/ports.conf"
    
    log_info "Configurando porta do Apache: $port"
    
    # Atualizar ports.conf
    sed -i "s/^Listen .*/Listen ${port}/" "$ports_conf"
    
    log_info "Porta configurada em $ports_conf"
}

# ==============================================================================
# Função: Reiniciar Apache
# ==============================================================================
restart_apache() {
    log_info "Reiniciando Apache..."
    
    if service apache2 restart 2>/dev/null; then
        log_info "Apache reiniciado com sucesso"
        return 0
    elif service httpd restart 2>/dev/null; then
        log_info "Apache (httpd) reiniciado com sucesso"
        return 0
    else
        log_error "Falha ao reiniciar Apache"
        return 1
    fi
}

# ==============================================================================
# Função: Verificar status do Apache
# ==============================================================================
check_apache_status() {
    log_info "Verificando status do Apache..."
    
    if service apache2 status 2>/dev/null | grep -q "active (running)"; then
        log_info "Apache está rodando"
        return 0
    elif service httpd status 2>/dev/null | grep -q "active (running)"; then
        log_info "Apache (httpd) está rodando"
        return 0
    else
        log_warn "Apache pode não estar rodando corretamente"
        return 1
    fi
}

# ==============================================================================
# Função: Exibir informações de acesso
# ==============================================================================
show_access_info() {
    local doc_root="$1"
    local port="${APACHE_PORT:-80}"
    local server_name="${APACHE_SERVER_NAME:-localhost}"
    
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "INFORMAÇÕES DE ACESSO DO APACHE"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "DocumentRoot: $doc_root"
    log_info "ServerName: $server_name"
    log_info "Port: $port"
    log_info ""
    log_info "Acesse seu site em:"
    log_info "  http://localhost:${port}"
    if [ "$server_name" != "localhost" ]; then
        log_info "  http://${server_name}:${port}"
    fi
    log_info ""
    log_info "phpMyAdmin:"
    log_info "  http://localhost:${port}/phpmyadmin"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ==============================================================================
# MAIN - Execução principal
# ==============================================================================
main() {
    local workspace="${1:-/var/www/html}"
    
    log_info "Iniciando configuração do Apache..."
    log_info "Workspace: $workspace"
    
    # Passo 1: Determinar DocumentRoot
    local doc_root
    doc_root=$(get_document_root "$workspace")
    log_info "DocumentRoot determinado: $doc_root"
    
    # Passo 2: Garantir que DocumentRoot existe
    ensure_document_root "$doc_root"
    
    # Passo 3: Habilitar módulos
    enable_apache_modules
    
    # Passo 4: Configurar porta
    configure_apache_port
    
    # Passo 5: Configurar VirtualHost
    configure_virtualhost "$doc_root"
    
    # Passo 6: Configurar apache2.conf
    configure_apache_conf "$doc_root"
    
    # Passo 7: Reiniciar Apache
    if ! restart_apache; then
        log_error "Erro ao reiniciar Apache"
        exit 1
    fi
    
    # Passo 8: Verificar status
    check_apache_status
    
    # Passo 9: Exibir informações
    show_access_info "$doc_root"
    
    log_info "Configuração do Apache concluída com sucesso!"
}

# Executar apenas se chamado diretamente (não via source)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
