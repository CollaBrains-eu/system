<?php
/**
 * Plugin Name: Oxxa Studio — Multisite Reseller Manager
 * Plugin URI:  https://github.com/CollaBrains-eu/system
 * Description: A white-label web studio and Oxxa reseller manager for WordPress Multisite networks.
 * Version:     1.6.0
 * Requires at least: 6.4
 * Requires PHP: 7.4
 * Author:      CollaBrains
 * License:     GPL-2.0-or-later
 * Network:     true
 * Text Domain: oxxa-studio
 */

if (!defined('ABSPATH')) {
    exit;
}

define('OXXA_STUDIO_VERSION', '1.6.0');
define('OXXA_STUDIO_FILE', __FILE__);
define('OXXA_STUDIO_DIR', plugin_dir_path(__FILE__));
define('OXXA_STUDIO_URL', plugin_dir_url(__FILE__));

require_once OXXA_STUDIO_DIR . 'includes/class-oxxa-api.php';
require_once OXXA_STUDIO_DIR . 'includes/class-oxxa-ssl.php';
require_once OXXA_STUDIO_DIR . 'includes/class-oxxa-directadmin.php';
require_once OXXA_STUDIO_DIR . 'includes/class-oxxa-rest.php';
require_once OXXA_STUDIO_DIR . 'includes/class-oxxa-plugin.php';

register_activation_hook(__FILE__, 'oxxa_studio_activate');

function oxxa_studio_activate()
{
    if (!is_multisite()) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die(
            esc_html__('Oxxa Studio requires WordPress Multisite. Convert this installation to Multisite, then network activate the plugin.', 'oxxa-studio'),
            esc_html__('Multisite required', 'oxxa-studio'),
            array('back_link' => true)
        );
    }

    if (!get_network_option(null, 'oxxa_studio_settings')) {
        add_network_option(null, 'oxxa_studio_settings', array(
            'username' => '',
            'password' => '',
            'test_mode' => true,
            'registrant_identity' => '',
            'admin_identity' => '',
            'tech_identity' => '',
            'billing_identity' => '',
            'nsgroup' => '',
            'auto_ssl' => true,
            'auto_backups' => true,
            'brand_color' => '#C6EF85',
            'email_updates' => true,
            'domain_alerts' => true,
            'directadmin_url' => '',
            'directadmin_username' => '',
            'directadmin_password' => '',
        ));
    }
}

function oxxa_studio_boot()
{
    if (!is_multisite()) {
        add_action('network_admin_notices', function () {
            echo '<div class="notice notice-error"><p>' . esc_html__('Oxxa Studio only runs on WordPress Multisite.', 'oxxa-studio') . '</p></div>';
        });
        return;
    }

    new Oxxa_Studio_Plugin();
    new Oxxa_Studio_REST();
}
add_action('plugins_loaded', 'oxxa_studio_boot');
