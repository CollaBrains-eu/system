<?php
if (!defined('ABSPATH')) {
    exit;
}

class Oxxa_Studio_Plugin
{
    public function __construct()
    {
        add_action('network_admin_menu', array($this, 'menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue'));
        add_filter('admin_body_class', array($this, 'admin_body_class'));
        add_action('admin_bar_menu', array($this, 'admin_bar'), 80);
        add_action('template_redirect', array($this, 'maintenance_mode'), 0);
        add_action('wp_head', array($this, 'design_tokens'), 20);
        add_filter('render_block', array($this, 'render_design_content'), 10, 2);
    }

    public function menu()
    {
        add_menu_page(
            __('Oxxa Studio', 'oxxa-studio'),
            __('Oxxa Studio', 'oxxa-studio'),
            'manage_network',
            'oxxa-studio',
            array($this, 'render'),
            'dashicons-admin-multisite',
            3
        );
    }

    public function render()
    {
        if (!current_user_can('manage_network')) {
            wp_die(esc_html__('You do not have permission to manage this network.', 'oxxa-studio'));
        }
        echo '<div class="wrap oxxa-studio-wrap"><div id="root"><div class="oxxa-studio-loading"><span></span><strong>' . esc_html__('Loading Oxxa Studio…', 'oxxa-studio') . '</strong></div></div><noscript>' . esc_html__('Oxxa Studio requires JavaScript.', 'oxxa-studio') . '</noscript></div>';
    }

    public function enqueue($hook)
    {
        if ($hook !== 'toplevel_page_oxxa-studio') {
            return;
        }
        $manifest_path = OXXA_STUDIO_DIR . 'assets/.vite/manifest.json';
        if (!file_exists($manifest_path)) {
            add_action('network_admin_notices', function () {
                echo '<div class="notice notice-error"><p>' . esc_html__('Oxxa Studio assets are missing. Run npm run build:plugin or install the packaged plugin ZIP.', 'oxxa-studio') . '</p></div>';
            });
            return;
        }
        $manifest = json_decode((string) file_get_contents($manifest_path), true);
        $entry = isset($manifest['index.html']) ? $manifest['index.html'] : null;
        if (!$entry) {
            return;
        }
        wp_enqueue_style('oxxa-studio-admin-base', OXXA_STUDIO_URL . 'admin.css', array(), OXXA_STUDIO_VERSION);
        if (!empty($entry['css'])) {
            foreach ($entry['css'] as $index => $file) {
                // Vite emits assets/studio.css; the package root is assets/.
                $relative = preg_replace('#^assets/#', '', $file);
                wp_enqueue_style('oxxa-studio-' . $index, OXXA_STUDIO_URL . 'assets/' . $relative, array('oxxa-studio-admin-base'), OXXA_STUDIO_VERSION);
            }
        }
        $script_file = preg_replace('#^assets/#', '', $entry['file']);
        wp_enqueue_script('oxxa-studio', OXXA_STUDIO_URL . 'assets/' . $script_file, array(), OXXA_STUDIO_VERSION, true);
        wp_script_add_data('oxxa-studio', 'type', 'module');
        add_filter('script_loader_tag', array($this, 'module_script'), 10, 3);

        $settings = Oxxa_Studio_Oxxa_API::get_settings();
        $user = wp_get_current_user();
        wp_localize_script('oxxa-studio', 'oxxaStudio', array(
            'restUrl' => esc_url_raw(rest_url(Oxxa_Studio_REST::NS)),
            'nonce' => wp_create_nonce('wp_rest'),
            'networkName' => get_network_option(null, 'site_name', get_bloginfo('name')),
            'networkDomain' => get_current_site()->domain,
            'multisiteType' => is_subdomain_install() ? 'Subdomain' : 'Subdirectory',
            'serverIp' => defined('OXXA_STUDIO_PUBLIC_IP') ? OXXA_STUDIO_PUBLIC_IP : '',
            'userName' => $user->display_name,
            'adminUrl' => network_admin_url(),
            'demo' => !Oxxa_Studio_Oxxa_API::has_credentials($settings),
            'testMode' => !empty($settings['test_mode']),
            'settings' => array(
                'username' => $settings['username'],
                'registrantIdentity' => $settings['registrant_identity'],
                'adminIdentity' => $settings['admin_identity'],
                'nsgroup' => $settings['nsgroup'],
            ),
        ));
    }

    public function module_script($tag, $handle, $src)
    {
        if ($handle !== 'oxxa-studio') {
            return $tag;
        }
        return '<script type="module" src="' . esc_url($src) . '" id="oxxa-studio-js"></script>';
    }

    public function admin_body_class($classes)
    {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if ($screen && $screen->id === 'toplevel_page_oxxa-studio') {
            $classes .= ' oxxa-studio-screen';
        }
        return $classes;
    }

    public function admin_bar($bar)
    {
        if (!current_user_can('manage_network')) {
            return;
        }
        $bar->add_node(array(
            'id' => 'oxxa-studio',
            'parent' => 'network-admin',
            'title' => __('Oxxa Studio', 'oxxa-studio'),
            'href' => network_admin_url('admin.php?page=oxxa-studio'),
        ));
    }

    public function maintenance_mode()
    {
        if (!is_multisite() || is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
            return;
        }
        if (get_option('oxxa_studio_status') !== 'Maintenance' || current_user_can('manage_options')) {
            return;
        }
        status_header(503);
        header('Retry-After: 3600');
        wp_die(
            '<div style="font-family:system-ui,sans-serif;max-width:520px;margin:15vh auto;padding:40px;text-align:center;color:#283124"><div style="font-size:42px;margin-bottom:20px">✦</div><h1 style="font-size:32px;font-weight:500">' . esc_html__('We’ll be right back.', 'oxxa-studio') . '</h1><p style="color:#737c6d;line-height:1.7">' . esc_html__('This website is receiving a little care from our studio. Please check back shortly.', 'oxxa-studio') . '</p></div>',
            esc_html__('Maintenance mode', 'oxxa-studio'),
            array('response' => 503)
        );
    }

    private function current_design()
    {
        $template = sanitize_key(get_option('oxxa_studio_template', 'editorial'));
        $designs = get_network_option(null, 'oxxa_studio_designs', array());
        return isset($designs[$template]) && is_array($designs[$template]) ? $designs[$template] : array();
    }

    public function design_tokens()
    {
        if (get_option('stylesheet') !== 'oxxa-studio-theme') {
            return;
        }
        $design = $this->current_design();
        $accent = isset($design['accent']) ? sanitize_hex_color($design['accent']) : '#a45c3f';
        $background = isset($design['background']) ? sanitize_hex_color($design['background']) : '#e8e1d5';
        $font = isset($design['font']) ? sanitize_text_field($design['font']) : 'Manrope';
        $allowed_fonts = array('Manrope', 'Georgia', 'Arial', 'Courier New');
        if (!in_array($font, $allowed_fonts, true)) {
            $font = 'Manrope';
        }
        $size = isset($design['fontSize']) ? absint($design['fontSize']) : 64;
        $radius = isset($design['radius']) ? absint($design['radius']) : 2;
        echo '<style id="oxxa-studio-tokens">:root{--studio-accent:' . esc_attr($accent) . ';--studio-background:' . esc_attr($background) . ';--studio-font:' . esc_attr($font) . ';--studio-heading-size:' . esc_attr($size) . 'px;--studio-radius:' . esc_attr($radius) . 'px}</style>';
    }

    public function render_design_content($content, $block)
    {
        if (get_option('stylesheet') !== 'oxxa-studio-theme' || strpos($content, '{{studio_') === false) {
            return $content;
        }
        $design = $this->current_design();
        $heading = isset($design['heading']) && $design['heading'] ? $design['heading'] : "Thoughtful work,\nmade to last.";
        $eyebrow = isset($design['eyebrow']) && $design['eyebrow'] ? $design['eyebrow'] : 'INDEPENDENT & CONSIDERED';
        $replacements = array(
            '{{studio_heading}}' => nl2br(esc_html($heading)),
            '{{studio_eyebrow}}' => esc_html($eyebrow),
        );
        return str_replace(array_keys($replacements), array_values($replacements), $content);
    }
}
