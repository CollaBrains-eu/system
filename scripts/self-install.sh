#!/usr/bin/env bash
# Oxxa Studio 1.6.0 — interactive WordPress Multisite installer.
# Run as the DirectAdmin account user, not root. No secrets are logged.
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ZIP="${PLUGIN_ZIP:-$SCRIPT_DIR/oxxa-studio.zip}"
THEME_ZIP="${THEME_ZIP:-$SCRIPT_DIR/oxxa-studio-theme.zip}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

info() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mWarning:\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'HELP'
Oxxa Studio self-installer

Usage:
  bash install.sh

Required before starting:
  - A DirectAdmin domain such as studio.collabrains.de with HTTPS.
  - An empty, writable document root.
  - An existing MySQL/MariaDB database and database user.
  - PHP 7.4+ with openssl, simplexml, curl, json and mysqli.
  - DNS for studio.collabrains.de and, for subsites, *.studio.collabrains.de.

The script installs WordPress subdomain Multisite, the Oxxa Studio plugin and
companion theme. Run it as the DirectAdmin account user, never as root.
Provider credentials are intentionally configured later in Network Admin.

Optional environment variables:
  PLUGIN_ZIP=/absolute/path/oxxa-studio.zip
  THEME_ZIP=/absolute/path/oxxa-studio-theme.zip
HELP
  exit 0
fi

[[ "${EUID:-$(id -u)}" -ne 0 ]] || die "Run this script as the DirectAdmin account user, not root."
for command_name in php curl unzip mktemp; do
  command -v "$command_name" >/dev/null 2>&1 || die "Required command not found: $command_name"
done
[[ -f "$PLUGIN_ZIP" ]] || die "Plugin archive not found: $PLUGIN_ZIP"
[[ -f "$THEME_ZIP" ]] || die "Theme archive not found: $THEME_ZIP"

php -r 'if (version_compare(PHP_VERSION, "7.4.0", "<")) { fwrite(STDERR, "PHP 7.4+ is required.\n"); exit(1); }' || die "Upgrade PHP before installing."
for extension in openssl simplexml curl json mysqli; do
  php -r "exit(extension_loaded('$extension') ? 0 : 1);" || die "Required PHP extension is missing: $extension"
done

info "Preparing WP-CLI"
if command -v wp >/dev/null 2>&1; then
  wp_cli() { wp "$@"; }
else
  WP_PHAR="$TMP_DIR/wp-cli.phar"
  curl -fsSL "https://github.com/wp-cli/wp-cli/releases/download/v2.11.0/wp-cli-2.11.0.phar" -o "$WP_PHAR" || die "WP-CLI could not be downloaded. Install wp manually and retry."
  php "$WP_PHAR" --info >/dev/null 2>&1 || die "The downloaded WP-CLI could not run on this PHP installation."
  wp_cli() { php "$WP_PHAR" "$@"; }
fi
wp_at() { wp_cli --path="$WP_PATH" "$@"; }

info "Installation details"
read -r -p "Network domain [studio.collabrains.de]: " DOMAIN
DOMAIN="${DOMAIN:-studio.collabrains.de}"
DOMAIN="${DOMAIN,,}"
[[ "$DOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || die "Enter a hostname only, without https:// or a path."

DEFAULT_PATH="$HOME/domains/$DOMAIN/public_html"
read -r -p "Empty WordPress document root [$DEFAULT_PATH]: " WP_PATH
WP_PATH="${WP_PATH:-$DEFAULT_PATH}"
[[ "$WP_PATH" = /* ]] || die "The document root must be an absolute path."
[[ "$WP_PATH" != "/" && "$WP_PATH" != "$HOME" ]] || die "Refusing to install directly in / or your home directory."

read -r -p "Network title [CollaBrains Studio]: " NETWORK_TITLE
NETWORK_TITLE="${NETWORK_TITLE:-CollaBrains Studio}"
read -r -p "WordPress locale [nl_NL]: " WP_LOCALE
WP_LOCALE="${WP_LOCALE:-nl_NL}"
read -r -p "Admin username [collabrains_admin]: " ADMIN_USER
ADMIN_USER="${ADMIN_USER:-collabrains_admin}"
[[ "$ADMIN_USER" =~ ^[A-Za-z][A-Za-z0-9_.-]{2,59}$ ]] || die "Use 3–60 letters, numbers, dots, underscores or hyphens for the admin username."
read -r -p "Admin email: " ADMIN_EMAIL
[[ "$ADMIN_EMAIL" == *@*.* ]] || die "Enter a valid admin email address."
while true; do
  read -r -s -p "New WordPress admin password (minimum 16 characters): " ADMIN_PASS
  printf '\n'
  read -r -s -p "Repeat admin password: " ADMIN_PASS_CONFIRM
  printf '\n'
  [[ "$ADMIN_PASS" == "$ADMIN_PASS_CONFIRM" ]] || { warn "Passwords do not match."; continue; }
  [[ "${#ADMIN_PASS}" -ge 16 && "${#ADMIN_PASS}" -le 200 ]] || { warn "Use a password between 16 and 200 characters."; continue; }
  break
done
unset ADMIN_PASS_CONFIRM

info "Existing database credentials (create these first in DirectAdmin)"
read -r -p "Database name: " DB_NAME
read -r -p "Database username: " DB_USER
read -r -p "Database host [localhost]: " DB_HOST
DB_HOST="${DB_HOST:-localhost}"
read -r -s -p "Database password: " DB_PASS
printf '\n'
[[ -n "$DB_NAME" && -n "$DB_USER" && -n "$DB_PASS" ]] || die "Database name, username and password are required."

PUBLIC_IP="$(curl -4fsSL --max-time 8 https://api.ipify.org 2>/dev/null || true)"
printf '\nDomain:       %s\nDocument root: %s\nNetwork:      %s\n' "$DOMAIN" "$WP_PATH" "$NETWORK_TITLE"
[[ -z "$PUBLIC_IP" ]] || printf 'Outbound IP:  %s (use this for provider IP allowlists after verification)\n' "$PUBLIC_IP"
if getent hosts "$DOMAIN" >/dev/null 2>&1; then
  printf 'DNS:          hostname resolves\n'
else
  warn "The hostname does not resolve yet. DNS must work before WordPress can be opened over HTTPS."
fi
read -r -p "Continue with this installation? [y/N]: " CONFIRM
[[ "$CONFIRM" == "y" || "$CONFIRM" == "Y" ]] || die "Installation cancelled; no files were changed."

if [[ -d "$WP_PATH" ]] && [[ -n "$(find "$WP_PATH" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  die "The document root is not empty. Use a fresh domain or empty it deliberately after making a backup: $WP_PATH"
fi
mkdir -p "$WP_PATH" || die "The document root is not writable: $WP_PATH"
[[ -w "$WP_PATH" ]] || die "The document root is not writable: $WP_PATH"

if command -v mysql >/dev/null 2>&1; then
  info "Checking database access"
  MYSQL_PWD="$DB_PASS" mysql --connect-timeout=8 --host="$DB_HOST" --user="$DB_USER" --execute="SELECT 1" "$DB_NAME" >/dev/null 2>&1 || die "The database connection failed. Check the database, user, host and password in DirectAdmin."
else
  warn "The mysql client is unavailable; WordPress will check database access during installation."
fi

info "Downloading WordPress"
wp_at core download --locale="$WP_LOCALE"

info "Creating wp-config.php and security salts"
wp_at config create --dbname="$DB_NAME" --dbuser="$DB_USER" --dbpass="$DB_PASS" --dbhost="$DB_HOST" --skip-check --skip-salts
wp_at config shuffle-salts
wp_at config set WP_ALLOW_MULTISITE true --raw
wp_at config set DISALLOW_FILE_EDIT true --raw
wp_at config set WP_DEBUG false --raw
wp_at config set WP_DEBUG_DISPLAY false --raw

info "Installing the subdomain Multisite network"
wp_at core multisite-install --url="https://$DOMAIN" --title="$NETWORK_TITLE" --admin_user="$ADMIN_USER" --admin_password="$ADMIN_PASS" --admin_email="$ADMIN_EMAIL" --subdomains

# DirectAdmin normally uses Apache/LiteSpeed. Create the standard rules only
# for this fresh installation; never overwrite an existing rewrite file.
if [[ ! -f "$WP_PATH/.htaccess" ]]; then
  cat > "$WP_PATH/.htaccess" <<'HTACCESS'
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?wp-admin$ $1wp-admin/ [R=301,L]
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(wp-(content|admin|includes).*) $2 [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(.*\.php)$ $2 [L]
RewriteRule . index.php [L]
HTACCESS
fi

info "Installing and network-activating Oxxa Studio"
wp_at plugin install "$PLUGIN_ZIP" --activate-network
wp_at theme install "$THEME_ZIP"
wp_at theme enable oxxa-studio-theme --network
chmod 640 "$WP_PATH/wp-config.php"
chmod 644 "$WP_PATH/.htaccess"

unset DB_PASS ADMIN_PASS MYSQL_PWD

info "Running local verification"
wp_at core is-installed --network
wp_at plugin is-active oxxa-studio --network
wp_at option get siteurl
wp_at theme get oxxa-studio-theme --field=status >/dev/null 2>&1 || warn "The theme is installed but its status could not be read."

if curl -fsSIL --max-time 12 "https://$DOMAIN/wp-admin/" >/dev/null 2>&1; then
  printf 'HTTPS check:  WordPress admin responds\n'
else
  warn "WordPress is installed locally, but HTTPS did not respond yet. Check DNS, the virtual host and the TLS certificate."
fi

cat <<DONE

Installation complete.

Network Admin:
  https://$DOMAIN/wp-admin/network/

Next, configure real providers in Oxxa Studio:
  1. Open Oxxa Studio → Setup guide and review system health.
  2. Network settings → Oxxa: API user, separate API password, identities and nsgroup.
  3. Whitelist the verified outbound IP in My Oxxa; test and save.
  4. Domains → Sync domains and SSL certificates → Sync SSL inventory.
  5. Create a separate User-level DirectAdmin Login Key for WordPress.
  6. Network settings → DirectAdmin: base URL, username and Login Key; test and save.
  7. Hosting → Sync DirectAdmin.
  8. Use a different Login Key and Oxxa's source IPs for the Oxxa SSL server profile.

Do not use the Arena preview for live data. Do not place a paid order, change
auto-renew or create a mailbox unless that change is explicitly intended.
DONE
