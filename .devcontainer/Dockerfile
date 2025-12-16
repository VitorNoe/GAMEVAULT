FROM debian:bookworm

# Argumentos de build (podem ser sobrescritos via .env no devcontainer.json)
ARG INSTALL_XDEBUG=false
ARG INSTALL_NODEJS=false
ARG NODEJS_VERSION=20
ARG TZ=America/Sao_Paulo
ARG PHP_VERSION=8.2

# Variáveis de ambiente padrão (podem ser sobrescritas no runtime)
ENV DEBIAN_FRONTEND=noninteractive \
  TZ=${TZ} \
  COMPOSER_ALLOW_SUPERUSER=1 \
  COMPOSER_NO_INTERACTION=1 \
  # MySQL/MariaDB defaults (serão sobrescritos pelo .env)
  MYSQL_ROOT_PASSWORD=root \
  MYSQL_DATABASE=devdb \
  MYSQL_USER=devuser \
  MYSQL_PASSWORD=devpass \
  MYSQL_HOST=127.0.0.1 \
  MYSQL_PORT=3306 \
  MYSQL_CHARSET=utf8mb4 \
  MYSQL_COLLATION=utf8mb4_unicode_ci \
  # Apache defaults
  APACHE_DOCUMENT_ROOT=public \
  APACHE_PORT=80 \
  APACHE_SERVER_NAME=localhost \
  APACHE_ALLOW_OVERRIDE=true \
  APACHE_INDEXES=true \
  APACHE_REWRITE=true \
  # phpMyAdmin defaults
  PHPMYADMIN_BLOWFISH_SECRET=change_me_32_chars_minimum_secret \
  PHPMYADMIN_ALLOW_NO_PASSWORD=false \
  # PHP defaults
  PHP_DISPLAY_ERRORS=On \
  PHP_ERROR_REPORTING=E_ALL \
  PHP_UPLOAD_MAX_FILESIZE=64M \
  PHP_POST_MAX_SIZE=64M \
  PHP_MEMORY_LIMIT=256M \
  PHP_MAX_EXECUTION_TIME=300 \
  # App defaults
  APP_ENV=development \
  APP_DEBUG=true

# Configurar timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Instala Apache, PHP do repositório com extensões comuns, MariaDB e phpMyAdmin
RUN apt-get update && apt-get install -y --no-install-recommends \
  apache2 \
  mariadb-server \
  sudo \
  git zip unzip curl wget \
  php php-cli php-mysql php-mbstring php-zip php-gd php-xml php-curl php-intl \
  libapache2-mod-php \
  phpmyadmin \
  && a2enmod rewrite \
  && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install git-lfs for devcontainer (ensure git-lfs available inside container)
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates gnupg2 \
  && curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash \
  && apt-get install -y git-lfs \
  && git lfs install --system \
  && rm -rf /var/lib/apt/lists/*

# Instalar Xdebug (opcional)
RUN if [ "$INSTALL_XDEBUG" = "true" ]; then \
  apt-get update && apt-get install -y php-xdebug \
  && rm -rf /var/lib/apt/lists/*; \
  fi

# Instalar Node.js (opcional)
RUN if [ "$INSTALL_NODEJS" = "true" ]; then \
  curl -fsSL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*; \
  fi

# Expor portas (informativo)
EXPOSE 80 3306

# Workdir - não força /workspaces aqui, será o mount do Codespaces
WORKDIR /var/www/html

# Configuração do phpMyAdmin
# phpMyAdmin é instalado em /usr/share/phpmyadmin via apt
# Cria link simbólico para manter compatibilidade
RUN ln -s /usr/share/phpmyadmin /var/www/phpmyadmin \
  && ln -s /etc/phpmyadmin/apache.conf /etc/apache2/conf-available/phpmyadmin.conf \
  && a2enconf phpmyadmin

# Copiar scripts de configuração modulares
COPY configure-mysql.sh /usr/local/bin/configure-mysql.sh
COPY configure-apache.sh /usr/local/bin/configure-apache.sh
COPY configure-php.sh /usr/local/bin/configure-php.sh
COPY configure-phpmyadmin.sh /usr/local/bin/configure-phpmyadmin.sh

# Tornar scripts executáveis
RUN chmod +x /usr/local/bin/configure-*.sh