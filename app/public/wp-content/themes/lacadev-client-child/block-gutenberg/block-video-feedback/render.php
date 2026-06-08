<?php
if (!defined('ABSPATH'))
    exit;

/**
 * Video Feedback Slider — render.php
 * Swiper slider thumbnail → lightbox dùng chung #laca-video-lightbox (cùng pattern video-list-block).
 */

$heading = esc_html($attributes['heading'] ?? '');
$bg_color = preg_match('/^#[0-9a-fA-F]{6}$/', $attributes['bgColor'] ?? '') ? $attributes['bgColor'] : '#0f0f0f';
$bg_opacity = max(0, min(100, intval($attributes['bgOpacity'] ?? 100)));
$r = hexdec(substr($bg_color, 1, 2));
$g = hexdec(substr($bg_color, 3, 2));
$b = hexdec(substr($bg_color, 5, 2));
$bg_rgba = 'rgba(' . $r . ',' . $g . ',' . $b . ',' . ($bg_opacity / 100) . ')';
$slide_desktop = max(1, intval($attributes['slidesPerView'] ?? 4));
$space = intval($attributes['spaceBetween'] ?? 20);
$loop = !empty($attributes['loop']);
$autoplay = !empty($attributes['autoplay']);
$autoplay_delay = intval($attributes['autoplayDelay'] ?? 3000);
$show_pagination = !isset($attributes['showPagination']) || $attributes['showPagination'];
$show_nav = !isset($attributes['showNavigation']) || $attributes['showNavigation'];

$videos = array_filter(
    is_array($attributes['videos'] ?? []) ? $attributes['videos'] : [],
    fn($v) => !empty($v['url'])
);

if (empty($videos))
    return;

// ── Enqueue Swiper ──────────────────────────────────────────────────────────
if (!wp_style_is('swiper', 'enqueued')) {
    wp_enqueue_style('swiper', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css', [], '11');
}
if (!wp_script_is('swiper', 'enqueued')) {
    wp_enqueue_script('swiper', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js', [], '11', true);
}

// ── Helpers (guard against re-declaration) ─────────────────────────────────
if (!function_exists('lacadev_parse_video_embed_url')) {
    function lacadev_parse_video_embed_url(string $url): string
    {
        if (preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $url, $m)) {
            return 'https://www.youtube.com/embed/' . $m[1] . '?autoplay=1&rel=0';
        }
        if (preg_match('/vimeo\.com\/(\d+)/', $url, $m)) {
            return 'https://player.vimeo.com/video/' . $m[1] . '?autoplay=1';
        }
        return $url;
    }
}

if (!function_exists('lacadev_get_youtube_thumbnail')) {
    function lacadev_get_youtube_thumbnail(string $url): string
    {
        if (preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $url, $m)) {
            return 'https://i.ytimg.com/vi/' . $m[1] . '/hqdefault.jpg';
        }
        return '';
    }
}

// ── Unique instance ─────────────────────────────────────────────────────────
static $vf_instance = 0;
$vf_instance++;
$swiper_id = 'video-feedback-' . $vf_instance;
?>

<section <?php echo get_block_wrapper_attributes(['class' => 'block-video-feedback']); ?> style="background:<?php echo esc_attr($bg_rgba); ?>;">
    <div class="container">

        <!-- HEADER -->
        <div class="header-section" data-aos="fade-up">
            <?php 
            if ( $heading ) :
                echo '<h2 class="heading">' . $heading . '</h2>';
            endif;
            ?>
        </div>

        <div class="swiper block-video-feedback__swiper" id="<?php echo esc_attr($swiper_id); ?>">
            <div class="swiper-wrapper">
                <?php foreach ($videos as $video):
                    $url = esc_url($video['url'] ?? '');
                    $name = esc_html($video['name'] ?? '');
                    $embed_url = lacadev_parse_video_embed_url($url);
                    $thumb = !empty($video['thumbnailUrl']) ? esc_url($video['thumbnailUrl']) : lacadev_get_youtube_thumbnail($url);
                    if (!$thumb)
                        continue;
                    ?>
                    <div class="swiper-slide block-video-feedback__slide">
                        <figure class="block-video-feedback__figure">
                            <article
                                class="block-video-feedback__item"
                                data-video="<?php echo esc_attr($embed_url); ?>"
                                data-type="embed"
                                role="button"
                                tabindex="0"
                                aria-label="<?php echo $name
                                    ? esc_attr(sprintf(__('Xem video: %s', 'laca'), $name))
                                    : esc_attr__('Xem video', 'laca'); ?>">
                                <div class="block-video-feedback__thumb">
                                    <img
                                        src="<?php echo esc_url($thumb); ?>"
                                        alt="<?php echo $name ?: 'Video feedback'; ?>"
                                        loading="lazy"
                                        class="block-video-feedback__img" />
                                    <button class="block-video-feedback__play" aria-hidden="true" tabindex="-1">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <circle cx="12" cy="12" r="11" stroke="#fff" stroke-width="1.5" opacity=".9" />
                                            <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="#fff" />
                                        </svg>
                                    </button>
                                </div>
                            </article>
                            <?php if ($name): ?>
                                <figcaption class="block-video-feedback__name"><?php echo $name; ?></figcaption>
                            <?php endif; ?>
                        </figure>
                    </div>
                <?php endforeach; ?>
            </div>

            <?php if ($show_pagination): ?>
                <div class="swiper-pagination block-video-feedback__pagination"></div>
            <?php endif; ?>
            <?php if ($show_nav): ?>
                <div class="swiper-button-prev block-video-feedback__prev"></div>
                <div class="swiper-button-next block-video-feedback__next"></div>
            <?php endif; ?>
        </div>
    </div>

</section>

<?php
// ── Shared lightbox DOM (render once per page) ──────────────────────────────
if (!did_action('lacadev_video_lightbox_rendered')):
    do_action('lacadev_video_lightbox_rendered');
    ?>
    <div id="laca-video-lightbox" class="laca-video-lightbox" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e('Video', 'laca'); ?>" hidden>
        <div class="laca-video-lightbox__backdrop"></div>
        <div class="laca-video-lightbox__box">
            <button class="laca-video-lightbox__close" aria-label="<?php esc_attr_e('Đóng', 'laca'); ?>">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
            </button>
            <div class="laca-video-lightbox__media"></div>
        </div>
    </div>
<?php endif; ?>

<?php
// ── Swiper init ─────────────────────────────────────────────────────────────
// ── Build JS config từ attributes ─────────────────────────────────────────
$slide_mobile = min(1.2, $slide_desktop);
$slide_tablet = min(2.2, $slide_desktop);
$space_mobile = max(12, $space - 8);

$js_loop = $loop ? 'true' : 'false';
$js_pagination = $show_pagination
    ? sprintf('pagination: { el: "#%s .swiper-pagination", clickable: true },', $swiper_id)
    : '';
$js_navigation = $show_nav
    ? sprintf('navigation: { prevEl: "#%s .swiper-button-prev", nextEl: "#%s .swiper-button-next" },', $swiper_id, $swiper_id)
    : '';
$js_autoplay = $autoplay
    ? sprintf('autoplay: { delay: %d, disableOnInteraction: false },', $autoplay_delay)
    : 'autoplay: false,';

$js = sprintf(
    '
(function () {
    function init_%1$s() {
        if (typeof Swiper === "undefined") { setTimeout(init_%1$s, 80); return; }
        new Swiper("#%2$s", {
            slidesPerView: %3$s,
            spaceBetween: %4$d,
            loop: %5$s,
            %6$s
            %7$s
            %8$s
            breakpoints: {
                600:  { slidesPerView: %9$s, spaceBetween: %4$d },
                900:  { slidesPerView: %10$s, spaceBetween: %4$d },
                1200: { slidesPerView: %11$s, spaceBetween: %4$d }
            }
        });

        /* Lightbox — dùng chung #laca-video-lightbox */
        var lb       = document.getElementById("laca-video-lightbox");
        var lbMedia  = lb ? lb.querySelector(".laca-video-lightbox__media") : null;
        var lbClose  = lb ? lb.querySelector(".laca-video-lightbox__close") : null;
        var lbBack   = lb ? lb.querySelector(".laca-video-lightbox__backdrop") : null;

        function openLb(embedUrl) {
            if (!lb || !lbMedia) return;
            lbMedia.innerHTML = \'<iframe src="\' + embedUrl + \'" allow="autoplay; encrypted-media" allowfullscreen></iframe>\';
            lb.removeAttribute("hidden");
            document.body.style.overflow = "hidden";
            lbClose && lbClose.focus();
        }
        function closeLb() {
            if (!lb) return;
            lb.setAttribute("hidden", "");
            lbMedia && (lbMedia.innerHTML = "");
            document.body.style.overflow = "";
        }

        /* Bind only once (guard multi-instance) */
        if (!lb || lb.dataset.lbBound) return;
        lb.dataset.lbBound = "1";
        lbClose  && lbClose.addEventListener("click", closeLb);
        lbBack   && lbBack.addEventListener("click", closeLb);
        document.addEventListener("keydown", function(e){ if(e.key==="Escape") closeLb(); });

        /* Event delegation on document for all [data-video] blocks */
        document.addEventListener("click", function(e) {
            var el = e.target.closest("[data-video][data-type=\'embed\']");
            if (!el) return;
            e.preventDefault();
            openLb(el.getAttribute("data-video"));
        });
        document.addEventListener("keydown", function(e) {
            if (e.key !== "Enter" && e.key !== " ") return;
            var el = e.target.closest("[data-video][data-type=\'embed\']");
            if (!el) return;
            e.preventDefault();
            openLb(el.getAttribute("data-video"));
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init_%1$s);
    } else {
        init_%1$s();
    }
})();',
    $vf_instance,              // %1$s — fn name suffix
    $swiper_id,                // %2$s — selector
    $slide_mobile,             // %3$s — slidesPerView mobile
    $space_mobile,             // %4$d — spaceBetween
    $js_loop,                  // %5$s — loop bool
    $js_pagination,            // %6$s — pagination config
    $js_navigation,            // %7$s — navigation config
    $js_autoplay,              // %8$s — autoplay config
    $slide_tablet,             // %9$s — tablet
    min($slide_desktop - 0.2, $slide_desktop), // %10$s — ≈desktop-1
    $slide_desktop             // %11$s — desktop
);
wp_add_inline_script('swiper', $js);
