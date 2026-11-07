=== Oxxa Studio — Multisite Reseller Manager ===
Contributors: collabrains
Tags: multisite, oxxa, reseller, domains, hosting, web studio
Requires at least: 6.4
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
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
The bundled hosting graphs are presentation defaults. Real resource graphs require metrics from your specific Oxxa hosting package/control panel. Domain and Multisite records are live when configured.

== Changelog ==

= 1.0.0 =
* Initial Multisite web-studio and Oxxa reseller integration.
