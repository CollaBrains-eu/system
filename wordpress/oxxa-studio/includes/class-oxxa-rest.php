<?php
if (!defined('ABSPATH')) {
    exit;
}

class Oxxa_Studio_REST
{
    const NS = 'oxxa-studio/v1';

    public function __construct()
    {
        add_action('rest_api_init', array($this, 'routes'));
    }

    public function permission()
    {
        return is_multisite() && current_user_can('manage_network');
    }

    public function routes()
    {
        $read = array('methods' => WP_REST_Server::READABLE, 'permission_callback' => array($this, 'permission'));
        $write = array('methods' => WP_REST_Server::CREATABLE, 'permission_callback' => array($this, 'permission'));

        register_rest_route(self::NS, '/network', array_merge($read, array('callback' => array($this, 'network'))));
        register_rest_route(self::NS, '/status', array_merge($read, array('callback' => array($this, 'status'))));
        register_rest_route(self::NS, '/settings', array_merge($write, array('callback' => array($this, 'save_settings'))));
        register_rest_route(self::NS, '/connection/test', array_merge($write, array('callback' => array($this, 'test_connection'))));
        register_rest_route(self::NS, '/directadmin', array_merge($read, array('callback' => array($this, 'directadmin'))));
        register_rest_route(self::NS, '/directadmin/test', array_merge($write, array('callback' => array($this, 'directadmin_test'))));
        register_rest_route(self::NS, '/directadmin/sync', array_merge($write, array('callback' => array($this, 'directadmin_sync'))));
        register_rest_route(self::NS, '/domains/sync', array_merge($write, array('callback' => array($this, 'domain_sync'))));
        register_rest_route(self::NS, '/domain/check', array_merge($write, array('callback' => array($this, 'domain_check'))));
        register_rest_route(self::NS, '/domain/register', array_merge($write, array('callback' => array($this, 'domain_register'))));
        register_rest_route(self::NS, '/domain/autorenew', array_merge($write, array('callback' => array($this, 'domain_autorenew'))));
        register_rest_route(self::NS, '/sites', array_merge($write, array('callback' => array($this, 'create_site'))));
        register_rest_route(self::NS, '/sites/(?P<id>\d+)/status', array_merge($write, array('callback' => array($this, 'site_status'))));
        register_rest_route(self::NS, '/clients', array_merge($write, array('callback' => array($this, 'create_client'))));
        register_rest_route(self::NS, '/invoices', array_merge($write, array('callback' => array($this, 'create_invoice'))));
        register_rest_route(self::NS, '/designs', array_merge($write, array('callback' => array($this, 'save_design'))));
    }

    public function status()
    {
        global $wp_version;
        $settings = Oxxa_Studio_Oxxa_API::get_settings();
        $theme = wp_get_theme('oxxa-studio-theme');
        return rest_ensure_response(array(
            'multisite' => is_multisite(),
            'canProvision' => current_user_can('manage_network'),
            'openssl' => function_exists('openssl_encrypt') && function_exists('openssl_decrypt'),
            'simplexml' => function_exists('simplexml_load_string'),
            'https' => is_ssl() && strpos(home_url(), 'https://') === 0,
            'themeInstalled' => $theme->exists(),
            'themeEnabled' => $theme->exists() && $theme->is_allowed('network'),
            'credentials' => Oxxa_Studio_Oxxa_API::has_credentials($settings),
            'registrationReady' => !empty($settings['registrant_identity']) && !empty($settings['nsgroup']),
            'testMode' => !empty($settings['test_mode']),
            'siteCount' => (int) get_blog_count(),
            'phpVersion' => PHP_VERSION,
            'wpVersion' => $wp_version,
            'serverIp' => defined('OXXA_STUDIO_PUBLIC_IP') ? OXXA_STUDIO_PUBLIC_IP : '',
        ));
    }

    public function network()
    {
        $sites = array();
        foreach (get_sites(array('network_id' => get_current_network_id(), 'number' => 200, 'orderby' => 'last_updated', 'order' => 'DESC')) as $site) {
            $sites[] = $this->format_site($site);
        }

        return rest_ensure_response(array(
            'sites' => $sites,
            // Domain synchronization is explicit so an Oxxa timeout never blocks dashboard loading.
            'domains' => array_values($this->stored_domains()),
            'clients' => array_values(get_network_option(null, 'oxxa_studio_clients', array())),
            'invoices' => array_values(get_network_option(null, 'oxxa_studio_invoices', array())),
            'domainLastSync' => get_network_option(null, 'oxxa_studio_domain_last_sync', ''),
            'serverTime' => current_time('c'),
        ));
    }

    private function format_site($site)
    {
        $id = (int) $site->blog_id;
        $template = get_blog_option($id, 'oxxa_studio_template', 'Editorial');
        $palettes = array(
            'Editorial' => array('#e9e3d8', '#b46343'),
            'Forma' => array('#dde2df', '#52675d'),
            'Noon' => array('#efe0c8', '#bb6b35'),
            'Sage' => array('#dfe5d4', '#65774e'),
            'North' => array('#e4e0eb', '#77658f'),
            'Canvas' => array('#dce7e9', '#39727d'),
        );
        $palette = isset($palettes[$template]) ? $palettes[$template] : $palettes['Editorial'];
        $name = get_blog_option($id, 'blogname', sprintf(__('Site %d', 'oxxa-studio'), $id));
        $status = get_blog_option($id, 'oxxa_studio_status', ((int) $site->public === 1 ? 'Live' : 'Draft'));
        if ((int) $site->archived === 1 || (int) $site->deleted === 1) {
            $status = 'Maintenance';
        }
        $mapped = get_blog_option($id, 'oxxa_studio_domain', '');
        $trimmed_path = trim((string) $site->path, '/');
        $network_path = $trimmed_path ? '/' . $trimmed_path . '/' : '/';
        $fallback = $site->domain . ($network_path !== '/' ? $network_path : '');
        $words = preg_split('/\s+/', trim($name));
        $initials = '';
        foreach (array_slice($words, 0, 2) as $word) {
            $initials .= function_exists('mb_substr') ? mb_substr($word, 0, 1) : substr($word, 0, 1);
        }
        $updated = strtotime($site->last_updated);
        return array(
            'id' => $id,
            'name' => $name,
            'client' => get_blog_option($id, 'oxxa_studio_client', 'Unassigned'),
            'domain' => $mapped ?: untrailingslashit($fallback),
            'networkPath' => $network_path,
            'status' => $status,
            'template' => $template,
            'updated' => $updated ? human_time_diff($updated, current_time('timestamp')) . ' ago' : __('Recently', 'oxxa-studio'),
            'visits' => '—',
            'storage' => (float) get_blog_option($id, 'oxxa_studio_storage', 0.2),
            'theme' => $palette[0],
            'accent' => $palette[1],
            'initials' => strtoupper($initials),
        );
    }

    public function create_site(WP_REST_Request $request)
    {
        $title = sanitize_text_field((string) $request->get_param('name'));
        $slug = sanitize_title((string) $request->get_param('path'));
        if (!$title || !$slug) {
            return new WP_Error('invalid_site', __('A website name and valid network path are required.', 'oxxa-studio'), array('status' => 400));
        }
        $current = get_current_site();
        $domain = $current->domain;
        $path = '/' . $slug . '/';
        if (is_subdomain_install()) {
            $domain = $slug . '.' . $current->domain;
            $path = '/';
        } else {
            $path = '/' . trim($current->path, '/') . '/' . $slug . '/';
            $path = str_replace('//', '/', $path);
        }
        if (domain_exists($domain, $path, get_current_network_id())) {
            return new WP_Error('site_exists', __('A website already exists at this network address.', 'oxxa-studio'), array('status' => 409));
        }

        $site_id = wpmu_create_blog($domain, $path, $title, get_current_user_id(), array('public' => 0), get_current_network_id());
        if (is_wp_error($site_id)) {
            return $site_id;
        }
        switch_to_blog($site_id);
        update_option('oxxa_studio_client', sanitize_text_field((string) $request->get_param('client')));
        update_option('oxxa_studio_template', sanitize_text_field((string) $request->get_param('template')) ?: 'Editorial');
        update_option('oxxa_studio_status', 'Draft');
        $custom_domain = strtolower(sanitize_text_field((string) $request->get_param('domain')));
        if ($custom_domain && strpos($custom_domain, $current->domain) === false) {
            $parts = Oxxa_Studio_Oxxa_API::split_domain($custom_domain);
            if (!is_wp_error($parts)) {
                update_option('oxxa_studio_domain', $parts['domain']);
            }
        }
        if (wp_get_theme('oxxa-studio-theme')->exists()) {
            switch_theme('oxxa-studio-theme');
        }
        restore_current_blog();

        $site = get_site($site_id);
        return rest_ensure_response($this->format_site($site));
    }

    public function site_status(WP_REST_Request $request)
    {
        $id = absint($request->get_param('id'));
        $status = sanitize_text_field((string) $request->get_param('status'));
        if (!get_site($id) || !in_array($status, array('Live', 'Draft', 'Maintenance'), true)) {
            return new WP_Error('invalid_site_status', __('The site or status is invalid.', 'oxxa-studio'), array('status' => 400));
        }
        switch_to_blog($id);
        update_option('oxxa_studio_status', $status);
        update_option('blog_public', $status === 'Draft' ? 0 : 1);
        restore_current_blog();
        return rest_ensure_response(array('id' => $id, 'status' => $status));
    }

    /**
     * Read the complete Oxxa portfolio and upsert it into network storage.
     * This endpoint is read-only at Oxxa: it never registers or renews a domain.
     */
    public function domain_sync()
    {
        $api = new Oxxa_Studio_Oxxa_API();
        $response = $api->request('domain_list', array('records' => -1, 'sortname' => 'sld', 'sortorder' => 'ASC'));
        if (is_wp_error($response)) {
            return $response;
        }

        $local = $this->stored_domains();
        $remote = $this->format_domains($response, $local);
        $merged = $local;
        $imported = 0;
        $updated = 0;
        foreach ($remote as $domain) {
            if (isset($local[$domain['name']])) {
                $updated++;
            } else {
                $imported++;
            }
            $merged[$domain['name']] = $domain;
        }
        update_network_option(null, 'oxxa_studio_domains', $merged);
        $synced_at = current_time('c');
        update_network_option(null, 'oxxa_studio_domain_last_sync', $synced_at);

        return rest_ensure_response(array(
            'domains' => array_values($merged),
            'imported' => $imported,
            'updated' => $updated,
            'total' => count($remote),
            'syncedAt' => $synced_at,
            'testMode' => $api->is_test_mode(),
        ));
    }

    public function domain_check(WP_REST_Request $request)
    {
        $api = new Oxxa_Studio_Oxxa_API();
        $result = $api->check_domain((string) $request->get_param('domain'));
        return is_wp_error($result) ? $result : rest_ensure_response($result);
    }

    public function domain_register(WP_REST_Request $request)
    {
        $api = new Oxxa_Studio_Oxxa_API();
        $result = $api->register_domain((string) $request->get_param('domain'), absint($request->get_param('years')) ?: 1);
        if (is_wp_error($result)) {
            return $result;
        }
        $domains = $this->stored_domains();
        $domains[$result['domain']] = array(
            'id' => time(),
            'name' => $result['domain'],
            'client' => 'Unassigned',
            'expiry' => $result['test_mode'] ? 'Test registration' : gmdate('d M Y', strtotime('+' . absint($request->get_param('years')) . ' years')),
            'autoRenew' => true,
            'status' => 'Pending',
            'site' => 'Not mapped',
            'dns' => 'Action needed',
            'orderId' => $result['order_id'],
        );
        update_network_option(null, 'oxxa_studio_domains', $domains);
        return rest_ensure_response($result);
    }

    public function domain_autorenew(WP_REST_Request $request)
    {
        $parts = Oxxa_Studio_Oxxa_API::split_domain((string) $request->get_param('domain'));
        if (is_wp_error($parts)) {
            return $parts;
        }
        $enabled = rest_sanitize_boolean($request->get_param('enabled'));
        $api = new Oxxa_Studio_Oxxa_API();
        $response = $api->request('autorenew', array('sld' => $parts['sld'], 'tld' => $parts['tld'], 'autorenew' => $enabled ? 'Y' : 'N'));
        if (is_wp_error($response)) {
            return $response;
        }
        $domains = $this->stored_domains();
        if (isset($domains[$parts['domain']])) {
            $domains[$parts['domain']]['autoRenew'] = $enabled;
            update_network_option(null, 'oxxa_studio_domains', $domains);
        }
        return rest_ensure_response(array('domain' => $parts['domain'], 'autoRenew' => $enabled));
    }

    private function stored_domains()
    {
        $domains = get_network_option(null, 'oxxa_studio_domains', array());
        return is_array($domains) ? $domains : array();
    }

    private function format_domains($xml, $local)
    {
        $result = array();
        if (!isset($xml->details->domain)) {
            return array();
        }
        foreach ($xml->details->domain as $record) {
            $name = strtolower(trim((string) $record->domainname));
            if (is_wp_error(Oxxa_Studio_Oxxa_API::split_domain($name))) {
                continue;
            }
            $expiry = strtotime((string) $record->expire_date);
            $now = time();
            $expired = $expiry && $expiry < $now;
            $expiring = $expiry && !$expired && $expiry < strtotime('+30 days');
            $status = $expired ? 'Expired' : ($expiring ? 'Expiring soon' : 'Active');
            $existing = isset($local[$name]) ? $local[$name] : array();
            $last_renewed = strtotime((string) $record->last_renew_date);
            $result[$name] = array_merge($existing, array(
                'id' => isset($existing['id']) ? $existing['id'] : hexdec(substr(md5($name), 0, 7)),
                'name' => $name,
                'client' => isset($existing['client']) ? $existing['client'] : 'Oxxa portfolio',
                'expiry' => $expiry ? wp_date('d M Y', $expiry) : (string) $record->expire_date,
                'autoRenew' => strtoupper((string) $record->autorenew) === 'Y',
                'status' => $status,
                'site' => isset($existing['site']) ? $existing['site'] : 'Not mapped',
                // domain_list does not inspect a DNS zone, so never claim connectivity here.
                'dns' => isset($existing['dns']) ? $existing['dns'] : 'Not verified',
                'nsgroup' => sanitize_text_field((string) $record->nsgroup),
                'registrant' => sanitize_text_field((string) $record->{'identity-registrant'}),
                'lastRenewed' => $last_renewed ? wp_date('d M Y', $last_renewed) : '',
            ));
        }
        return array_values($result);
    }

    public function directadmin()
    {
        $settings = Oxxa_Studio_Oxxa_API::get_settings();
        $snapshot = get_network_option(null, 'oxxa_studio_directadmin_snapshot', array());
        $snapshot = is_array($snapshot) ? $snapshot : array();
        return rest_ensure_response(array_merge(array(
            'configured' => Oxxa_Studio_DirectAdmin_API::has_credentials($settings),
            'connected' => false,
            'url' => $settings['directadmin_url'],
            'username' => $settings['directadmin_username'],
            'lastSync' => '',
        ), $snapshot));
    }

    public function directadmin_test(WP_REST_Request $request)
    {
        $settings = Oxxa_Studio_Oxxa_API::get_settings();
        $plain_password = (string) $request->get_param('password');
        if ($request->offsetExists('url')) {
            $url = Oxxa_Studio_DirectAdmin_API::normalize_url($request->get_param('url'));
            if (is_wp_error($url)) {
                return $url;
            }
            $settings['directadmin_url'] = $url;
        }
        if ($request->get_param('username')) {
            $settings['directadmin_username'] = sanitize_text_field((string) $request->get_param('username'));
        }
        if ($plain_password) {
            $settings['directadmin_password'] = $plain_password;
        }
        $api = new Oxxa_Studio_DirectAdmin_API($settings, (bool) $plain_password);
        $snapshot = $api->account_snapshot();
        return is_wp_error($snapshot) ? $snapshot : rest_ensure_response($snapshot);
    }

    public function directadmin_sync()
    {
        $api = new Oxxa_Studio_DirectAdmin_API();
        $snapshot = $api->account_snapshot();
        if (is_wp_error($snapshot)) {
            return $snapshot;
        }
        update_network_option(null, 'oxxa_studio_directadmin_snapshot', $snapshot);
        return rest_ensure_response($snapshot);
    }

    public function test_connection(WP_REST_Request $request)
    {
        $settings = Oxxa_Studio_Oxxa_API::get_settings();
        $plain_password = (string) $request->get_param('password');
        if ($request->get_param('username')) {
            $settings['username'] = sanitize_text_field((string) $request->get_param('username'));
        }
        if ($plain_password) {
            $settings['password'] = $plain_password;
        }
        if ($request->offsetExists('testMode')) {
            $settings['test_mode'] = rest_sanitize_boolean($request->get_param('testMode'));
        }
        $api = new Oxxa_Studio_Oxxa_API($settings, (bool) $plain_password);
        $response = $api->request('domain_list', array('records' => 1));
        if (is_wp_error($response)) {
            return $response;
        }
        return rest_ensure_response(array('connected' => true, 'testMode' => $api->is_test_mode()));
    }

    public function save_settings(WP_REST_Request $request)
    {
        $settings = Oxxa_Studio_Oxxa_API::get_settings();
        $text_fields = array('username' => 'username', 'registrantIdentity' => 'registrant_identity', 'adminIdentity' => 'admin_identity', 'techIdentity' => 'tech_identity', 'billingIdentity' => 'billing_identity', 'nsgroup' => 'nsgroup');
        foreach ($text_fields as $param => $key) {
            if ($request->offsetExists($param)) {
                $settings[$key] = sanitize_text_field((string) $request->get_param($param));
            }
        }
        $directadmin_changed = false;
        if ($request->offsetExists('directAdminUrl')) {
            $url = Oxxa_Studio_DirectAdmin_API::normalize_url($request->get_param('directAdminUrl'));
            if (is_wp_error($url)) {
                return $url;
            }
            $directadmin_changed = $directadmin_changed || $url !== $settings['directadmin_url'];
            $settings['directadmin_url'] = $url;
        }
        if ($request->offsetExists('directAdminUsername')) {
            $directadmin_username = sanitize_text_field((string) $request->get_param('directAdminUsername'));
            $directadmin_changed = $directadmin_changed || $directadmin_username !== $settings['directadmin_username'];
            $settings['directadmin_username'] = $directadmin_username;
        }
        $boolean_fields = array('testMode' => 'test_mode', 'autoSsl' => 'auto_ssl', 'autoBackups' => 'auto_backups', 'emailUpdates' => 'email_updates', 'domainAlerts' => 'domain_alerts');
        foreach ($boolean_fields as $param => $key) {
            if ($request->offsetExists($param)) {
                $settings[$key] = rest_sanitize_boolean($request->get_param($param));
            }
        }
        if ($request->get_param('brandColor') && sanitize_hex_color($request->get_param('brandColor'))) {
            $settings['brand_color'] = sanitize_hex_color($request->get_param('brandColor'));
        }
        $password = (string) $request->get_param('password');
        if ($password) {
            $encrypted = Oxxa_Studio_Oxxa_API::encrypt($password);
            if (is_wp_error($encrypted)) {
                return $encrypted;
            }
            $settings['password'] = $encrypted;
        }
        $directadmin_password = (string) $request->get_param('directAdminPassword');
        if ($directadmin_password) {
            $encrypted = Oxxa_Studio_Oxxa_API::encrypt($directadmin_password);
            if (is_wp_error($encrypted)) {
                return $encrypted;
            }
            $settings['directadmin_password'] = $encrypted;
            $directadmin_changed = true;
        }
        if (!$settings['directadmin_url'] || !$settings['directadmin_username']) {
            $directadmin_changed = $directadmin_changed || !empty($settings['directadmin_password']);
            $settings['directadmin_password'] = '';
        }
        if ($directadmin_changed) {
            delete_network_option(null, 'oxxa_studio_directadmin_snapshot');
        }
        update_network_option(null, 'oxxa_studio_settings', $settings);
        $network_name = sanitize_text_field((string) $request->get_param('networkName'));
        if ($network_name) {
            update_network_option(null, 'site_name', $network_name);
        }
        return rest_ensure_response(array('saved' => true, 'testMode' => $settings['test_mode'], 'configured' => Oxxa_Studio_Oxxa_API::has_credentials($settings), 'directAdminConfigured' => Oxxa_Studio_DirectAdmin_API::has_credentials($settings)));
    }

    public function create_client(WP_REST_Request $request)
    {
        $name = sanitize_text_field((string) $request->get_param('name'));
        $email = sanitize_email((string) $request->get_param('email'));
        if (!$name || !is_email($email)) {
            return new WP_Error('invalid_client', __('A client name and valid email address are required.', 'oxxa-studio'), array('status' => 400));
        }
        $clients = get_network_option(null, 'oxxa_studio_clients', array());
        $id = time() * 1000 + wp_rand(0, 999);
        $words = preg_split('/\s+/', $name);
        $initials = strtoupper(substr($words[0], 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : ''));
        $client = array(
            'id' => $id,
            'name' => $name,
            'contact' => sanitize_text_field((string) $request->get_param('contact')),
            'email' => $email,
            'sites' => 0,
            'mrr' => (float) $request->get_param('mrr'),
            'status' => in_array($request->get_param('status'), array('Lead', 'Active', 'Paused'), true) ? $request->get_param('status') : 'Lead',
            'initials' => $initials,
            'color' => '#e2e7db',
            'since' => current_time('M Y'),
        );
        $clients[$id] = $client;
        update_network_option(null, 'oxxa_studio_clients', $clients);
        return rest_ensure_response($client);
    }

    public function create_invoice(WP_REST_Request $request)
    {
        $amount = (float) $request->get_param('amount');
        $client = sanitize_text_field((string) $request->get_param('client'));
        if ($amount < 0 || !$client) {
            return new WP_Error('invalid_amount', __('A client and a non-negative invoice amount are required.', 'oxxa-studio'), array('status' => 400));
        }
        $invoices = get_network_option(null, 'oxxa_studio_invoices', array());
        $id = 'INV-' . gmdate('Y') . '-' . str_pad((string) (count($invoices) + 149), 4, '0', STR_PAD_LEFT);
        $invoice = array(
            'id' => $id,
            'client' => $client,
            'date' => current_time('d M Y'),
            'amount' => $amount,
            'status' => in_array($request->get_param('status'), array('Paid', 'Open', 'Overdue'), true) ? $request->get_param('status') : 'Open',
            'period' => current_time('F Y'),
            'description' => sanitize_text_field((string) $request->get_param('description')),
            'issueDate' => sanitize_text_field((string) $request->get_param('issueDate')),
            'dueDate' => sanitize_text_field((string) $request->get_param('dueDate')),
        );
        $invoices[$id] = $invoice;
        update_network_option(null, 'oxxa_studio_invoices', $invoices);
        return rest_ensure_response($invoice);
    }

    public function save_design(WP_REST_Request $request)
    {
        $template = sanitize_key((string) $request->get_param('template'));
        if (!$template) {
            return new WP_Error('invalid_template', __('A template is required.', 'oxxa-studio'), array('status' => 400));
        }
        $designs = get_network_option(null, 'oxxa_studio_designs', array());
        $designs[$template] = array(
            'heading' => sanitize_textarea_field((string) $request->get_param('heading')),
            'eyebrow' => sanitize_text_field((string) $request->get_param('eyebrow')),
            'accent' => sanitize_hex_color($request->get_param('accent')) ?: '#a45c3f',
            'background' => sanitize_hex_color($request->get_param('background')) ?: '#e8e1d5',
            'font' => sanitize_text_field((string) $request->get_param('font')),
            'fontSize' => min(120, max(24, absint($request->get_param('fontSize')))),
            'radius' => min(30, max(0, absint($request->get_param('radius')))),
            'updated' => current_time('c'),
        );
        update_network_option(null, 'oxxa_studio_designs', $designs);
        return rest_ensure_response($designs[$template]);
    }
}
