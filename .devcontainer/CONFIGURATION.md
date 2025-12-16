# 📚 Development Environment Documentation

## 🎯 Overview

This is a complete development environment for PHP using Apache, MySQL/MariaDB and phpMyAdmin, fully configurable via environment variables. The environment is modular and allows precise configuration before starting the Codespace or devcontainer.

### 🚀 Features

- ✅ Fully configurable via `.env`
- ✅ Modular architecture with independent scripts
- ✅ Support for multiple databases and users
- ✅ Configurable DocumentRoot
- ✅ PHP settings that can be adjusted
- ✅ phpMyAdmin pre-configured
- ✅ Reload scripts (no rebuild required for many changes)
- ✅ Informative, colorized logs

---

## 🔧 Initial Setup

### 1️⃣ Configure environment variables

Before starting the Codespace, copy the example file and edit it:

```bash
cp .devcontainer/.env.example .devcontainer/.env
```

Edit `.devcontainer/.env` to suit your project. See the [Available Environment Variables](#available-environment-variables) section for details.

### 2️⃣ Start the Codespace / Devcontainer

After configuring `.env`, open the repository in GitHub Codespaces or start the devcontainer locally. The container's `init.sh` script will run automatically and configure the services according to the variables.

### 3️⃣ Accessing Services

After startup you will typically have access to:

- **Web application**: `http://localhost:80` (or configured `APACHE_PORT`)
- **phpMyAdmin**: `http://localhost:80/phpmyadmin`
- **MySQL/MariaDB**: port `3306`

---

## 📋 Available Environment Variables

### 🗄️ MySQL / MariaDB

| Variable | Default | Description |
|----------|---------|-------------|
| `MYSQL_ROOT_PASSWORD` | `_43690` | Root user password (development default) |
| `MYSQL_DATABASE` | `app_database` | Database name (example — change in `.env`) |
| `MYSQL_USER` | `app_user` | Database user (example — change in `.env`) |
| `MYSQL_PASSWORD` | `_43690` | Password for the database user |
| `MYSQL_HOST` | `127.0.0.1` | MySQL host |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_CHARSET` | `utf8mb4` | Database charset |
| `MYSQL_COLLATION` | `utf8mb4_unicode_ci` | Database collation |

### 🌐 Apache

| Variable | Default | Description |
|----------|---------|-------------|
| `APACHE_DOCUMENT_ROOT` | `public` | DocumentRoot (relative to workspace or absolute path) |
| `APACHE_PORT` | `80` | Apache listen port |
| `APACHE_SERVER_NAME` | `localhost` | ServerName for Apache |
| `APACHE_ALLOW_OVERRIDE` | `true` | AllowOverride (enable `.htaccess`) |
| `APACHE_INDEXES` | `true` | Enable directory listing |
| `APACHE_REWRITE` | `true` | Enable `mod_rewrite` |

### 🐘 PHP

| Variable | Default | Description |
|----------|---------|-------------|
| `PHP_DISPLAY_ERRORS` | `On` | Display PHP errors (development) |
| `PHP_ERROR_REPORTING` | `E_ALL` | Error reporting level |
| `PHP_UPLOAD_MAX_FILESIZE` | `64M` | Max upload size |
| `PHP_POST_MAX_SIZE` | `64M` | Max POST size |
| `PHP_MEMORY_LIMIT` | `256M` | PHP memory limit |
| `PHP_MAX_EXECUTION_TIME` | `300` | Max execution time (seconds) |

### 🔐 phpMyAdmin

| Variable | Default | Description |
|----------|---------|-------------|
| `PHPMYADMIN_BLOWFISH_SECRET` | `_43690_blowfish_secret_change_me` | Blowfish secret for phpMyAdmin cookies (min 32 chars) |
| `PHPMYADMIN_ALLOW_NO_PASSWORD` | `false` | Allow login without password (not recommended) |

### 🛠️ Development / Misc

| Variable | Default | Description |
|----------|---------|-------------|
| `INSTALL_XDEBUG` | `false` | Install Xdebug (requires rebuild) |
| `INSTALL_NODEJS` | `false` | Install Node.js (optional) |
| `NODEJS_VERSION` | `20` | Node.js version to install if enabled |
| `TZ` | `America/Sao_Paulo` | Timezone for the container |
| `APP_ENV` | `development` | Application environment |
| `APP_DEBUG` | `true` | Debug mode |

---

## 📁 File Structure

```
.devcontainer/
├── .env.example              # configuration template
├── .env                      # your settings (create from .env.example)
├── Dockerfile                # Docker image definition
├── devcontainer.json         # devcontainer config
├── init.sh                   # main initialization script
├── reload-services.sh        # reapply configuration and restart services (no rebuild)
├── configure-mysql.sh        # MySQL/MariaDB configuration module
├── configure-apache.sh       # Apache configuration module
├── configure-php.sh          # PHP configuration module
├── configure-phpmyadmin.sh   # phpMyAdmin configuration module
└── docs.md                   # user-facing docs (mirrors README)
```

---

## 🔄 Modular Scripts

### `init.sh`
Main script executed when the container starts. Orchestrates all configuration modules.

Usage:
```bash
bash .devcontainer/init.sh <repo-name>
```

### `configure-mysql.sh`
Configures MySQL/MariaDB: users, passwords and initial database.

Usage:
```bash
configure-mysql.sh
```

Environment variables used:
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_CHARSET`
- `MYSQL_COLLATION`

### `configure-apache.sh`
Configures Apache (DocumentRoot, VirtualHost, modules).

Usage:
```bash
configure-apache.sh /path/to/workspace
```

Environment variables used:
- `APACHE_DOCUMENT_ROOT`
- `APACHE_PORT`
- `APACHE_SERVER_NAME`
- `APACHE_ALLOW_OVERRIDE`
- `APACHE_INDEXES`
- `APACHE_REWRITE`

### `configure-php.sh`
Updates `php.ini` values and other PHP runtime options.

Usage:
```bash
configure-php.sh
```

Environment variables used:
- `PHP_DISPLAY_ERRORS`
- `PHP_ERROR_REPORTING`
- `PHP_UPLOAD_MAX_FILESIZE`
- `PHP_POST_MAX_SIZE`
- `PHP_MEMORY_LIMIT`
- `PHP_MAX_EXECUTION_TIME`
- `TZ`

### `configure-phpmyadmin.sh`
Sets up phpMyAdmin configuration (blowfish secret, connection settings).

Usage:
```bash
configure-phpmyadmin.sh
```

Environment variables used:
- `PHPMYADMIN_BLOWFISH_SECRET`
- `PHPMYADMIN_ALLOW_NO_PASSWORD`
- `MYSQL_HOST`

### `reload-services.sh`
Reapplies configuration and restarts services without rebuilding the image when possible.

Usage:
```bash
bash .devcontainer/reload-services.sh
```

---

## 💡 Common Use Cases

### 🔹 Change DocumentRoot

Scenario: you want Apache to serve `www/public` instead of `public`.

Solution:
1. Edit `.devcontainer/.env`:
   ```env
   APACHE_DOCUMENT_ROOT=www/public
   ```
2. Apply the change:
   ```bash
   bash .devcontainer/reload-services.sh
   ```

### 🔹 Create Additional Databases

Scenario: you need multiple databases for different projects.

Solution:
1. Configure the primary DB in `.env`.
2. Connect to MySQL and create the extra databases manually:
   ```bash
   mysql -u root -p${MYSQL_ROOT_PASSWORD}
   ```
   ```sql
   CREATE DATABASE second_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   GRANT ALL PRIVILEGES ON second_database.* TO '${MYSQL_USER}'@'localhost';
   ```

### 🔹 Increase Upload Limits

Scenario: you need to upload files larger than 64MB.

Solution:
1. Edit `.devcontainer/.env`:
   ```env
   PHP_UPLOAD_MAX_FILESIZE=256M
   PHP_POST_MAX_SIZE=256M
   ```
2. Apply the change:
   ```bash
   bash .devcontainer/reload-services.sh
   ```

### 🔹 Install Xdebug

Scenario: you want to debug PHP with breakpoints.

Solution:
1. Edit `.devcontainer/.env`:
   ```env
   INSTALL_XDEBUG=true
   ```
2. Rebuild the container (required to install Xdebug).
3. Configure your IDE to use port 9003.

### 🔹 Use a Different Port

Scenario: port 80 is taken or you prefer 8080.

Solution:
1. Edit `.devcontainer/.env`:
   ```env
   APACHE_PORT=8080
   ```
2. Update `.devcontainer/devcontainer.json` forwardPorts if needed:
   ```json
   "forwardPorts": [8080, 3306]
   ```
3. Rebuild the container.

---

## 🐛 Troubleshooting

### Apache won't start

Symptom: Apache fails to start or returns 500 errors.

Solutions:
1. Check logs:
   ```bash
   tail -f /var/log/apache2/error.log
   ```
2. Check DocumentRoot permissions:
   ```bash
   ls -la /workspaces/your-repo/public
   ```
3. Test Apache config:
   ```bash
   apache2ctl configtest
   ```

### MySQL won't connect

Symptom: connection errors or "Access denied".

Solutions:
1. Check service status:
   ```bash
   service mariadb status
   ```
2. Try connecting:
   ```bash
   mysql -u root -p${MYSQL_ROOT_PASSWORD}
   ```
3. Re-run the MySQL configuration script if needed:
   ```bash
   configure-mysql.sh
   ```

### phpMyAdmin blowfish error

Symptom: "The configuration file now needs a secret passphrase (blowfish_secret)"

Solutions:
1. Generate a new secret:
   ```bash
   openssl rand -base64 32
   ```
2. Update `.env`:
   ```env
   PHPMYADMIN_BLOWFISH_SECRET=your_new_32_char_secret
   ```
3. Reconfigure phpMyAdmin:
   ```bash
   configure-phpmyadmin.sh
   ```

### DocumentRoot not updating

Symptom: Apache keeps serving the old directory.

Solutions:
1. Reload configuration:
   ```bash
   bash .devcontainer/reload-services.sh
   ```
2. If that fails, reconfigure Apache manually:
   ```bash
   configure-apache.sh /workspaces/your-repo
   ```

---

## 🎓 Best Practices

### ✅ Security

- ⚠️ Never commit `.env` with real secrets to the repository.
- Use strong passwords for production environments.
- Disable `PHP_DISPLAY_ERRORS` in production.
- Set `PHPMYADMIN_ALLOW_NO_PASSWORD=false`.

### ✅ Performance

- Tune `PHP_MEMORY_LIMIT` as needed.
- Enable OPcache for production.
- Disable directory indexes (`APACHE_INDEXES=false`) in production.

### ✅ Development

- Use `APP_DEBUG=true` only in development.
- Keep logs enabled for troubleshooting.
- Test changes using `reload-services.sh` before rebuilding.

---

## 📞 Support & Useful Commands

### Important logs

```bash
# Apache
tail -f /var/log/apache2/error.log
tail -f /var/log/apache2/access.log

# MySQL
tail -f /var/log/mysql/error.log

# PHP
tail -f /var/log/php_errors.log
```

### Useful commands

```bash
# Check service status
service apache2 status
service mariadb status

# Test Apache configuration
apache2ctl configtest

# Check PHP version
php -v

# List PHP modules
php -m

# Inspect PHP settings
php -i | grep -i "memory_limit\|upload_max"

# Connect to MySQL
mysql -u root -p
```

---

## 📝 Changelog

### v2.0.0 - Modular System (2024)
- ✨ Full configuration via `.env`
- ✨ Modular scripts for each service
- ✨ Reload script (no rebuild required for many changes)
- ✨ Colorized and informative logs
- ✨ Comprehensive documentation
- ✨ Support for multiple configurations and build args (Xdebug / Node.js)

### v1.0.0 - Initial Release
- Basic environment setup
- Monolithic scripts

---

## 📄 License

This template is open-source and may be used freely in your projects.
