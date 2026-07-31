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
 * Team Leaders Block — render.php
 * Section "CON NGƯỜI PHÚC ĐẠI NAM" — ảnh cutout, tên, chức vụ, quote.
 *
 * @package lacadev-client-child
 */

$heading = esc_html( $attributes['sectionTitle'] ?? 'CON NGƯỜI PHÚC ĐẠI NAM' );

$leaders       = $attributes['leaders'] ?? [];
?>

<section <?php echo get_block_wrapper_attributes( [ 'class' => 'block-team-leaders' ] ); ?> style="background:<?php echo esc_attr($bg_rgba); ?>;" >
    <div class="block-team-leaders__inner">

        <!-- HEADER -->
        <div class="header-section" data-aos="fade-up">
            <?php 
            if ( $heading ) :
                echo '<h2 class="heading">' . $heading . '</h2>';
            endif;
            ?>
        </div>

        <div class="block-team-leaders__grid">
            <?php foreach ( $leaders as $leader_index => $leader ) : ?>
                <?php $leader_aos = ( ( $leader_index + 1 ) % 2 === 1 ) ? 'fade-right' : 'fade-left'; ?>
                <div class="block-team-leaders__card" data-aos="<?php echo esc_attr( $leader_aos ); ?>">

                    <figure class="block-team-leaders__figure">
                        <?php if ( ! empty( $leader['imageUrl'] ) ) : ?>
                            <img
                                src="<?php echo esc_url( $leader['imageUrl'] ); ?>"
                                alt="<?php echo esc_attr( $leader['name'] ?? '' ); ?>"
                                loading="lazy"
                            />
                        <?php else : ?>
                            <div class="block-team-leaders__no-image"></div>
                        <?php endif; ?>
                    </figure>

                    <div class="block-team-leaders__info">
                        <div class="block-team-leaders__name-wrap">
                            <span class="block-team-leaders__prefix"><?php echo esc_html( $leader['prefix'] ?? '' ); ?></span>
                            <strong class="block-team-leaders__name"><?php echo esc_html( $leader['name'] ?? '' ); ?></strong>
                        </div>
                        <div class="block-team-leaders__badge" data-aos="<?php echo esc_attr( $leader_aos ); ?>"><?php echo esc_html( $leader['position'] ?? '' ); ?></div>
                    </div>

                    <?php if ( ! empty( $leader['quote'] ) ) : ?>
                        <blockquote class="block-team-leaders__quote">
                            "<?php echo esc_html( $leader['quote'] ); ?>"
                        </blockquote>
                    <?php endif; ?>

                </div>
            <?php endforeach; ?>
        </div>

    </div>
</section>
