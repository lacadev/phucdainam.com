<?php
if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! function_exists( 'journey_normalize_spacing_value' ) ) {
	function journey_normalize_spacing_value( $value ): string {
		if ( is_numeric( $value ) ) {
			return $value . 'px';
		}

		$value = trim( (string) $value );
		if ( '' === $value ) {
			return '';
		}

		if ( preg_match( '/^-?\d+(\.\d+)?(px|rem|em|vw|vh|%)$/', $value ) ) {
			return $value;
		}

		return '';
	}
}


// ── Appearance attributes ──────────────────────────────────────────────────
$bg_color     = preg_match( '/^#[0-9a-fA-F]{6}$/', $attributes['bgColor'] ?? '' ) ? $attributes['bgColor'] : '#0f0f0f';
$bg_opacity   = max( 0, min( 100, intval( $attributes['bgOpacity'] ?? 100 ) ) );
$r = hexdec( substr( $bg_color, 1, 2 ) );
$g = hexdec( substr( $bg_color, 3, 2 ) );
$b = hexdec( substr( $bg_color, 5, 2 ) );
$bg_rgba = 'rgba(' . $r . ',' . $g . ',' . $b . ',' . ( $bg_opacity / 100 ) . ')';
/**
 * Journey Gallery Block — render.php
 *
 * Desktop: CSS Grid 2 cột
 *   - Bước lẻ (1,3,5…) → hàng 1, cột tăng dần → text-trái, ảnh-phải
 *   - Bước chẵn (2,4,6…) → hàng 3, cột tăng dần → ảnh-trái, text-phải
 *   - Timeline (đường ngang + chấm) → hàng 2
 *
 * Mobile: flex column theo thứ tự DOM (1,2,3,4…) zigzag
 *   + đường dọc + chấm bên phải
 */

$heading   = esc_html( $attributes['heading'] ?? '' );
$subheading = esc_html( $attributes['subheading'] ?? '' );
$steps     = is_array( $attributes['steps'] ?? [] ) ? $attributes['steps'] : [];
$steps     = array_values( array_filter( $steps, fn( $s ) => ! empty( $s['title'] ) || ! empty( $s['imageUrl'] ) ) );

$margin_top = max( -200, min( 300, intval( $attributes['marginTop'] ?? 0 ) ) );
$margin_bottom = max( -200, min( 300, intval( $attributes['marginBottom'] ?? 0 ) ) );
$padding_top = max( 0, min( 300, intval( $attributes['paddingTop'] ?? 60 ) ) );
$padding_bottom = max( 0, min( 300, intval( $attributes['paddingBottom'] ?? 55 ) ) );

if ( empty( $steps ) ) return;

$step_count = count( $steps );
$cols       = max( 1, (int) ceil( $step_count / 2 ) ); // số cột grid

$style_vars = [];
$spacing    = is_array( $attributes['spacing'] ?? null ) ? $attributes['spacing'] : [];
$devices    = [ 'desktop', 'tablet', 'mobile' ];
$types      = [ 'margin', 'padding' ];
$sides      = [ 'top', 'left', 'bottom', 'right' ];

foreach ( $devices as $device ) {
	foreach ( $types as $type ) {
		foreach ( $sides as $side ) {
			$raw_value = $spacing[ $device ][ $type ][ $side ] ?? '';
			$value     = journey_normalize_spacing_value( $raw_value );
			if ( '' === $value ) {
				continue;
			}

			$var_name      = '--journey-' . $type . '-' . $side;
			$device_suffix = 'desktop' === $device ? '' : '-' . $device;
			$style_vars[]  = $var_name . $device_suffix . ':' . $value;
		}
	}
}

if ( empty( $style_vars ) ) {
	// Backward compatibility for old block attributes.
	$style_vars[] = '--journey-margin-top:' . $margin_top . 'px';
	$style_vars[] = '--journey-margin-bottom:' . $margin_bottom . 'px';
	$style_vars[] = '--journey-padding-top:' . $padding_top . 'px';
	$style_vars[] = '--journey-padding-bottom:' . $padding_bottom . 'px';
}

$wrapper_style = 'background:' . esc_attr( $bg_rgba ) . ';' . implode( ';', $style_vars ) . ';';

$wrapper_attrs = [
	'class' => 'journey-gallery',
	'style' => $wrapper_style,
];
?>

<section <?php echo get_block_wrapper_attributes( $wrapper_attrs ); ?>>
    <div class="container-fluid">
        <!-- HEADER -->
        <div class="header-section" data-aos="fade-up">
            <?php 
            if ( $heading ) :
                echo '<h2 class="heading">' . $heading . '</h2>';
            endif;
            
            if ( $subheading ) :
                echo '<p class="subheading">' . $subheading . '</p>';
            endif;
            ?>
        </div>

        <!-- TRACK -->
        <div class="journey-gallery__track" style="--jg-cols:<?php echo $cols; ?>">
            <?php foreach ( $steps as $i => $step ) :
                $num      = $i + 1;
                $col      = floor( $i / 2 ) + 1;       // cột grid (1-based)
                $row      = ( $i % 2 === 0 ) ? 1 : 3;  // hàng 1 (lẻ) hoặc hàng 3 (chẵn)
                $is_even  = ( $i % 2 !== 0 );           // bước chẵn → đảo chiều
                $content_aos = $is_even ? 'fade-left' : 'fade-right';
                $image_aos   = $is_even ? 'fade-right' : 'fade-left';
                $title    = esc_html( $step['title'] ?? '' );
                $desc     = esc_html( $step['description'] ?? '' );
                $img      = esc_url( $step['imageUrl'] ?? '' );
                $alt      = esc_attr( $step['imageAlt'] ?? $title );
            ?>
                <article
                    class="journey-gallery__step<?php echo $is_even ? ' journey-gallery__step--even' : ''; ?>"
                >
                    <div class="journey-gallery__content" data-aos="<?php echo esc_attr( $content_aos ); ?>">
                        <span class="journey-gallery__number"><?php echo $num; ?></span>

                        <div class="journey-gallery__text">
                            <?php if ( $title ) : ?>
                                <h3 class="journey-gallery__title"><?php echo $title; ?></h3>
                            <?php endif; ?>
                            <?php if ( $desc ) : ?>
                                <p class="journey-gallery__desc"><?php echo $desc; ?></p>
                            <?php endif; ?>
                        </div>
                    </div>

                    <?php if ( $img ) : ?>
                        <div class="journey-gallery__image" data-aos="<?php echo esc_attr( $image_aos ); ?>">
                            <img src="<?php echo $img; ?>" alt="<?php echo $alt; ?>" loading="lazy" />
                        </div>
                    <?php endif; ?>
                </article>
            <?php endforeach; ?>

            <!-- Timeline ngang (desktop) — grid-row:2, chiếm toàn bộ cột -->
            <!-- <div class="journey-gallery__timeline">
                <div class="journey-gallery__timeline-line"></div>
                <?php //for ( $d = 0; $d < $step_count; $d++ ) : ?>
                    <span class="journey-gallery__timeline-dot"></span>
                <?php //endfor; ?>
            </div> -->

        </div>
    </div><!-- /.container -->
</section>
