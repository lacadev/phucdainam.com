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
 * Team Carousel Block — render.php
 * Swiper centeredSlides, active slide full size, inactive at {inactiveScale}%.
 * Scale effect handled via CSS (.swiper-slide-active selector).
 *
 * @package lacadev-client-child
 */

// ── Sanitize attributes ────────────────────────────────────────────────────
$section_title  = esc_html( $attributes['sectionTitle'] ?? '' );
$slides         = is_array( $attributes['slides'] ?? [] ) ? $attributes['slides'] : [];
$loop           = ! empty( $attributes['loop'] );
$autoplay       = ! empty( $attributes['autoplay'] );
$autoplay_delay = intval( $attributes['autoplayDelay'] ?? 3000 );
$space_between  = intval( $attributes['spaceBetween'] ?? 24 );
$inactive_scale = max( 40, min( 95, intval( $attributes['inactiveScale'] ?? 60 ) ) );
$bg_color       = sanitize_hex_color( $attributes['bgColor'] ?? '' ) ?: '#1a1a1a';

$slides = array_values( array_filter( $slides, fn( $s ) => ! empty( $s['imageUrl'] ) ) );

if ( empty( $slides ) ) return;
$slides_count = count( $slides );

// When "loop" is on: duplicate last + first in markup and disable Swiper loop (stable order + layout with slidesPerView "auto").
$slides_for_markup = $slides;
$swiper_initial    = 0;
$swiper_buffered   = false;
if ( $loop && $slides_count > 1 ) {
    $slides_for_markup = array_merge(
        [ $slides[ $slides_count - 1 ] ],
        $slides,
        [ $slides[0] ]
    );
    $swiper_initial  = 1;
    $swiper_buffered = true;
}

// ── Unique ID per instance ─────────────────────────────────────────────────
static $tc_instance = 0;
$tc_instance++;
$swiper_id = 'team-carousel-' . $tc_instance;

// ── Enqueue Swiper ─────────────────────────────────────────────────────────
if ( ! wp_style_is( 'swiper', 'enqueued' ) ) {
    wp_enqueue_style( 'swiper', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css', [], '11' );
}
if ( ! wp_script_is( 'swiper', 'enqueued' ) ) {
    wp_enqueue_script( 'swiper', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js', [], '11', true );
}

// Convert inactiveScale % → CSS ratio string for inline style
$scale_ratio_css = round( $inactive_scale / 100, 2 );
?>

<section <?php echo get_block_wrapper_attributes( [
    'class' => 'block-team-carousel',
    'style' => 'background:' . esc_attr( $bg_color ) . ';',
] ); ?>>

    <?php if ( $section_title ) : ?>
        <div class="container">
            <h2 class="block-team-carousel__heading"><?php echo $section_title; ?></h2>
        </div>
    <?php endif; ?>

    <div class="swiper block-team-carousel__swiper" id="<?php echo esc_attr( $swiper_id ); ?>">
        <div class="swiper-wrapper">
            <?php foreach ( $slides_for_markup as $slide ) :
                $img_url = esc_url( $slide['imageUrl'] ?? '' );
                $img_alt = esc_attr( $slide['imageAlt'] ?? '' );
            ?>
                <div class="swiper-slide block-team-carousel__slide">
                    <div class="block-team-carousel__slide-inner">
                        <?php if ( $img_url ) : ?>
                            <img
                                src="<?php echo $img_url; ?>"
                                alt="<?php echo $img_alt; ?>"
                                loading="<?php echo $swiper_buffered ? 'eager' : 'lazy'; ?>"
                                class="block-team-carousel__img"
                            />
                        <?php else : ?>
                            <div class="block-team-carousel__no-image"></div>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <button type="button" class="swiper-button-prev" aria-label="<?php esc_attr_e( 'Trước', 'laca' ); ?>">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
            </svg>
        </button>
        <button type="button" class="swiper-button-next" aria-label="<?php esc_attr_e( 'Tiếp theo', 'laca' ); ?>">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        </button>
    </div>

</section>

<?php
// Inline hardening styles to prevent third-party Swiper/global CSS overrides.
// Scoped by instance id so each block is isolated.
$instance_style = sprintf(
    '#%1$s .swiper-slide{box-sizing:border-box;height:clamp(280px,38vw,520px);flex-shrink:0;}#%1$s .block-team-carousel__slide-inner{transform:scale(var(--tc-inactive-scale,0.62));transition:transform .5s cubic-bezier(.25,.46,.45,.94);}#%1$s .swiper-slide-active .block-team-carousel__slide-inner{transform:scale(1);}',
    $swiper_id
);
wp_add_inline_style( 'swiper', $instance_style );

// ── Inline Swiper init ─────────────────────────────────────────────────────
// Never use Swiper loop with slidesPerView "auto" (reorders DOM / gaps). Buffered markup + slideChangeTransitionEnd handles infinite scroll.
// slidesPerView: up to 3 from 992px (numeric width); below 992 uses 2 / 1.15 so slides are not squeezed by fixed clamp widths.
// Without buffer: rewind wraps prev/next when loop attribute is off.
// If inactiveScale differs from CSS default (62%), inject a custom property.
$scale_override = '';
if ( $inactive_scale !== 62 ) {
    $scale_override = sprintf(
        'el.style.setProperty("--tc-inactive-scale", "%s");',
        esc_js( (string) $scale_ratio_css )
    );
}

$js_rewind = ( ! $loop && ! $swiper_buffered && $slides_count > 1 ) ? 'true' : 'false';
$js_autoplay = ( $autoplay && $slides_count > 0 )
    ? sprintf(
        'autoplay:{delay:%d,disableOnInteraction:false,pauseOnMouseEnter:true,waitForTransition:true},',
        $autoplay_delay
    )
    : '';

$js_swiper_on = '';
if ( $swiper_buffered ) {
    $js_swiper_on = sprintf(
        'on: {
                slideChangeTransitionEnd: function (swiper) {
                    var n = %d;
                    var i = swiper.activeIndex;
                    if (i === 0) {
                        swiper.slideTo(n, 0, false);
                    } else if (i === n + 1) {
                        swiper.slideTo(1, 0, false);
                    }
                }
            },
',
        $slides_count
    );
}

$js = sprintf(
    '(function () {
    var rootId = %1$s;
    function mountTeamCarousel() {
        if (typeof Swiper === "undefined") {
            setTimeout(mountTeamCarousel, 50);
            return;
        }
        var el = document.getElementById(rootId);
        if (!el) return;
        if (el.swiper && typeof el.swiper.destroy === "function") {
            el.swiper.destroy(true, true);
        }
        %2$s
        new Swiper(el, {
            slidesPerView: 1.15,
            centeredSlides: true,
            centerInsufficientSlides: true,
            spaceBetween: 16,
            speed: 500,
            breakpoints: {
                640: { slidesPerView: 2, spaceBetween: %3$d },
                992: { slidesPerView: 3, spaceBetween: %3$d }
            },
            loop: false,
            rewind: %4$s,
            initialSlide: %5$d,
            watchOverflow: false,
            watchSlidesProgress: true,
            roundLengths: true,
            observer: false,
            observeParents: false,
            %6$s
            %7$s
            navigation: {
                nextEl: "#" + rootId + " .swiper-button-next",
                prevEl: "#" + rootId + " .swiper-button-prev"
            }
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountTeamCarousel);
    } else {
        mountTeamCarousel();
    }
})();',
    wp_json_encode( $swiper_id ),
    $scale_override,
    $space_between,
    $js_rewind,
    (int) $swiper_initial,
    $js_autoplay,
    $js_swiper_on
);
wp_add_inline_script( 'swiper', $js );

