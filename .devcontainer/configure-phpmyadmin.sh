#!/usr/bin/env bash
# ======================================================================
# configure-phpmyadmin.sh - Script modular para configuração do phpMyAdmin
# ======================================================================
# Este script configura o phpMyAdmin usando variáveis de ambiente
# Variáveis esperadas:
#   - PHPMYADMIN_BLOWFISH_SECRET
#   - PHPMYADMIN_ALLOW_NO_PASSWORD
#   - MYSQL_HOST
#
# EN: configure-phpmyadmin.sh - Modular script to configure phpMyAdmin
# EN: Expected environment variables:
# EN:   - PHPMYADMIN_BLOWFISH_SECRET
# EN:   - PHPMYADMIN_ALLOW_NO_PASSWORD
# EN:   - MYSQL_HOST
# ======================================================================

set -euo pipefail

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[phpMyAdmin Config]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[phpMyAdmin Config]${NC} $1"
}

log_error() {
    echo -e "${RED}[phpMyAdmin Config]${NC} $1"
}

# ==============================================================================
# Função: Detectar diretório do phpMyAdmin
# ==============================================================================
detect_phpmyadmin_dir() {
    local possible_paths=(
        "/usr/share/phpmyadmin"
        "/var/www/phpmyadmin"
        "/usr/local/share/phpmyadmin"
    )
    
    for path in "${possible_paths[@]}"; do
        if [ -d "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    
    log_error "Diretório do phpMyAdmin não encontrado"
    return 1
}

# ==============================================================================
# Função: Gerar blowfish secret aleatório
# ==============================================================================
generate_blowfish_secret() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
    else
        # Fallback para usar /dev/urandom
        tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32
    fi
}

# ==============================================================================
# Função: Configurar phpMyAdmin
# ==============================================================================
configure_phpmyadmin() {
    log_info "Configurando phpMyAdmin..."
    
    local phpmyadmin_dir
    phpmyadmin_dir=$(detect_phpmyadmin_dir)
    
    if [ -z "$phpmyadmin_dir" ] || [ ! -d "$phpmyadmin_dir" ]; then
        log_error "phpMyAdmin não encontrado, pulando configuração"
        return 1
    fi
    
    log_info "phpMyAdmin detectado em: $phpmyadmin_dir"
    
    local config_file="${phpmyadmin_dir}/config.inc.php"
    local blowfish_secret="${PHPMYADMIN_BLOWFISH_SECRET:-}"
    local allow_no_password="${PHPMYADMIN_ALLOW_NO_PASSWORD:-false}"
    local mysql_host="${MYSQL_HOST:-127.0.0.1}"
    
    # Gerar blowfish secret se não fornecido ou muito curto
    if [ -z "$blowfish_secret" ] || [ ${#blowfish_secret} -lt 32 ]; then
        log_warn "Blowfish secret não fornecido ou inválido, gerando novo..."
        blowfish_secret=$(generate_blowfish_secret)
        log_info "Novo blowfish secret gerado"
    fi
    
    log_info "Criando arquivo de configuração: $config_file"
    log_info "  - MySQL Host: $mysql_host"
    log_info "  - Allow No Password: $allow_no_password"
    log_info "  - Blowfish Secret: ${blowfish_secret:0:8}*** (oculto)"
    
    # Criar arquivo de configuração do phpMyAdmin
    cat > "$config_file" <<EOF
<?php
/**
 * phpMyAdmin Configuration
 * Generated automatically by configure-phpmyadmin.sh
 */

declare(strict_types=1);

// Blowfish secret for cookie authentication
\$cfg['blowfish_secret'] = '${blowfish_secret}';

// Server configuration
\$i = 0;
\$i++;

\$cfg['Servers'][\$i]['auth_type'] = 'cookie';
\$cfg['Servers'][\$i]['host'] = '${mysql_host}';
\$cfg['Servers'][\$i]['connect_type'] = 'tcp';
\$cfg['Servers'][\$i]['compress'] = false;
\$cfg['Servers'][\$i]['AllowNoPassword'] = ${allow_no_password};
\$cfg['Servers'][\$i]['extension'] = 'mysqli';

// Diretórios temporários
\$cfg['TempDir'] = '/tmp';

// Configurações de segurança para desenvolvimento
\$cfg['LoginCookieValidity'] = 86400; // 24 horas

// Ocultar bancos de dados do sistema (opcional)
// \$cfg['Servers'][\$i]['hide_db'] = '^(information_schema|performance_schema|mysql|sys)\$';

// Configurações de interface
\$cfg['DefaultLang'] = 'pt';
\$cfg['ServerDefault'] = 1;
\$cfg['UploadDir'] = '';
\$cfg['SaveDir'] = '';

// Desabilitar avisos de versão
\$cfg['VersionCheck'] = false;

// Configurações de segurança
\$cfg['AllowThirdPartyFraming'] = false;

// Modo de desenvolvimento
if (getenv('APP_DEBUG') === 'true') {
    \$cfg['ShowPhpInfo'] = true;
    \$cfg['ShowServerInfo'] = true;
}

?>
EOF
    
    # Ajustar permissões
    chown www-data:www-data "$config_file" 2>/dev/null || true
    chmod 644 "$config_file" 2>/dev/null || true
    
    # Ajustar permissões do diretório inteiro
    chown -R www-data:www-data "$phpmyadmin_dir" 2>/dev/null || true
    chmod -R 755 "$phpmyadmin_dir" 2>/dev/null || true
    
    log_info "Configuração do phpMyAdmin criada com sucesso"
}

# ==============================================================================
# Função: Configurar Apache para phpMyAdmin
# ==============================================================================
configure_apache_phpmyadmin() {
    log_info "Configurando Apache para phpMyAdmin..."
    
    local phpmyadmin_conf="/etc/apache2/conf-available/phpmyadmin.conf"
    
    # Verificar se o arquivo de configuração já existe
    if [ -f "$phpmyadmin_conf" ]; then
        log_info "Configuração do Apache já existe em $phpmyadmin_conf"
    else
        log_warn "Configuração do Apache não encontrada, criando..."
        
        cat > "$phpmyadmin_conf" <<'EOF'
# phpMyAdmin Apache configuration

Alias /phpmyadmin /usr/share/phpmyadmin

<Directory /usr/share/phpmyadmin>
    Options SymLinksIfOwnerMatch
    DirectoryIndex index.php
    AllowOverride None

    <IfModule mod_php.c>
        php_flag magic_quotes_gpc Off
        php_flag track_vars On
        php_flag register_globals Off
        php_admin_value upload_tmp_dir /var/lib/phpmyadmin/tmp
    </IfModule>

    # Apache 2.4
    Require all granted
</Directory>

# Disallow web access to directories that don't need it
<Directory /usr/share/phpmyadmin/templates>
    Require all denied
</Directory>

<Directory /usr/share/phpmyadmin/libraries>
    Require all denied
</Directory>

<Directory /usr/share/phpmyadmin/setup/lib>
    Require all denied
</Directory>
EOF
    fi
    
    # Habilitar configuração
    a2enconf phpmyadmin >/dev/null 2>&1 || true
    log_info "Configuração do phpMyAdmin habilitada no Apache"
}

# ==============================================================================
# Função: Criar diretórios temporários para phpMyAdmin
# ==============================================================================
create_phpmyadmin_directories() {
    log_info "Criando diretórios temporários para phpMyAdmin..."
    
    local tmp_dir="/var/lib/phpmyadmin/tmp"
    
    mkdir -p "$tmp_dir" 2>/dev/null || true
    chown -R www-data:www-data /var/lib/phpmyadmin 2>/dev/null || true
    chmod -R 755 /var/lib/phpmyadmin 2>/dev/null || true
    
    log_info "Diretórios temporários criados"
}

# ==============================================================================
# Função: Verificar instalação do phpMyAdmin
# ==============================================================================
verify_phpmyadmin() {
    log_info "Verificando instalação do phpMyAdmin..."
    
    local phpmyadmin_dir
    phpmyadmin_dir=$(detect_phpmyadmin_dir)
    
    if [ -z "$phpmyadmin_dir" ]; then
        log_error "phpMyAdmin não encontrado"
        return 1
    fi
    
    local config_file="${phpmyadmin_dir}/config.inc.php"
    
    if [ -f "$config_file" ]; then
        log_info "✓ Arquivo de configuração existe"
    else
        log_warn "✗ Arquivo de configuração não encontrado"
        return 1
    fi
    
    if [ -d "${phpmyadmin_dir}/libraries" ]; then
        log_info "✓ Bibliotecas do phpMyAdmin presentes"
    else
        log_warn "✗ Bibliotecas do phpMyAdmin não encontradas"
    fi
    
    log_info "Verificação do phpMyAdmin concluída"
}

# ==============================================================================
# Função: Exibir informações de acesso
# ==============================================================================
show_phpmyadmin_info() {
    local apache_port="${APACHE_PORT:-80}"
    
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "INFORMAÇÕES DO PHPMYADMIN"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "URL de acesso:"
    log_info "  http://localhost:${apache_port}/phpmyadmin"
    log_info ""
    log_info "Credenciais padrão:"
    log_info "  Usuário: root"
    log_info "  Senha: ${MYSQL_ROOT_PASSWORD:-root}"
    log_info ""
    log_info "Ou use o usuário do aplicativo:"
    log_info "  Usuário: ${MYSQL_USER:-devuser}"
    log_info "  Senha: ${MYSQL_PASSWORD:-devpass}"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ==============================================================================
# MAIN - Execução principal
# ==============================================================================
main() {
    log_info "Iniciando configuração do phpMyAdmin..."
    
    # Passo 1: Criar diretórios necessários
    create_phpmyadmin_directories
    
    # Passo 2: Configurar phpMyAdmin
    if ! configure_phpmyadmin; then
        log_error "Erro ao configurar phpMyAdmin"
        exit 1
    fi
    
    # Passo 3: Configurar Apache
    configure_apache_phpmyadmin
    
    # Passo 4: Verificar instalação
    verify_phpmyadmin
    
    # Passo 5: Exibir informações
    show_phpmyadmin_info
    
    log_info "Configuração do phpMyAdmin concluída com sucesso!"
}

# Executar apenas se chamado diretamente (não via source)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
