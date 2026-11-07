<?php
if (!defined('ABSPATH')) {
    exit;
}

function oxxa_studio_theme_setup()
{
    add_theme_support('wp-block-styles');
    add_theme_support('responsive-embeds');
    add_theme_support('editor-styles');
    add_editor_style('style.css');
    register_nav_menus(array('primary' => __('Primary navigation', 'oxxa-studio')));
}
add_action('after_setup_theme', 'oxxa_studio_theme_setup');

function oxxa_studio_theme_assets()
{
    wp_enqueue_style('oxxa-studio-theme', get_stylesheet_uri(), array(), wp_get_theme()->get('Version'));
    $font = get_template_directory() . '/assets/manrope-latin.woff2';
    if (file_exists($font)) {
        $inline = "@font-face{font-family:Manrope;src:url('" . esc_url(get_template_directory_uri() . '/assets/manrope-latin.woff2') . "') format('woff2');font-style:normal;font-weight:200 800;font-display:swap;}";
        wp_add_inline_style('oxxa-studio-theme', $inline);
    }
}
add_action('wp_enqueue_scripts', 'oxxa_studio_theme_assets');
