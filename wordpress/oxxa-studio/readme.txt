=== Oxxa Studio — Multisite Reseller Manager ===
Contributors: collabrains
Tags: multisite, oxxa, reseller, domains, hosting, web studio
Requires at least: 6.4
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.6.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A white-label web studio and Oxxa reseller manager for WordPress Multisite.

== Description ==

Oxxa Studio adds a Network Admin workspace for provisioning client websites, managing Oxxa domains, storing client records and invoices, and publishing shared designs to the companion Oxxa Studio Blocks theme.

* WordPress Multisite site provisioning with wpmu_create_blog()
* Oxxa XML domain availability, registration, portfolio sync and auto-renew
* AES-256-GCM encrypted server-side API credentials
* Oxxa test mode and explicit registration confirmation
* Network capability checks on every REST endpoint
* Guided first-run onboarding and real system-health checks
* Explicit, persistent Oxxa portfolio synchronization
* DirectAdmin account, usage, and validated mailbox integration
* Read-only Oxxa SSL certificate, product, and install-server inventory
* Client and invoice records stored in network options
* Shared design tokens and homepage content for network templates
* Maintenance mode and live/draft site state

== Installation ==

1. Install WordPress Multisite and log in as a super admin.
2. Upload and network activate Oxxa Studio.
3. Install the companion Oxxa Studio Blocks theme and enable it for the network.
4. Open Network Admin → Oxxa Studio → Network settings.
5. Add your separate Oxxa API username and password.
6. Whitelist this server's IP in My Account → API at my.oxxa.com.
7. Configure a registrant identity and nameserver group. Keep test mode enabled while validating the workflow.

== Frequently Asked Questions ==

= Does this work on single-site WordPress? =
No. Oxxa Studio intentionally requires Multisite and the manage_network capability.

= Are Oxxa credentials sent to the browser? =
No. Only the WordPress REST backend communicates with Oxxa. The password is encrypted in a network option and is never returned by the API.

= Does test mode make every command read-only? =
No. Oxxa documents test=Y for register and transfer commands. Commands such as auto-renew can still change your live account. The interface calls this out in Network settings.

= Is a payment gateway included? =
No. Client invoices and revenue records are included, but payment collection requires your chosen invoicing/payment provider.

= Are hosting graphs live server metrics? =
When DirectAdmin is configured, package limits, disk usage, bandwidth, and account-service counts come from the authenticated user-level account. Server load, per-site usage, backup status, and service health are not inferred. Standalone preview metrics are labeled demo data.

= Which DirectAdmin permissions are required? =
Account sync uses the modern /api/session/user-config and /api/session/user-usage reads first, with CMD_API_SHOW_USER_CONFIG and CMD_API_SHOW_USER_USAGE as older-server fallback. Use a restricted Login Key and add CMD_API_POP only for mailbox listing and explicit creation. Restrict its source IP where possible. Mailbox passwords are never stored, and your main DirectAdmin password is not required.

== Changelog ==

= 1.6.0 =
* Added modern DirectAdmin session user-config and user-usage synchronization.
* Added byte-to-MB normalization for modern nested resource limits and usage.
* Retained legacy account fallback and CMD_API_POP mailbox compatibility.

= 1.5.0 =
* Added Oxxa SSL certificate inventory with status, dates, SANs, and auto-renew state.
* Added SSL product configurations, period prices, and automatic-installation server metadata.
* Added persistent read-only SSL sync without caching CSR, identity, validation, or credential content.

= 1.4.0 =
* Added DirectAdmin mailbox listing with quota, usage, send-limit, and suspension data.
* Added validated mailbox creation on the authenticated primary account domain.
* Mailbox passwords are POST-only, redacted from errors, and never stored or returned.

= 1.3.0 =
* Added encrypted DirectAdmin Login Key configuration and connection testing.
* Added read-only account configuration, package limits, storage, bandwidth, and service-count synchronization.
* Removed sample hosting metrics and service-health claims from live mode.

= 1.2.0 =
* Added explicit full Oxxa domain portfolio synchronization.
* Persisted registrar metadata, expiry states, and last-sync time without blocking dashboard loading.
* Added honest live DNS states and data-driven domain metrics.

= 1.1.0 =
* Added guided setup wizard with WordPress/PHP requirement checks.
* Added Oxxa connection, registration-default, theme, and safe domain-lookup verification.

= 1.0.0 =
* Initial Multisite web-studio and Oxxa reseller integration.
