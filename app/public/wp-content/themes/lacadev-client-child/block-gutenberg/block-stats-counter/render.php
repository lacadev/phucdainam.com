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
 * Stats Counter Block — render.php
 *
 * @package lacadev-client-child
 */

$items            = $attributes['items']           ?? [];

$number_color     = $attributes['numberColor']     ?? '#F5C400';
$label_color      = $attributes['labelColor']      ?? '#FFFFFF';
$padding_top      = intval( $attributes['paddingTop']      ?? 60 );
$padding_bottom   = intval( $attributes['paddingBottom']   ?? 60 );
$count_up_dur     = intval( $attributes['countUpDuration'] ?? 2000 );
$count_up_trigger = sanitize_key( $attributes['countUpTrigger'] ?? 'viewport' );



$wrapper_attrs = get_block_wrapper_attributes( [
    'class'        => 'block-stats-counter',
    'style'        => sprintf(
        'background-color:%s;padding-top:%dpx;padding-bottom:%dpx;',
        esc_attr( $bg_color ),
        $padding_top,
        $padding_bottom
    ),
    'data-trigger' => $count_up_trigger,
] );
?>

<section <?php echo $wrapper_attrs; ?>>
    <div class="block-stats-counter__inner">
        <?php foreach ( $items as $item ) : ?>
            <div class="block-stats-counter__item">
                <span
                    class="block-stats-counter__number"
                    data-target="<?php echo esc_attr( $item['number'] ?? '0' ); ?>"
                    data-suffix="<?php echo esc_attr( $item['suffix'] ?? '' ); ?>"
                    data-duration="<?php echo esc_attr( $count_up_dur ); ?>"
                    style="color:<?php echo esc_attr( $number_color ); ?>;"
                ><?php echo esc_attr( $item['number'] ?? '0' ); ?><?php echo esc_html( $item['suffix'] ?? '' ); ?></span>
                <span class="block-stats-counter__label" style="color:<?php echo esc_attr( $label_color ); ?>;">
                    <?php echo esc_html( $item['label'] ?? '' ); ?>
                </span>
            </div>
        <?php endforeach; ?>
    </div>
</section>
