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
 * Featured Projects Block — render.php
 * Section "DỰ ÁN BIỂU TƯỢNG" — title + badges + lưới 2x2.
 *
 * @package lacadev-client-child
 */


$section_title = esc_html( $attributes['sectionTitle'] ?? 'DỰ ÁN BIỂU TƯỢNG' );
$badges        = $attributes['badges']          ?? [];
$cta_text      = esc_html( $attributes['ctaText'] ?? '' );
$cta_url       = esc_url( $attributes['ctaUrl']   ?? '' );
$mode          = $attributes['mode']            ?? 'auto';
$post_type     = sanitize_key( $attributes['postType'] ?? 'project' );
$post_ids      = array_map( 'intval', $attributes['postIds'] ?? [] );
$posts_count   = intval( $attributes['postsCount'] ?? 4 );
$order_by      = sanitize_key( $attributes['orderBy'] ?? 'date' );

// ── Build WP_Query ──────────────────────────────────────────────────────────
if ( $mode === 'manual' && ! empty( $post_ids ) ) {
    $query_args = [
        'post_type'           => $post_type,
        'post__in'            => $post_ids,
        'orderby'             => 'post__in',
        'posts_per_page'      => count( $post_ids ),
        'post_status'         => 'publish',
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
    ];
} else {
    $query_args = [
        'post_type'           => $post_type,
        'posts_per_page'      => $posts_count,
        'post_status'         => 'publish',
        'orderby'             => $order_by,
        'order'               => 'DESC',
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
    ];
}

$query = new WP_Query( $query_args );
?>

<section <?php echo get_block_wrapper_attributes( [ 'class' => 'block-featured-projects' ] ); ?> style="background:<?php echo esc_attr($bg_rgba); ?>;" >
    <div class="container">
    <div class="block-featured-projects__inner">

        <div class="block-featured-projects__left">
            <?php if ( $section_title ) : ?>
                <h2 class="block-featured-projects__title"><?php echo $section_title; ?></h2>
            <?php endif; ?>

            <?php if ( ! empty( $badges ) ) : ?>
                <div class="block-featured-projects__badges">
                    <?php foreach ( $badges as $badge ) : ?>
                        <div class="block-featured-projects__badge">
                            <span class="block-featured-projects__badge-label"><?php echo esc_html( $badge['label'] ?? '' ); ?></span>
                            <span class="block-featured-projects__badge-sublabel"><?php echo esc_html( $badge['sublabel'] ?? '' ); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if ( $cta_text && $cta_url ) : ?>
                <a class="block-featured-projects__cta" href="<?php echo $cta_url; ?>">
                    <?php echo $cta_text; ?>
                </a>
            <?php endif; ?>
        </div>

        <?php if ( $query->have_posts() ) : ?>
            <?php $count = 0; while ( $query->have_posts() && $count < 3 ) : $query->the_post(); $count++; ?>
                <?php
                $post_id   = get_the_ID();
                $post_link = esc_url( get_permalink() );
                $post_title = esc_attr( get_the_title() );
                $thumb_url  = get_the_post_thumbnail_url( $post_id, 'large' );
                ?>
                <a href="<?php echo $post_link; ?>" class="block-featured-projects__project">
                    <?php if ( $thumb_url ) : ?>
                        <img
                            class="block-featured-projects__img"
                            src="<?php echo esc_url( $thumb_url ); ?>"
                            alt="<?php echo $post_title; ?>"
                            loading="lazy"
                        />
                    <?php endif; ?>
                </a>
            <?php endwhile; ?>
            <?php wp_reset_postdata(); ?>
        <?php endif; ?>

    </div>
    </div>
</section>
