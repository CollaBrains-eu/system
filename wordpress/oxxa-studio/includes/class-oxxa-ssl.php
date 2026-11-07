<?php
/**
 * Read-only Oxxa SSL inventory: certificates, products, and install servers.
 * No SSL orders, credential-bearing server commands, or renewal changes are made.
 */
if (!defined('ABSPATH')) {
    exit;
}

class Oxxa_Studio_SSL
{
    private $api;

    public function __construct()
    {
        $this->api = new Oxxa_Studio_Oxxa_API();
    }

    private static function boolean($value)
    {
        return strtoupper(trim((string) $value)) === 'Y';
    }

    private static function date($value)
    {
        $value = trim((string) $value);
        if (!$value) {
            return '';
        }
        $timestamp = strtotime($value);
        return $timestamp ? gmdate('Y-m-d', $timestamp) : $value;
    }

    private function certificates($xml)
    {
        $certificates = array();
        if (!isset($xml->details->ssl)) {
            return $certificates;
        }
        foreach ($xml->details->ssl as $record) {
            $id = trim((string) $record->sslid);
            if ($id === '') {
                continue;
            }
            $certificates[] = array(
                'id' => sanitize_text_field($id),
                'productId' => sanitize_text_field((string) $record->product),
                'name' => sanitize_text_field((string) $record->ssl),
                'period' => absint($record->period),
                'domain' => strtolower(sanitize_text_field((string) $record->domain)),
                'sans' => sanitize_text_field((string) $record->sans),
                'autoRenew' => self::boolean($record->autorenew),
                'startDate' => self::date($record->start_date),
                'endDate' => self::date($record->end_date),
                'status' => sanitize_text_field((string) $record->status) ?: 'Unknown',
            );
        }
        return $certificates;
    }

    private function products($xml)
    {
        $products = array();
        if (!isset($xml->details->ssl)) {
            return $products;
        }
        foreach ($xml->details->ssl as $entry) {
            // Product responses wrap each actual product in an additional ssl element.
            $record = !isset($entry->id) && isset($entry->ssl) ? $entry->ssl : $entry;
            $id = trim((string) $record->id);
            if ($id === '') {
                continue;
            }
            $periods = array();
            if (isset($record->pricing->period)) {
                foreach ($record->pricing->period as $period) {
                    $months = absint($period['months']);
                    $price = str_replace(',', '.', trim((string) $period->price));
                    if ($months && is_numeric($price)) {
                        $periods[] = array('months' => $months, 'price' => (float) $price);
                    }
                }
            }
            $products[] = array(
                'id' => sanitize_text_field($id),
                'name' => sanitize_text_field((string) $record->name),
                'validation' => strtoupper(sanitize_text_field((string) $record->config->type)),
                'wildcard' => self::boolean($record->config->wildcard),
                'cnameAuth' => self::boolean($record->config->cname_auth),
                'vendor' => sanitize_text_field((string) $record->config->vendor),
                'deliveryTime' => sanitize_text_field((string) $record->config->delivery_time),
                'periods' => $periods,
            );
        }
        return $products;
    }

    private function servers($xml)
    {
        $servers = array();
        if (!isset($xml->details->server)) {
            return $servers;
        }
        foreach ($xml->details->server as $record) {
            $id = trim((string) $record->id);
            if ($id === '') {
                continue;
            }
            $servers[] = array(
                'id' => sanitize_text_field($id),
                'type' => strtoupper(sanitize_text_field((string) $record->type)) === 'S' ? 'SatServer' : 'DirectAdmin',
                'name' => sanitize_text_field((string) $record->name),
                'host' => sanitize_text_field((string) $record->host),
                'createdAt' => self::date($record->created_at),
            );
        }
        return $servers;
    }

    public function sync()
    {
        $certificates = $this->api->request('ssl_list');
        if (is_wp_error($certificates)) {
            return $certificates;
        }
        $products = $this->api->request('ssl_product_list');
        if (is_wp_error($products)) {
            return $products;
        }
        $servers = $this->api->request('server_list');
        if (is_wp_error($servers)) {
            return $servers;
        }
        return array(
            'configured' => true,
            'connected' => true,
            'certificates' => $this->certificates($certificates),
            'products' => $this->products($products),
            'servers' => $this->servers($servers),
            'lastSync' => current_time('c'),
            'testMode' => $this->api->is_test_mode(),
        );
    }
}
