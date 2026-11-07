<?php
/**
 * Read-only DirectAdmin legacy JSON API adapter.
 * Uses a scoped Login Key over HTTPS; secrets remain server-side and encrypted.
 */
if (!defined('ABSPATH')) {
    exit;
}

class Oxxa_Studio_DirectAdmin_API
{
    private $settings;

    public function __construct($settings = null, $password_is_plain = false)
    {
        $this->settings = is_array($settings) ? $settings : Oxxa_Studio_Oxxa_API::get_settings();
        if (!empty($this->settings['directadmin_password']) && !$password_is_plain) {
            $this->settings['directadmin_password'] = Oxxa_Studio_Oxxa_API::decrypt($this->settings['directadmin_password']);
        }
    }

    public static function has_credentials($settings = null)
    {
        $settings = is_array($settings) ? $settings : Oxxa_Studio_Oxxa_API::get_settings();
        return !empty($settings['directadmin_url']) && !empty($settings['directadmin_username']) && !empty($settings['directadmin_password']);
    }

    public static function normalize_url($url)
    {
        $url = trim((string) $url);
        if ($url === '') {
            return '';
        }
        if (strpos($url, '://') === false) {
            $url = 'https://' . $url;
        }
        $parts = wp_parse_url($url);
        $host = isset($parts['host']) ? strtolower(rtrim($parts['host'], '.')) : '';
        $valid_host = $host && (filter_var($host, FILTER_VALIDATE_IP) || filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME));
        $valid_scheme = isset($parts['scheme']) && strtolower($parts['scheme']) === 'https';
        $valid_path = empty($parts['path']) || $parts['path'] === '/';
        $port = isset($parts['port']) ? absint($parts['port']) : 2222;
        if (!$valid_scheme || !$valid_host || !$valid_path || $port < 1 || $port > 65535 || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) {
            return new WP_Error('directadmin_url', __('Enter a DirectAdmin base URL such as https://hosting.example.com:2222 without a path or credentials.', 'oxxa-studio'), array('status' => 400));
        }
        return 'https://' . $host . ':' . $port;
    }

    private function request($command)
    {
        if (!self::has_credentials($this->settings)) {
            return new WP_Error('directadmin_credentials', __('Add your DirectAdmin URL, username and Login Key in Network settings first.', 'oxxa-studio'), array('status' => 400));
        }
        $password = (string) $this->settings['directadmin_password'];
        if ($password === '') {
            return new WP_Error('directadmin_credentials', __('The saved DirectAdmin Login Key could not be decrypted. Save it again in Network settings.', 'oxxa-studio'), array('status' => 400));
        }
        $url = self::normalize_url($this->settings['directadmin_url']);
        if (is_wp_error($url)) {
            return $url;
        }
        $command = preg_replace('/[^A-Z0-9_]/', '', strtoupper($command));
        $endpoint = $url . '/' . $command . '?json=yes';
        $response = wp_remote_get($endpoint, array(
            'timeout' => 20,
            'redirection' => 0,
            'sslverify' => true,
            'headers' => array(
                'Accept' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($this->settings['directadmin_username'] . ':' . $password),
            ),
        ));
        if (is_wp_error($response)) {
            return new WP_Error('directadmin_transport', sprintf(__('Could not reach DirectAdmin: %s', 'oxxa-studio'), $response->get_error_message()), array('status' => 502));
        }
        $status = wp_remote_retrieve_response_code($response);
        if ($status === 401 || $status === 403) {
            return new WP_Error('directadmin_auth', __('DirectAdmin rejected the Login Key or its IP/command permissions.', 'oxxa-studio'), array('status' => 401));
        }
        if ($status < 200 || $status >= 300) {
            return new WP_Error('directadmin_http', sprintf(__('DirectAdmin returned an unexpected HTTP response (%d).', 'oxxa-studio'), $status), array('status' => 502));
        }
        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($data)) {
            return new WP_Error('directadmin_response', __('DirectAdmin returned HTML or unreadable data. Check the API endpoint and Login Key.', 'oxxa-studio'), array('status' => 502));
        }
        if (isset($data['error']) && (string) $data['error'] !== '0') {
            $message = !empty($data['text']) ? $data['text'] : __('The DirectAdmin command was rejected.', 'oxxa-studio');
            return new WP_Error('directadmin_command', sanitize_text_field($message), array('status' => 400));
        }
        return $data;
    }

    private static function amount($data, $key)
    {
        if (!isset($data[$key]) || !is_numeric($data[$key])) {
            return null;
        }
        return round((float) $data[$key], 2);
    }

    private static function unlimited($data, $key)
    {
        return isset($data[$key]) && strtolower((string) $data[$key]) === 'unlimited';
    }

    public function account_snapshot()
    {
        $config = $this->request('CMD_API_SHOW_USER_CONFIG');
        if (is_wp_error($config)) {
            return $config;
        }
        $usage = $this->request('CMD_API_SHOW_USER_USAGE');
        if (is_wp_error($usage)) {
            return $usage;
        }
        return array(
            'configured' => true,
            'connected' => true,
            'url' => self::normalize_url($this->settings['directadmin_url']),
            'username' => sanitize_text_field($this->settings['directadmin_username']),
            'account' => array(
                'package' => isset($config['package']) ? sanitize_text_field($config['package']) : 'custom',
                'domain' => isset($config['domain']) ? sanitize_text_field($config['domain']) : '',
                'type' => isset($config['usertype']) ? sanitize_key($config['usertype']) : 'user',
                'suspended' => !empty($config['suspended']) && strtolower((string) $config['suspended']) === 'yes',
            ),
            'usage' => array(
                // These legacy endpoints report megabytes. User-level usage is not a reseller-wide total.
                'diskUsedMb' => self::amount($usage, 'quota'),
                'diskLimitMb' => self::amount($config, 'quota'),
                'diskUnlimited' => self::unlimited($config, 'quota'),
                'bandwidthUsedMb' => self::amount($usage, 'bandwidth'),
                'bandwidthLimitMb' => self::amount($config, 'bandwidth'),
                'bandwidthUnlimited' => self::unlimited($config, 'bandwidth'),
                'domainsUsed' => (int) (isset($usage['vdomains']) ? $usage['vdomains'] : 0),
                'domainsLimit' => self::amount($config, 'vdomains'),
                'domainsUnlimited' => self::unlimited($config, 'vdomains'),
                'emailAccounts' => (int) (isset($usage['nemails']) ? $usage['nemails'] : 0),
                'databases' => (int) (isset($usage['mysql']) ? $usage['mysql'] : 0),
                'ftpAccounts' => (int) (isset($usage['ftp']) ? $usage['ftp'] : 0),
            ),
            'lastSync' => current_time('c'),
        );
    }
}
