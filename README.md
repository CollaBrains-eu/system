# Oxxa Studio

A full-screen **WordPress Multisite network manager and white-label web studio** for Oxxa resellers. The repository contains the installable PHP plugin, a companion block theme, and the React interface used by both the WordPress plugin and the interactive preview.

## Included

- **Guided onboarding:** real WordPress/PHP requirement checks, Oxxa authentication, registration defaults, theme readiness, and a safe API lookup
- **Network dashboard:** site health, revenue, recent websites, and studio activity
- **WordPress Multisite:** real site provisioning with `wpmu_create_blog()`, live/draft/maintenance states, network paths, and client ownership
- **Oxxa reseller tools:** XML API availability checks, domain registration with confirmation, portfolio sync, and auto-renew controls
- **Clients and billing:** persistent client records and invoices, CSV exports, revenue reporting UI
- **Hosting workspace:** package and resource presentation, service health, and backup actions
- **Web studio:** reusable templates and an interactive visual editor for shared homepage content, colors, type, sizing, and button styles
- **Companion block theme:** applies published studio designs on network sites; native WordPress Site Editor support for all other content
- **Security:** `manage_network` checks on every REST route, nonces, encrypted Oxxa passwords, sanitized inputs, and safe XML parsing

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

### Publishing designs

Open **Design studio**, choose a project, and edit the shared template. **Publish** saves the design through the WordPress REST API. Sites using that template and the companion theme receive the shared homepage heading, eyebrow, colors, font, heading size, and button radius. Use the native **WordPress Site Editor** for additional pages, posts, navigation, and unique per-site blocks.

## Live-data boundaries

The Multisite records, Oxxa availability/registration/auto-renew actions, client/invoice records, and published design tokens have PHP adapters. The standalone preview uses sample data. Hosting usage graphs, visits, revenue totals, payment reminders, backups, and payment collection need adapters for the specific hosting/control-panel, analytics, backup, and payment providers; they are not silently represented as completed live integrations.

Invoice records use network options. There is no bundled payment gateway or automatic charge to clients. Domain registration is the only paid Oxxa action exposed, and it always requires confirmation.

## Project layout

```text
src/                         React + TypeScript application
  components/                Shell primitives, charts, forms, modals
  pages/                     Dashboard, network tools, billing, editor
wordpress/
  oxxa-studio/               Network-only WordPress plugin
    includes/class-oxxa-api.php
    includes/class-oxxa-rest.php
    includes/class-oxxa-plugin.php
  oxxa-studio-theme/         Companion block theme
scripts/package-plugin.mjs   Installable ZIP builder
```

## Oxxa API reference

The adapter uses Oxxa's documented XML endpoint, `https://api.oxxa.com/command.php`, with the `MD5` password form and `test=Y` support. Commands include `domain_check`, `domain_list`, `register`, and `autorenew`. See Oxxa's current API documentation for identity, nameserver, TLD-specific, and order requirements.
