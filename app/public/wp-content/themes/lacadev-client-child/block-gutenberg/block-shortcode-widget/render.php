<?php
if (!defined('ABSPATH'))
    exit;

$heading = esc_html($attributes['heading'] ?? '');
$shortcode1 = trim($attributes['shortcode1'] ?? '');
$shortcode2 = trim($attributes['shortcode2'] ?? '');

$is_valid = fn($sc) => preg_match('/^\[[\w\-]/', $sc);
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