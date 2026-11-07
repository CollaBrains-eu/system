<?php
/**
 * DirectAdmin legacy JSON API adapter for account usage and mailbox management.
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

    private function request($command, $arguments = array(), $method = 'GET')
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
        $method = strtoupper($method) === 'POST' ? 'POST' : 'GET';
        $endpoint = $url . '/' . $command . '?json=yes';
        $request = array(
            'method' => $method,
            'timeout' => 20,
            'redirection' => 0,
            'sslverify' => true,
            'headers' => array(
                'Accept' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($this->settings['directadmin_username'] . ':' . $password),
            ),
        );
        if ($method === 'POST') {
            // Passwords stay in the POST body, never in URLs or network options.
            $request['body'] = $arguments;
        } else {
            $endpoint = add_query_arg($arguments, $endpoint);
        }
        $response = wp_remote_request($endpoint, $request);
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
            $message = !empty($data['text']) ? $data['text'] : (!empty($data['result']) && is_scalar($data['result']) ? $data['result'] : __('The DirectAdmin command was rejected.', 'oxxa-studio'));
            $message = sanitize_text_field($message);
            foreach (array('passwd', 'passwd2') as $secret_key) {
                if (!empty($arguments[$secret_key])) {
                    $message = str_replace((string) $arguments[$secret_key], '[redacted]', $message);
                }
            }
            return new WP_Error('directadmin_command', $message, array('status' => 400));
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

    private function validate_account_domain($domain)
    {
        $parts = Oxxa_Studio_Oxxa_API::split_domain($domain);
        if (is_wp_error($parts)) {
            return $parts;
        }
        $config = $this->request('CMD_API_SHOW_USER_CONFIG');
        if (is_wp_error($config)) {
            return $config;
        }
        $account_domain = strtolower(trim((string) (isset($config['domain']) ? $config['domain'] : '')));
        if (!$account_domain || !hash_equals($account_domain, $parts['domain'])) {
            return new WP_Error('directadmin_domain', __('Mailbox management is limited to the primary domain of the authenticated DirectAdmin account.', 'oxxa-studio'), array('status' => 403));
        }
        return $account_domain;
    }

    public function mailboxes($domain)
    {
        $domain = $this->validate_account_domain($domain);
        if (is_wp_error($domain)) {
            return $domain;
        }
        $data = $this->request('CMD_API_POP', array('action' => 'full_list', 'domain' => $domain));
        if (is_wp_error($data)) {
            return $data;
        }
        $records = isset($data['list']) && is_array($data['list']) ? $data['list'] : (isset($data['result']) && is_array($data['result']) ? $data['result'] : $data);
        $mailboxes = array();
        foreach ($records as $name => $details) {
            if (in_array($name, array('error', 'text', 'details', 'success', 'result'), true)) {
                continue;
            }
            if (is_int($name) && is_string($details)) {
                $name = $details;
                $details = array();
            }
            if (!is_string($name)) {
                continue;
            }
            $name = strtolower(trim($name));
            if (strpos($name, '@') !== false) {
                list($name, $name_domain) = array_pad(explode('@', $name, 2), 2, '');
                if ($name_domain !== $domain) {
                    continue;
                }
            }
            if (!preg_match('/^[a-z0-9][a-z0-9._-]{0,62}$/i', $name)) {
                continue;
            }
            $details = is_array($details) ? $details : array();
            $mailboxes[] = array(
                'username' => $name,
                'email' => $name . '@' . $domain,
                'quotaMb' => self::amount($details, 'quota'),
                'usageMb' => self::amount($details, 'usage'),
                'sent' => self::amount($details, 'sent'),
                'dailyLimit' => self::amount($details, 'limit'),
                'suspended' => isset($details['suspended']) && strtolower((string) $details['suspended']) === 'yes',
            );
        }
        usort($mailboxes, function ($a, $b) {
            return strcmp($a['email'], $b['email']);
        });
        return array('domain' => $domain, 'mailboxes' => $mailboxes);
    }

    public function create_mailbox($domain, $user, $password, $confirmation, $quota, $daily_limit)
    {
        $domain = $this->validate_account_domain($domain);
        if (is_wp_error($domain)) {
            return $domain;
        }
        $user = strtolower(trim((string) $user));
        if (!preg_match('/^[a-z0-9][a-z0-9._-]{0,62}$/', $user) || substr($user, -1) === '.' || strpos($user, '..') !== false) {
            return new WP_Error('directadmin_mailbox_user', __('Enter a valid mailbox name using letters, numbers, dots, underscores or hyphens.', 'oxxa-studio'), array('status' => 400));
        }
        $password = (string) $password;
        $confirmation = (string) $confirmation;
        if (strlen($password) < 12 || strlen($password) > 128 || preg_match('/[\x00-\x1F\x7F]/', $password)) {
            return new WP_Error('directadmin_mailbox_password', __('Use a mailbox password between 12 and 128 characters without control characters.', 'oxxa-studio'), array('status' => 400));
        }
        if (!hash_equals($password, $confirmation)) {
            return new WP_Error('directadmin_mailbox_confirmation', __('The mailbox password confirmation does not match.', 'oxxa-studio'), array('status' => 400));
        }
        if (!is_numeric($quota) || (int) $quota != $quota || (int) $quota < 1 || (int) $quota > 1048576 || !is_numeric($daily_limit) || (int) $daily_limit != $daily_limit || (int) $daily_limit < 0 || (int) $daily_limit > 100000) {
            return new WP_Error('directadmin_mailbox_limits', __('Enter a quota from 1 MB to 1 TB and a daily send limit from 0 to 100000.', 'oxxa-studio'), array('status' => 400));
        }
        $quota = (int) $quota;
        $daily_limit = (int) $daily_limit;
        $response = $this->request('CMD_API_POP', array(
            'action' => 'create',
            'domain' => $domain,
            'user' => $user,
            'passwd' => $password,
            'passwd2' => $confirmation,
            'quota' => $quota,
            'limit' => $daily_limit,
        ), 'POST');
        if (is_wp_error($response)) {
            return $response;
        }
        return array(
            'created' => true,
            'mailbox' => array(
                'username' => $user,
                'email' => $user . '@' . $domain,
                'quotaMb' => $quota,
                'usageMb' => 0,
                'sent' => 0,
                'dailyLimit' => $daily_limit,
                'suspended' => false,
            ),
        );
    }
}
