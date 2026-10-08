<?php
if ( ! defined( 'ABSPATH' ) ) exit;



// ── Appearance attributes ──────────────────────────────────────────────────
$bg_color     = preg_match( '/^#[0-9a-fA-F]{6}$/', $attributes['bgColor'] ?? '' ) ? $attributes['bgColor'] : '#0f0f0f';
$bg_opacity   = max( 0, min( 100, intval( $attributes['bgOpacity'] ?? 100 ) ) );
$r = hexdec( substr( $bg_color, 1, 2 ) );
$g = hexdec( substr( $bg_color, 3, 2 ) );
$b = hexdec( substr( $bg_color, 5, 2 ) );
$bg_rgba = 'rgba(' . $r . ',' . $g . ',' . $b . ',' . ( $bg_opacity / 100 ) . ')';
/**
 * Services Grid Block — render.php
 * Section DỊCH VỤ — layout bất đối xứng 3 nhóm.
 *
 * @package lacadev-client-child
 */

$heading = esc_html( $attributes['sectionTitle'] ?? '' );

$service_groups = $attributes['serviceGroups']   ?? [];

/**
 * Helper: render một ảnh dạng <img> có link bọc ngoài (tùy chọn).
 * Dùng function_exists để tránh redeclare khi block xuất hiện nhiều lần trên trang.
 */
if ( ! function_exists( 'lcdc_services_render_img' ) ) {
    function lcdc_services_render_img( string $url, string $alt, string $link = '' ): void {
        if ( empty( $url ) ) return;
        $img = '<img class="block-services-grid__img" src="' . esc_url( $url ) . '" alt="' . esc_attr( $alt ) . '" loading="lazy">';
        if ( $link ) {
            echo '<a href="' . esc_url( $link ) . '">' . $img . '</a>';
        } else {
            echo $img;
        }
    }
}

$wrapper_attrs = get_block_wrapper_attributes( [
    'class' => 'block-services-grid',
    'style' => 'background-color:' . esc_attr( $bg_color ) . ';',
] );
?>

<section <?php echo $wrapper_attrs; ?>>
    <div class="container">
        <!-- HEADER -->
        <div class="header-section" data-aos="fade-up">
            <?php 
            if ( $heading ) :
                echo '<h2 class="heading">' . $heading . '</h2>';
            endif;
            ?>
        </div>

        <?php foreach ( $service_groups as $group ) :
            $layout = sanitize_key( $group['layout'] ?? 'left-main-right-grid' );
            $title  = esc_html( $group['title'] ?? '' );
            $link   = esc_url( $group['link']   ?? '' );
        ?>

        <div class="block-services-grid__group block-services-grid__group--<?php echo $layout; ?>">
            <?php if ( $layout === 'top-title-3cols' ) : ?>
                <?php if ( $title ) : ?>
                    <p class="block-services-grid__group-title text-end"><?php echo $title; ?></p>
                <?php endif; ?>

                <div class="block-services-grid__cols">
                    <?php foreach ( $group['items'] ?? [] as $item ) : ?>
                        <div class="block-services-grid__col-item">
                            <?php lcdc_services_render_img( $item['imageUrl'] ?? '', $item['label'] ?? '', $item['link'] ?? '' ); ?>
                            <?php if ( ! empty( $item['label'] ) ) : ?>
                                <span class="block-services-grid__label"><?php echo esc_html( $item['label'] ); ?></span>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>

            <?php else : ?>

                <div class="block-services-grid__main-layout">
                    <?php
                    $main_url = $group['mainImageUrl'] ?? '';
                    $sub_imgs = $group['subImages']    ?? [];

                    if ( $layout === 'right-main-left-grid' ) :
                    ?>
                        <div class="block-services-grid__side-content">
                            <?php if ( $title ) : ?>
                                <p class="block-services-grid__group-title"><?php echo $title; ?></p>
                            <?php endif; ?>
                            <div class="block-services-grid__sub-imgs">
                                <?php foreach ( $sub_imgs as $sub ) : ?>
                                    <div class="block-services-grid__sub-img">
                                        <?php lcdc_services_render_img( $sub['imageUrl'] ?? '', $title, '' ); ?>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        <div class="block-services-grid__main-img">
                            <?php lcdc_services_render_img( $main_url, $title, $link ); ?>
                        </div>

                    <?php else : ?>
                        <?php // left-main-right-grid ?>
                        <div class="block-services-grid__main-img">
                            <?php lcdc_services_render_img( $main_url, $title, $link ); ?>
                        </div>
                        <div class="block-services-grid__side-content">
                            <?php if ( $title ) : ?>
                                <p class="block-services-grid__group-title"><?php echo $title; ?></p>
                            <?php endif; ?>
                            <div class="block-services-grid__sub-imgs">
                                <?php foreach ( $sub_imgs as $sub ) : ?>
                                    <div class="block-services-grid__sub-img">
                                        <?php lcdc_services_render_img( $sub['imageUrl'] ?? '', $title, '' ); ?>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
    </div>
</section>
