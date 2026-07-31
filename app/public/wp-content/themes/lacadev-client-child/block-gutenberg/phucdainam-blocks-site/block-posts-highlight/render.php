<?php
/**
 * posts-highlight-block — render.php
 * Layout: 2-column grid, horizontal cards (thumb left + content right)
 * Gold separator line between title and footer (cat + CTA)
 */
if ( ! defined( 'ABSPATH' ) ) exit;



// ── Appearance attributes ──────────────────────────────────────────────────
$bg_color     = preg_match( '/^#[0-9a-fA-F]{6}$/', $attributes['bgColor'] ?? '' ) ? $attributes['bgColor'] : '#0f0f0f';
$bg_opacity   = max( 0, min( 100, intval( $attributes['bgOpacity'] ?? 100 ) ) );
$r = hexdec( substr( $bg_color, 1, 2 ) );
$g = hexdec( substr( $bg_color, 3, 2 ) );
$b = hexdec( substr( $bg_color, 5, 2 ) );
$bg_rgba = 'rgba(' . $r . ',' . $g . ',' . $b . ',' . ( $bg_opacity / 100 ) . ')';
// ── Attributes ─────────────────────────────────────────────────────────────────
$heading   = esc_html( $attributes['sectionTitle']   ?? 'Tin Mới Nhất' );
$cta_text        = esc_html( $attributes['ctaText']        ?? 'Đọc thêm' );
$post_type       = sanitize_key( $attributes['postType']   ?? 'post' );
$taxonomy        = sanitize_key( $attributes['taxonomy']   ?? '' );
$selected_terms  = array_map( 'absint', (array) ( $attributes['selectedTerms'] ?? [] ) );
$mode            = in_array( $attributes['mode'] ?? 'auto', [ 'auto', 'manual' ], true )
                    ? $attributes['mode'] : 'auto';
$orderby         = sanitize_key( $attributes['orderBy']    ?? 'date' );
$order           = strtoupper( $attributes['order'] ?? 'DESC' ) === 'ASC' ? 'ASC' : 'DESC';
$posts_count     = max( 1, min( 20, intval( $attributes['postsCount'] ?? 4 ) ) );
$selected_posts  = array_map( 'absint', (array) ( $attributes['selectedPosts'] ?? [] ) );

$safe_orderby = in_array( $orderby, [ 'date', 'title', 'menu_order', 'comment_count', 'modified' ], true )
                    ? $orderby : 'date';

// ── WP_Query ───────────────────────────────────────────────────────────────────
if ( $mode === 'manual' && ! empty( $selected_posts ) ) {
    $query_args = [
        'post_type'           => $post_type,
        'post__in'            => $selected_posts,
        'orderby'             => 'post__in',
        'posts_per_page'      => count( $selected_posts ),
        'post_status'         => 'publish',
        'no_found_rows'       => true,
        'ignore_sticky_posts' => true,
    ];
} else {
    $query_args = [
        'post_type'           => $post_type,
        'posts_per_page'      => $posts_count,
        'post_status'         => 'publish',
        'orderby'             => $safe_orderby,
        'order'               => $order,
        'no_found_rows'       => true,
        'ignore_sticky_posts' => true,
    ];

    if ( $taxonomy && ! empty( $selected_terms ) ) {
        $query_args['tax_query'] = [
            [
                'taxonomy' => $taxonomy,
                'field'    => 'term_id',
                'terms'    => $selected_terms,
            ],
        ];
    }
}

$loop  = new WP_Query( $query_args );
$posts = $loop->posts;
wp_reset_postdata();

if ( empty( $posts ) ) return;

// ── Helper ─────────────────────────────────────────────────────────────────────
$get_cat = static function ( WP_Post $post, string $taxonomy ): string {
    if ( $taxonomy ) {
        $terms = get_the_terms( $post, $taxonomy );
        if ( $terms && ! is_wp_error( $terms ) ) {
            return esc_html( $terms[0]->name );
        }
    }
    $cats = get_the_category( $post->ID );
    return $cats ? esc_html( $cats[0]->name ) : '';
};

// ── Output ─────────────────────────────────────────────────────────────────────
$wrapper_attrs = get_block_wrapper_attributes( [ 'class' => 'block-posts-highlight' ] );
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

        <div class="phb__grid">
            <?php foreach ( $posts as $post ) :
                $post_url  = esc_url( get_permalink( $post ) );
                $cat_name  = $get_cat( $post, $taxonomy );
                $title     = esc_html( get_the_title( $post ) );
                $thumb_id  = get_post_thumbnail_id( $post->ID );
                $thumb_url = $thumb_id ? esc_url( get_the_post_thumbnail_url( $post->ID, 'medium_large' ) ) : '';
                $post_index = $loop->current_post;
            ?>
            <a href="<?php echo $post_url; ?>" class="phb__card" data-aos="fade-up" data-aos-delay="<?php echo $post_index * 100; ?>">
                <div class="phb__card-inner">
                    <div class="phb__thumb">
                        <?php if ( $thumb_url ) : ?>
                            <img src="<?php echo $thumb_url; ?>"
                                 alt="<?php echo $title; ?>"
                                 loading="lazy" class="phb__img" />
                        <?php else : ?>
                            <div class="phb__thumb-placeholder"></div>
                        <?php endif; ?>
                    </div>
                    <div class="phb__body">
                        <div class="phb__content">
                            <h3 class="phb__title"><?php echo $title; ?></h3>
                        </div>
                        <div class="phb__separator" aria-hidden="true"></div>
                        <div class="phb__footer">
                            <?php if ( $cat_name ) : ?>
                            <span class="phb__cat"><?php echo $cat_name; ?></span>
                            <?php endif; ?>
                            <span class="phb__cta"><?php echo $cta_text; ?> <span aria-hidden="true">→</span></span>
                        </div>
                    </div>
                </div>
            </a>
            <?php endforeach; ?>
        </div>

    </div>
</section>
