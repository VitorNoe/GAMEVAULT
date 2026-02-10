# 🚀 Template Codespace: Apache + PHP + MariaDB + phpMyAdmin

> Complete and configurable development environment for PHP with Apache, MySQL/MariaDB and phpMyAdmin

[![GitHub Codespaces](https://img.shields.io/badge/Codespaces-Ready-brightgreen?logo=github)](https://github.com/codespaces)
# Codespace Template — Apache + PHP + MariaDB + phpMyAdmin

This repository is a ready-to-use GitHub Codespaces / devcontainer template that brings up a
local PHP development environment including Apache, PHP, MariaDB (or MySQL) and phpMyAdmin.

It is intended as a starting point for PHP web projects and makes it easy to reproduce a
consistent dev environment across machines.

Badges:

[![GitHub Codespaces](https://img.shields.io/badge/Codespaces-Ready-brightgreen?logo=github)](https://github.com/codespaces)
[![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![Apache](https://img.shields.io/badge/Apache-2.4-D22128?logo=apache&logoColor=white)](https://httpd.apache.org/)
[![MariaDB](https://img.shields.io/badge/MariaDB-10.11-003545?logo=mariadb&logoColor=white)](https://mariadb.org/)

Key features

- Configurable via `.devcontainer/.env` (copy from `.env.example`)
- Modular scripts in `.devcontainer/` to configure Apache, PHP, MariaDB and phpMyAdmin
- Reload configuration without rebuilding the container using `reload-services.sh`
- Optional Xdebug / Node.js installation via `.env` flags

Quick start

1. Copy the example environment file:

```bash
cp .devcontainer/.env.example .devcontainer/.env
```

2. Edit `.devcontainer/.env` to set passwords, database name, document root and other options.

3. Open the repository in GitHub Codespaces or build the devcontainer locally — the `init.sh`
	script runs automatically to configure services.

Important `.env` variables (examples)

```env
# Database
MYSQL_ROOT_PASSWORD=change_me
MYSQL_DATABASE=app_database
MYSQL_USER=app_user
MYSQL_PASSWORD=change_me

# Apache
APACHE_DOCUMENT_ROOT=public
APACHE_PORT=80

# PHP
PHP_MEMORY_LIMIT=256M
PHP_UPLOAD_MAX_FILESIZE=64M

# Optional
INSTALL_XDEBUG=false
INSTALL_NODEJS=false
```

Notes

- Never commit secrets to the repository. Keep `.devcontainer/.env` out of version control.
- `PHPMYADMIN_BLOWFISH_SECRET` should be at least 32 characters for phpMyAdmin cookie security.

Using the template in another project

1. Copy the `.devcontainer/` directory into your project root.
2. Adjust `APACHE_DOCUMENT_ROOT` to point to your app's public folder (for example `www/public`).
3. Adjust `devcontainer.json` port forwards if you change default ports.

Starting, stopping and reloading services

Reload configuration without rebuild:

```bash
bash .devcontainer/reload-services.sh
```

Restart services manually inside the container:

```bash
sudo service apache2 restart
sudo service mariadb restart
```

Check status:

```bash
sudo service apache2 status
sudo service mariadb status
```

Accessing services

- Application: `http://localhost:<APACHE_PORT>` (default `80`)
- phpMyAdmin: `http://localhost:<APACHE_PORT>/phpmyadmin`
- MySQL: `localhost:3306` (use credentials from `.devcontainer/.env`)

Troubleshooting

- Apache errors: `sudo tail -f /var/log/apache2/error.log`
- MySQL errors: `sudo tail -f /var/log/mysql/error.log` or `sudo journalctl -u mariadb`
- Test Apache configuration: `apache2ctl configtest`

If MySQL access is denied, re-check credentials in `.env` and run the configure script:

```bash
bash .devcontainer/configure-mysql.sh
```

Collaboration and contributions

- Keep `.devcontainer/.env.example` generic and free of secrets.
- Document changes to initialization scripts inside `.devcontainer/CONFIGURATION.md`.
- Make optional features opt-in via `.env` flags and document them.
- Contributions via issues and pull requests are welcome.

Example commands

```bash
# create .env from example
cp .devcontainer/.env.example .devcontainer/.env

# edit .env
nano .devcontainer/.env

# reload services
bash .devcontainer/reload-services.sh

# view logs
sudo tail -f /var/log/apache2/error.log
```

License

This template is open-source. Use and modify as needed.

---

If you want, I can also translate `CONFIGURATION.md` to English or run a final repo-wide check for any remaining Portuguese strings.
sudo service mariadb restart

# tail logs
sudo tail -f /var/log/apache2/error.log
```

## License & Contribution

This template is open-source. Contributions are welcome via issues and pull requests.

---

If you'd like, I can also update other docs or run a repo-wide check for remaining occurrences of the old name.

``` 
