# Oxxa Studio

A full-screen **WordPress Multisite network manager and white-label web studio** for Oxxa resellers. The repository contains the installable PHP plugin, a companion block theme, and the React interface used by both the WordPress plugin and the interactive preview.

## Included

- **Guided onboarding:** real WordPress/PHP requirement checks, Oxxa authentication, registration defaults, theme readiness, and a safe API lookup
- **Network dashboard:** site health, revenue, recent websites, and studio activity
- **WordPress Multisite:** real site provisioning with `wpmu_create_blog()`, live/draft/maintenance states, network paths, and client ownership
- **Oxxa reseller tools:** XML API availability checks, domain registration with confirmation, portfolio sync, auto-renew controls, and read-only SSL inventory
- **Clients and billing:** persistent client records and invoices, CSV exports, revenue reporting UI
- **DirectAdmin hosting:** encrypted scoped Login Keys, connection testing, account/quota synchronization, and validated mailbox listing and creation
- **Web studio:** reusable templates and an interactive visual editor for shared homepage content, colors, type, sizing, and button styles
- **Companion block theme:** applies published studio designs on network sites; native WordPress Site Editor support for all other content
- **Security:** `manage_network` checks on every REST route, nonces, encrypted Oxxa passwords and DirectAdmin Login Keys, sanitized inputs, and safe XML parsing

## Interactive preview

```bash
npm install
npm run dev
```

Vite listens on `0.0.0.0:5173`. Without `window.oxxaStudio`, the interface uses clearly separated demo data and simulated latency. No real Oxxa order is made in this mode.

```bash
npm run lint       # TypeScript checks
npm run build      # production interface
```

## Install in WordPress Multisite

Requirements: WordPress 6.4+, Multisite, PHP 7.4+, OpenSSL, SimpleXML, and a super-admin account.

```bash
npm ci
npm run build:plugin
```

This creates:

- `release/oxxa-studio.zip` — network-activated management plugin
- `release/oxxa-studio-theme.zip` — companion block theme
- `release/oxxa-studio-self-installer.zip` — interactive server installer, both ZIPs, and the standalone installation prompt

For a fresh DirectAdmin-hosted subdomain network, upload and extract the self-installer archive outside the new site's document root, then run `bash install.sh` as the DirectAdmin account user. It installs WordPress subdomain Multisite and both Oxxa Studio packages. The source script is `scripts/self-install.sh`; the full agent/manual prompt and provider steps are in `SELF-INSTALLATION.md`. The database, DNS, virtual host, and TLS certificate must exist first, and provider credentials are configured afterward in Network Admin.

Then:

1. In **Network Admin → Plugins → Add New → Upload Plugin**, install `oxxa-studio.zip` and **Network Activate** it.
2. In **Network Admin → Themes → Add New**, install `oxxa-studio-theme.zip` and **Network Enable** it.
3. Open **Network Admin → Oxxa Studio**. If Oxxa is not configured, the **Setup guide** opens automatically and walks through system health, authentication, registration defaults, theme readiness, and a read-only test lookup.
4. Add the **separate Oxxa API username/password** from **My Account → API** in `my.oxxa.com`.
5. Add the WordPress server's verified public outbound IP to the **Oxxa API IP whitelist**. Optionally set `define('OXXA_STUDIO_PUBLIC_IP', '203.0.113.42');` in `wp-config.php` (replace the documentation example with your real IP) so it appears in Network settings.
6. Set the default **registrant identity** and **nameserver group**. Registration uses the registrant for admin/tech/billing unless separate handles are supplied through the settings adapter.
7. Keep **Oxxa test mode** on for the initial end-to-end check. Test a domain, confirm the response, then disable test mode only when you are ready for paid registrations.

> **Safety:** Oxxa documents `test=Y` for registration and transfer commands. It does not make every account command read-only; auto-renew and similar commands may still change live services.

### Provisioning sites

Choose **Create new → Website**. Oxxa Studio creates a draft network site, assigns its client/template metadata, and activates Oxxa Studio Blocks when available. Subdirectory and subdomain Multisite installations are supported by the PHP provisioner. Custom domains are stored as mapping metadata; DNS changes and Registrar transfers remain explicit Oxxa operations.

### Synchronizing domains

Open **Domains → Sync Oxxa** to retrieve the complete account portfolio with the documented `domain_list records=-1` request. The operation imports expiry dates, auto-renew state, nameserver group, registrant handle, and last-renewal date; preserves local client/site mappings; and stores the results plus a last-sync timestamp in network options. Dashboard loading no longer waits for Oxxa. Sync is read-only at Oxxa and never registers or renews a domain. Standalone preview refresh is explicitly local demo behavior.

Portfolio sync does not inspect DNS zones or prove public resolution. Newly imported domains therefore show **DNS not verified**, not a fabricated connected state.

### Oxxa SSL inventory

Open **SSL certificates → Sync SSL inventory** to run the read-only Oxxa v2.05 commands `ssl_list`, `ssl_product_list`, and `server_list`. The network cache contains certificate domains, product names, periods, status, start/end dates, SANs, and auto-renew state; product validation/wildcard/CNAME configuration and period prices; and SSL-installation server IDs, types, names, hosts, and creation dates. No CSR, identity, authentication content, password, private key, or DirectAdmin Login Key is cached.

This milestone does not call `ssl_new`, `ssl_cancel`, `ssl_autorenew`, `server_create`, `server_update`, or `server_delete`. Product prices are inventory data, not a confirmed checkout. Changing the Oxxa username or password clears the cached SSL snapshot so one reseller account cannot appear as another.

### Connecting DirectAdmin

Open **Network settings → DirectAdmin** and enter the HTTPS base URL (normally port `2222`), the hosting-account username, and a restricted **Login Key**, not the main DirectAdmin password. Create the key under DirectAdmin Login Keys, restrict it to the WordPress server's IP where possible, and allow only:

- `CMD_API_SHOW_USER_CONFIG`
- `CMD_API_SHOW_USER_USAGE`
- `CMD_API_POP` — only when mailbox listing and creation are required

Account sync first uses the modern read-only `/api/session/user-config` and `/api/session/user-usage` endpoints. Their nested `quotaBytes` and `bandwidthBytes` values are converted from bytes to MB. If these routes are unavailable or not permitted, account sync falls back to `CMD_API_SHOW_USER_CONFIG` and `CMD_API_SHOW_USER_USAGE`; mailbox management continues to use `CMD_API_POP`.

Test the connection, save, then choose **Hosting → Sync DirectAdmin**. WordPress uses HTTPS Basic Auth, stores the Login Key with the same AES-256-GCM protection as the Oxxa password, and caches only non-secret account/usage data. Legacy requests add `json=yes`; modern REST requests do not need it. The snapshot represents the authenticated **user-level account**, not an inferred reseller-wide total. Hosting identifies whether the last sync used modern REST or legacy compatibility mode. Clearing the URL or username and saving removes the stored key and cached snapshot.

**Hosting → Email accounts** lists real mailbox quota, usage, send counts, daily limits, and suspension state with `CMD_API_POP action=full_list`. Creating a mailbox requires a valid local part, a 12–128 character password with confirmation, a finite quota, and a daily send limit. The create POST contains `action=create`, `passwd`, and `passwd2`; the password is never persisted or returned, and is redacted from provider errors. Every list/create request revalidates that the domain is the authenticated account's primary domain. Demo mailbox creation is local and explicitly labeled.

Account and usage synchronization remain read-only. Mailbox deletion and password resets are not exposed. The integration does not create or modify hosting accounts, packages, DNS records, databases, FTP users, or backups. Server load, service health, and per-site resource usage are not inferred from account totals.

### Publishing designs

Open **Design studio**, choose a project, and edit the shared template. **Publish** saves the design through the WordPress REST API. Sites using that template and the companion theme receive the shared homepage heading, eyebrow, colors, font, heading size, and button radius. Use the native **WordPress Site Editor** for additional pages, posts, navigation, and unique per-site blocks.

## Live-data boundaries

The Multisite records, Oxxa availability/registration/auto-renew actions, DirectAdmin user-level account usage and mailbox listing/creation, client/invoice records, and published design tokens have PHP adapters. The standalone preview uses sample data. Per-site hosting usage graphs, visits, revenue totals, payment reminders, backups, and payment collection still need adapters for the specific metrics, analytics, backup, and payment providers; they are not silently represented as completed live integrations.

Invoice records use network options. There is no bundled payment gateway or automatic charge to clients. Domain registration is the only paid Oxxa action exposed, and it always requires confirmation.

## Project layout

```text
src/                         React + TypeScript application
  components/                Shell primitives, charts, forms, modals
  pages/                     Dashboard, network tools, billing, editor
wordpress/
  oxxa-studio/               Network-only WordPress plugin
    includes/class-oxxa-api.php
    includes/class-oxxa-directadmin.php
    includes/class-oxxa-ssl.php
    includes/class-oxxa-rest.php
    includes/class-oxxa-plugin.php
  oxxa-studio-theme/         Companion block theme
scripts/package-plugin.mjs   Installable ZIP builder
```

## Oxxa API reference

The adapter uses Oxxa's documented XML endpoint, `https://api.oxxa.com/command.php`, with the `MD5` password form and `test=Y` support. Commands include `domain_check`, `domain_list`, `register`, and `autorenew`. The read-only SSL adapter uses `ssl_list`, `ssl_product_list`, and `server_list` from the supplied Oxxa API v2.05 documentation. See Oxxa's current API documentation for identity, nameserver, TLD-specific, SSL, and order requirements.
