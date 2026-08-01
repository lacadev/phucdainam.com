<?php
if (!defined('ABSPATH'))
    exit;

$heading = esc_html($attributes['heading'] ?? '');
$shortcode1 = trim($attributes['shortcode1'] ?? '');
$shortcode2 = trim($attributes['shortcode2'] ?? '');

$is_valid = fn($sc) => preg_match('/^\[[\w\-]/', $sc);

// bgColor/bgOpacity đã khai báo trong block.json nhưng thiếu bước chuyển
// hex + opacity -> rgba ở đây, khiến $bg_rgba luôn undefined.
$bg_color = preg_match('/^#[0-9a-fA-F]{6}$/', $attributes['bgColor'] ?? '')
    ? $attributes['bgColor']
    : '#0f0f0f';
$bg_opacity = max(0, min(100, intval($attributes['bgOpacity'] ?? 100)));
$r = hexdec(substr($bg_color, 1, 2));
$g = hexdec(substr($bg_color, 3, 2));
$b = hexdec(substr($bg_color, 5, 2));
$bg_rgba = 'rgba(' . $r . ',' . $g . ',' . $b . ',' . ($bg_opacity / 100) . ')';
?>
<section <?php echo get_block_wrapper_attributes(['class' => 'block-shortcode-widget']); ?> style="background:<?php echo esc_attr($bg_rgba); ?>;">
    <div class="container">
        <!-- HEADER -->
        <div class="header-section" data-aos="fade-up">
            <?php 
            if ( $heading ) :
                echo '<h2 class="heading">' . $heading . '</h2>';
            endif;
            ?>
        </div>

        <div class="block-shortcode-widget__cols">
            <?php if ($is_valid($shortcode1)): ?>
                <div class="block-shortcode-widget__col" data-aos="fade-right">
                    <?php echo do_shortcode($shortcode1); ?>
                </div>
            <?php endif; ?>

            <?php if ($is_valid($shortcode2)): ?>
                <div class="block-shortcode-widget__col" data-aos="fade-left">
                    <?php echo do_shortcode($shortcode2); ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>