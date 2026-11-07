<?php
/**
 * Small, server-side Oxxa XML API adapter.
 * Credentials never appear in browser responses or REST payloads.
 */
if (!defined('ABSPATH')) {
    exit;
}

class Oxxa_Studio_Oxxa_API
{
    const ENDPOINT = 'https://api.oxxa.com/command.php';

    private $settings;

    public function __construct($settings = null, $password_is_plain = false)
    {
        $this->settings = is_array($settings) ? $settings : self::get_settings();
        if (!empty($this->settings['password']) && !$password_is_plain) {
            $this->settings['password'] = self::decrypt($this->settings['password']);
        }
    }

    public static function get_settings()
    {
        $defaults = array(
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
        );
        $saved = get_network_option(null, 'oxxa_studio_settings', array());
        return wp_parse_args(is_array($saved) ? $saved : array(), $defaults);
    }

    public static function has_credentials($settings = null)
    {
        $settings = is_array($settings) ? $settings : self::get_settings();
        return !empty($settings['username']) && !empty($settings['password']);
    }

    /**
     * AES-256-GCM encryption using WordPress installation salts.
     * OpenSSL is part of normal WordPress hosting; fail closed if unavailable.
     */
    public static function encrypt($value)
    {
        if ($value === '') {
            return '';
        }
        if (!function_exists('openssl_encrypt')) {
            return new WP_Error('oxxa_openssl', __('OpenSSL is required to store Oxxa credentials securely.', 'oxxa-studio'));
        }
        $iv = random_bytes(12);
        $tag = '';
        $cipher = openssl_encrypt($value, 'aes-256-gcm', self::encryption_key(), OPENSSL_RAW_DATA, $iv, $tag);
        if ($cipher === false) {
            return new WP_Error('oxxa_encryption', __('The API password could not be encrypted.', 'oxxa-studio'));
        }
        return 'enc:v1:' . base64_encode(wp_json_encode(array('iv' => base64_encode($iv), 'tag' => base64_encode($tag), 'data' => base64_encode($cipher))));
    }

    public static function decrypt($payload)
    {
        if (strpos($payload, 'enc:v1:') !== 0 || !function_exists('openssl_decrypt')) {
            return '';
        }
        $decoded = base64_decode(substr($payload, 7), true);
        $parts = $decoded ? json_decode($decoded, true) : null;
        if (!is_array($parts) || empty($parts['iv']) || empty($parts['tag']) || !isset($parts['data'])) {
            return '';
        }
        $value = openssl_decrypt(base64_decode($parts['data']), 'aes-256-gcm', self::encryption_key(), OPENSSL_RAW_DATA, base64_decode($parts['iv']), base64_decode($parts['tag']));
        return is_string($value) ? $value : '';
    }

    private static function encryption_key()
    {
        return hash('sha256', wp_salt('auth') . wp_salt('secure_auth'), true);
    }

    public function is_test_mode()
    {
        return !empty($this->settings['test_mode']);
    }

    /**
     * Execute an Oxxa command and return SimpleXML, or WP_Error.
     */
    public function request($command, $arguments = array())
    {
        if (!self::has_credentials($this->settings)) {
            return new WP_Error('oxxa_credentials', __('Add your Oxxa API username and password in Network settings first.', 'oxxa-studio'), array('status' => 400));
        }
        if (!function_exists('simplexml_load_string')) {
            return new WP_Error('oxxa_simplexml', __('The PHP SimpleXML extension is required by the Oxxa API.', 'oxxa-studio'), array('status' => 500));
        }

        $password = (string) $this->settings['password'];
        if ($password === '') {
            return new WP_Error('oxxa_credentials', __('The saved Oxxa password could not be decrypted. Save it again in Network settings.', 'oxxa-studio'), array('status' => 400));
        }

        $query = array_merge($arguments, array(
            'apiuser' => $this->settings['username'],
            // Oxxa's documented digest form avoids transmitting the raw password.
            'apipassword' => 'MD5' . md5($password),
            'command' => sanitize_key($command),
        ));
        if ($this->is_test_mode()) {
            $query['test'] = 'Y';
        }

        $response = wp_remote_get(add_query_arg($query, self::ENDPOINT), array(
            'timeout' => 25,
            'redirection' => 2,
            'sslverify' => true,
            'headers' => array('Accept' => 'application/xml, text/xml'),
        ));
        if (is_wp_error($response)) {
            return new WP_Error('oxxa_transport', sprintf(__('Could not reach Oxxa: %s', 'oxxa-studio'), $response->get_error_message()), array('status' => 502));
        }

        $status = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        if ($status < 200 || $status >= 300 || !$body) {
            return new WP_Error('oxxa_http', sprintf(__('Oxxa returned an unexpected HTTP response (%d).', 'oxxa-studio'), $status), array('status' => 502));
        }

        $previous = libxml_use_internal_errors(true);
        $xml = simplexml_load_string($body, 'SimpleXMLElement', LIBXML_NONET);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        if (!$xml) {
            return new WP_Error('oxxa_xml', __('Oxxa returned an unreadable XML response.', 'oxxa-studio'), array('status' => 502));
        }

        $code = isset($xml->status_code) ? strtoupper(trim((string) $xml->status_code)) : '';
        $description = isset($xml->status_description) ? (string) $xml->status_description : __('The Oxxa command was rejected.', 'oxxa-studio');
        if (strpos($code, 'XMLERR') === 0 || strpos($code, 'ERR') === 0) {
            return new WP_Error('oxxa_command', sanitize_text_field($description), array('status' => 400, 'oxxa_code' => $code));
        }
        return $xml;
    }

    public static function split_domain($domain)
    {
        $domain = strtolower(trim((string) $domain));
        $domain = preg_replace('#^https?://#', '', $domain);
        $domain = preg_replace('#/.*$#', '', $domain);
        $domain = preg_replace('/^www\./', '', $domain);
        if (function_exists('idn_to_ascii')) {
            $converted = idn_to_ascii($domain);
            if ($converted) {
                $domain = $converted;
            }
        }
        if (!preg_match('/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/', $domain)) {
            return new WP_Error('invalid_domain', __('Enter a valid domain such as example.com.', 'oxxa-studio'), array('status' => 400));
        }
        $parts = explode('.', $domain, 2);
        return array('domain' => $domain, 'sld' => $parts[0], 'tld' => $parts[1]);
    }

    public function check_domain($domain)
    {
        $parts = self::split_domain($domain);
        if (is_wp_error($parts)) {
            return $parts;
        }
        $xml = $this->request('domain_check', array('sld' => $parts['sld'], 'tld' => $parts['tld']));
        if (is_wp_error($xml)) {
            return $xml;
        }
        $code = isset($xml->status_code) ? trim((string) $xml->status_code) : '';
        $available = (bool) preg_match('/\s11$/', $code);
        $taken = (bool) preg_match('/\s10$/', $code);
        if (!$available && !$taken) {
            return new WP_Error('oxxa_availability', __('Oxxa returned an unknown availability status.', 'oxxa-studio'), array('status' => 502));
        }
        $price = 0.0;
        if (isset($xml->details->price)) {
            $price = (float) str_replace(',', '.', (string) $xml->details->price);
        } elseif (isset($xml->details->normal)) {
            $price = (float) str_replace(',', '.', (string) $xml->details->normal);
        }
        return array(
            'domain' => $parts['domain'],
            'available' => $available,
            'price' => $price,
            'currency' => isset($xml->details->currency2) ? (string) $xml->details->currency2 : 'EUR',
            'message' => isset($xml->status_description) ? (string) $xml->status_description : ($available ? __('Available to register through Oxxa.', 'oxxa-studio') : __('This domain is already registered.', 'oxxa-studio')),
        );
    }

    public function register_domain($domain, $years = 1)
    {
        $parts = self::split_domain($domain);
        if (is_wp_error($parts)) {
            return $parts;
        }
        $registrant = trim((string) $this->settings['registrant_identity']);
        $nsgroup = trim((string) $this->settings['nsgroup']);
        if (!$registrant || !$nsgroup) {
            return new WP_Error('oxxa_registration_defaults', __('Set a registrant identity and nameserver group in Oxxa Network settings before registering a domain.', 'oxxa-studio'), array('status' => 400));
        }
        $xml = $this->request('register', array(
            'sld' => $parts['sld'],
            'tld' => $parts['tld'],
            'identity-registrant' => $registrant,
            'identity-admin' => $this->settings['admin_identity'] ?: $registrant,
            'identity-tech' => $this->settings['tech_identity'] ?: $registrant,
            'identity-billing' => $this->settings['billing_identity'] ?: $registrant,
            'nsgroup' => $nsgroup,
            'period' => min(10, max(1, absint($years))),
            'autorenew' => 'Y',
            'lock' => 'Y',
        ));
        if (is_wp_error($xml)) {
            return $xml;
        }
        return array(
            'domain' => $parts['domain'],
            'test_mode' => $this->is_test_mode(),
            'status' => isset($xml->status_description) ? (string) $xml->status_description : __('Registration submitted.', 'oxxa-studio'),
            'order_id' => isset($xml->order_id) ? (string) $xml->order_id : '',
        );
    }
}
