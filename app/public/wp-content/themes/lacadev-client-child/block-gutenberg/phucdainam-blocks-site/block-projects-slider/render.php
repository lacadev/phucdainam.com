<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Projects Slider Block — render.php
 * Swiper fullwidth, centeredSlides, autoplay — clone UI ancuong.com.
 *
 * @package lacadev-client
 */

// ── Sanitize attributes ────────────────────────────────────────────────────
$attr          = $attributes;
$heading = esc_html( $attr['sectionTitle']);
$cta_text      = esc_html( $attr['ctaText']      ?? 'Xem Thêm' );
$heading_color = sanitize_hex_color( $attr['headingColor'] ?? '' );

$post_type      = sanitize_key( $attr['postType']      ?? 'post' );
$taxonomy       = sanitize_key( $attr['taxonomy']      ?? '' );
$selected_terms = array_map( 'intval', $attr['selectedTerms'] ?? [] );
$mode           = $attr['mode'] ?? 'auto';
$posts_count    = intval( $attr['postsCount']  ?? 6 );
$order_by       = sanitize_key( $attr['orderBy']       ?? 'date' );
$order          = in_array( strtoupper( $attr['order'] ?? 'DESC' ), [ 'ASC', 'DESC' ], true )
    ? strtoupper( $attr['order'] )
    : 'DESC';
$selected_posts = array_map( 'intval', $attr['selectedPosts'] ?? [] );

$show_popup      = ! empty( $attr['showPopupForm'] );
$popup_budget    = is_array( $attr['popupBudgetOptions'] ?? [] ) ? $attr['popupBudgetOptions'] : [];
$popup_btn_text  = esc_html( $attr['popupButtonText'] ?? 'GỬI YÊU CẦU' );

// ── Appearance attributes ──────────────────────────────────────────────────
$bg_color     = preg_match( '/^#[0-9a-fA-F]{6}$/', $attr['bgColor'] ?? '' )
    ? $attr['bgColor']
    : '#0f0f0f';
$bg_opacity   = max( 0, min( 100, intval( $attr['bgOpacity'] ?? 100 ) ) );
$pause_hover  = ! empty( $attr['pauseOnHover'] );

// Convert hex + opacity to rgba for inline style
$r = hexdec( substr( $bg_color, 1, 2 ) );
$g = hexdec( substr( $bg_color, 3, 2 ) );
$b = hexdec( substr( $bg_color, 5, 2 ) );
$bg_rgba = 'rgba(' . $r . ',' . $g . ',' . $b . ',' . ( $bg_opacity / 100 ) . ')';

// ── Build WP_Query ─────────────────────────────────────────────────────────
if ( $mode === 'manual' && ! empty( $selected_posts ) ) {
    $query_args = [
        'post_type'           => $post_type,
        'post__in'            => $selected_posts,
        'orderby'             => 'post__in',
        'posts_per_page'      => count( $selected_posts ),
        'post_status'         => 'publish',
        'ignore_sticky_posts' => true,
    ];
} else {
    $query_args = [
        'post_type'           => $post_type,
        'posts_per_page'      => $posts_count,
        'post_status'         => 'publish',
        'orderby'             => $order_by,
        'order'               => $order,
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

$query = new WP_Query( $query_args );

// ── Unique ID per instance ─────────────────────────────────────────────────
static $instance = 0;
$instance++;
$swiper_id = 'projects-slider-' . $instance;

$section_extra_attrs = 'class="block-projects-slider" style="background:' . esc_attr( $bg_rgba ) . ';"';
if ( $show_popup ) {
    $popup_id = 'pslider-popup-' . $instance;
    $section_extra_attrs .= ' data-popup-id="' . esc_attr( $popup_id ) . '"';
}
?>

<section <?php echo get_block_wrapper_attributes(); ?> <?php echo $section_extra_attrs; ?>>

    <div class="container">
        <!-- HEADER -->
        <div class="header-section" data-aos="fade-up">
            <?php 
            if ( $heading ) :
                echo '<h2 class="heading">' . $heading . '</h2>';
            endif;
            ?>
        </div>
    </div>

    <?php if ( $query->have_posts() ) : ?>

        <div class="block-projects-slider__viewport" id="<?php echo esc_attr( $swiper_id ); ?>">
            <div class="block-projects-slider__track" data-speed="80">
                <?php $slide_index = 0; ?>
                <?php while ( $query->have_posts() ) : $query->the_post(); ?>
                    <?php
                    $post_id    = get_the_ID();
                    $post_link  = esc_url( get_permalink() );
                    $post_title = get_the_title();
                    $thumb_url  = get_the_post_thumbnail_url( $post_id, 'large' );
                    $thumb_alt  = esc_attr(
                        get_post_meta( get_post_thumbnail_id( $post_id ), '_wp_attachment_image_alt', true )
                        ?: $post_title
                    );

                    // Taxonomy label
                    $cat_name = '';
                    if ( $taxonomy ) {
                        $terms_list = get_the_terms( $post_id, $taxonomy );
                        if ( $terms_list && ! is_wp_error( $terms_list ) ) {
                            $cat_name = esc_html( $terms_list[0]->name );
                        }
                    } else {
                        $cats = get_the_category( $post_id );
                        if ( $cats ) {
                            $cat_name = esc_html( $cats[0]->name );
                        }
                    }
                    ?>
                    <div class="block-projects-slider__slide<?php echo 0 === $slide_index ? ' is-active' : ''; ?>" data-origin-index="<?php echo esc_attr( $slide_index ); ?>">
                        <a href="<?php echo $post_link; ?>"
                           class="block-projects-slider__image-link"
                           aria-label="<?php echo esc_attr( $post_title ); ?>">

                            <?php if ( $thumb_url ) : ?>
                                <img
                                    src="<?php echo esc_url( $thumb_url ); ?>"
                                    alt="<?php echo $thumb_alt; ?>"
                                    loading="lazy"
                                    class="block-projects-slider__img"
                                />
                            <?php else : ?>
                                <div class="block-projects-slider__no-image" aria-hidden="true"></div>
                            <?php endif; ?>

                            <div class="block-projects-slider__overlay">
                                <?php if ( $cat_name ) : ?>
                                    <span class="block-projects-slider__cat"><?php echo $cat_name; ?></span>
                                <?php endif; ?>
                                <h3 class="block-projects-slider__title">
                                    <?php echo esc_html( $post_title ); ?>
                                </h3>
                                <span class="block-projects-slider__cta" aria-hidden="true">
                                    <?php echo $cta_text; ?>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" stroke-width="2"
                                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                        <polyline points="12 5 19 12 12 19"/>
                                    </svg>
                                </span>
                            </div>

                        </a>
                    </div>
                    <?php $slide_index++; ?>
                <?php endwhile; ?>
                <?php wp_reset_postdata(); ?>
            </div>

            <button type="button" class="button-prev block-projects-slider__nav block-projects-slider__nav--prev"
                    aria-label="<?php esc_attr_e( 'Dự án trước', 'laca' ); ?>">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                     fill="none" stroke="#fff" stroke-width="1.5"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6"/>
                </svg>
            </button>
            <button type="button" class="button-next block-projects-slider__nav block-projects-slider__nav--next"
                    aria-label="<?php esc_attr_e( 'Dự án tiếp theo', 'laca' ); ?>">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                     fill="none" stroke="#fff" stroke-width="1.5"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </button>
            
        </div>

    <?php else : ?>
        <p class="block-projects-slider__empty">
            <?php esc_html_e( 'Chưa có dự án nào.', 'laca' ); ?>
        </p>
    <?php endif; ?>

</section>

<?php
// ── Inline JS init (Vanilla marquee carousel, no Swiper) ───────────────────
$js = sprintf( '
(function () {
    function init_%1$s() {
        var viewport = document.getElementById("%2$s");
        if (!viewport) return;
        var track = viewport.querySelector(".block-projects-slider__track");
        if (!track) return;
        var sourceSlides = Array.prototype.slice.call(track.querySelectorAll(".block-projects-slider__slide"));
        if (sourceSlides.length < 2) return;

        var nextBtn = viewport.querySelector(".button-next");
        var prevBtn = viewport.querySelector(".button-prev");
        var hovering = false;
        var offset = 0;
        var setWidth = 0;
        var baseSpeed = parseFloat(track.dataset.speed || "52");
        var running = true;
        var inView = true;
        var rafId = null;
        var lastTs = performance.now();

        function cloneSet(slides, marker) {
            var frag = document.createDocumentFragment();
            slides.forEach(function(slide) {
                var clone = slide.cloneNode(true);
                clone.dataset.cloneSet = marker;
                frag.appendChild(clone);
            });
            return frag;
        }

        sourceSlides.forEach(function(slide) {
            slide.dataset.cloneSet = "base";
        });
        track.insertBefore(cloneSet(sourceSlides, "prepend"), track.firstChild);
        track.appendChild(cloneSet(sourceSlides, "append"));

        function baseSlides() {
            return Array.prototype.slice.call(track.querySelectorAll(".block-projects-slider__slide[data-clone-set=\"base\"]"));
        }

        function allSlides() {
            return Array.prototype.slice.call(track.querySelectorAll(".block-projects-slider__slide"));
        }

        function computeSetWidth() {
            var base = baseSlides();
            setWidth = base.reduce(function(total, slide) {
                return total + slide.getBoundingClientRect().width;
            }, 0);
            if (!setWidth) return;
            offset = setWidth;
            applyTransform();
            updateActiveSlide();
        }

        function applyTransform() {
            track.style.transform = "translate3d(" + (-offset) + "px,0,0)";
        }

        function normalizeOffset() {
            if (!setWidth) return;
            if (offset >= setWidth * 2) offset -= setWidth;
            if (offset < setWidth) offset += setWidth;
        }

        function updateActiveSlide() {
            var slides = allSlides();
            if (!slides.length) return;
            var viewportRect = viewport.getBoundingClientRect();
            var centerX = viewportRect.left + viewportRect.width / 2;
            var minDist = Infinity;
            var active = null;

            slides.forEach(function(slide) {
                var rect = slide.getBoundingClientRect();
                var slideCenter = rect.left + rect.width / 2;
                var dist = Math.abs(slideCenter - centerX);
                if (dist < minDist) {
                    minDist = dist;
                    active = slide;
                }
            });

            slides.forEach(function(slide) {
                slide.classList.remove("is-active");
            });
            if (active) {
                active.classList.add("is-active");
            }
        }

        function step(ts) {
            var dt = (ts - lastTs) / 1000;
            lastTs = ts;
            if (running && !hovering && inView) {
                offset += baseSpeed * dt;
                normalizeOffset();
                applyTransform();
            }
            updateActiveSlide();
            rafId = requestAnimationFrame(step);
        }

        function freezeNow() {
            hovering = true;
        }

        function resumeNow() {
            hovering = false;
            lastTs = performance.now();
        }

        function findActiveOriginIndex() {
            var active = track.querySelector(".block-projects-slider__slide.is-active");
            if (!active) return 0;
            return parseInt(active.dataset.originIndex || "0", 10);
        }

        function findBaseSlideByIndex(index) {
            return track.querySelector(".block-projects-slider__slide[data-clone-set=\"base\"][data-origin-index=\"" + index + "\"]");
        }

        function animateToTarget(targetOffset, duration, onDone) {
            var startOffset = offset;
            var delta = targetOffset - startOffset;
            var startTime = performance.now();

            function easeOutCubic(t) {
                return 1 - Math.pow(1 - t, 3);
            }

            function tick(now) {
                var t = Math.min(1, (now - startTime) / duration);
                offset = startOffset + delta * easeOutCubic(t);
                normalizeOffset();
                applyTransform();
                updateActiveSlide();
                if (t < 1) {
                    requestAnimationFrame(tick);
                } else if (typeof onDone === "function") {
                    onDone();
                }
            }

            requestAnimationFrame(tick);
        }

        function navGo(direction) {
            if (!setWidth) return;
            freezeNow();
            var current = findActiveOriginIndex();
            var total = sourceSlides.length;
            var target = direction === "next" ? (current + 1) %% total : (current - 1 + total) %% total;
            var targetSlide = findBaseSlideByIndex(target);
            if (!targetSlide) return;

            var viewportRect = viewport.getBoundingClientRect();
            var centerX = viewportRect.left + viewportRect.width / 2;
            var targetRect = targetSlide.getBoundingClientRect();
            var targetCenter = targetRect.left + targetRect.width / 2;
            var dx = targetCenter - centerX;

            animateToTarget(offset + dx, 320, function() {
                if (!hovering) resumeNow();
            });
        }

        function bindNav(btn, dir) {
            if (!btn) return;
            btn.addEventListener("click", function(e){
                e.preventDefault();
                e.stopPropagation();
                navGo(dir);
            }, true);
        }
        bindNav(nextBtn, "next");
        bindNav(prevBtn, "prev");

        if (%3$s) {
            var section = viewport.closest("section");
            if (section) {
                section.addEventListener("mouseenter", function () {
                    freezeNow();
                });
                section.addEventListener("mouseleave", function () {
                    resumeNow();
                });
            }
        }

        window.addEventListener("resize", function() {
            computeSetWidth();
        }, { passive: true });

        var imgs = track.querySelectorAll("img");
        imgs.forEach(function(img) {
            if (!img.complete) {
                img.addEventListener("load", computeSetWidth, { once: true });
            }
        });

        window.addEventListener("load", function() {
            computeSetWidth();
            updateActiveSlide();
        }, { once: true });

        var io = new IntersectionObserver(function(entries) {
            if (!entries.length) return;
            inView = entries[0].isIntersecting;
            if (inView) {
                updateActiveSlide();
            }
        }, { threshold: 0.2 });
        io.observe(viewport);

        computeSetWidth();
        requestAnimationFrame(updateActiveSlide);
        setTimeout(updateActiveSlide, 120);
        lastTs = performance.now();
        rafId = requestAnimationFrame(step);
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init_%1$s);
    } else {
        init_%1$s();
    }
})();',
    $instance,
    $swiper_id,
    $pause_hover ? 'true' : 'false'
);
wp_add_inline_script( 'theme-js-bundle', $js );

// ── Popup Contact Form (scroll-triggered) ──────────────────────────────────
if ( $show_popup ) :
?>
<div class="pslider-popup" id="<?php echo esc_attr( $popup_id ); ?>" hidden>
    <div class="pslider-popup__backdrop"></div>
    <div class="pslider-popup__panel">
        <button class="pslider-popup__close" aria-label="<?php esc_attr_e( 'Đóng', 'laca' ); ?>">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>

        <h3 class="pslider-popup__title"><?php esc_html_e( 'Nhận Tư Vấn Ngay', 'laca' ); ?></h3>

        <form class="pslider-popup__form" method="POST"
              action="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>"
              novalidate data-pslider-form>
            <?php wp_nonce_field( 'laca_footer_contact_nonce', 'nonce' ); ?>
            <input type="hidden" name="action" value="laca_footer_contact_submit">

            <div class="pslider-popup__field">
                <input type="text" name="tf_address" class="pslider-popup__input"
                       placeholder="<?php esc_attr_e( 'Địa chỉ xây dựng', 'laca' ); ?>" required>
            </div>
            <div class="pslider-popup__field">
                <input type="text" name="tf_scale" class="pslider-popup__input"
                       placeholder="<?php esc_attr_e( 'Quy mô xây dựng', 'laca' ); ?>" required>
            </div>
            <div class="pslider-popup__field">
                <select name="tf_budget" class="pslider-popup__select" required>
                    <option value=""><?php esc_html_e( 'Ngân sách', 'laca' ); ?></option>
                    <?php foreach ( $popup_budget as $opt ) :
                        if ( empty( $opt ) ) continue; ?>
                        <option value="<?php echo esc_attr( $opt ); ?>"><?php echo esc_html( $opt ); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="pslider-popup__field">
                <input type="text" name="tf_name" class="pslider-popup__input"
                       placeholder="<?php esc_attr_e( 'Họ và tên', 'laca' ); ?>" required>
            </div>
            <div class="pslider-popup__field">
                <input type="tel" name="tf_phone" class="pslider-popup__input"
                       placeholder="<?php esc_attr_e( 'Số điện thoại liên hệ', 'laca' ); ?>" required>
            </div>

            <button type="submit" class="pslider-popup__btn">
                <span class="pslider-popup__btn-text"><?php echo $popup_btn_text; ?></span>
                <span class="pslider-popup__btn-loader" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="31.42" stroke-dashoffset="10"/></svg>
                </span>
            </button>

            <div class="pslider-popup__msg" role="alert" hidden></div>
        </form>
    </div>
</div>
<?php
    $popup_js = sprintf( '
(function(){
    var popup = document.getElementById("%1$s");
    if (!popup) return;
    var KEY = "pslider_popup_shown_%2$d";
    var section = document.querySelector(\'[data-popup-id="%1$s"]\');
    if (!section) return;

    /* ── Show / Hide helpers ── */
    function showPopup() {
        popup.removeAttribute("hidden");
        popup.offsetHeight;
        popup.classList.add("pslider-popup--visible");
        document.body.style.overflow = "hidden";
    }
    function hidePopup() {
        popup.classList.remove("pslider-popup--visible");
        document.body.style.overflow = "";
        setTimeout(function(){ popup.setAttribute("hidden",""); }, 350);
    }

    /* ── Close handlers ── */
    popup.querySelector(".pslider-popup__close").addEventListener("click", hidePopup);
    popup.querySelector(".pslider-popup__backdrop").addEventListener("click", hidePopup);

    /* ── IntersectionObserver: trigger once per session, only after user scrolls ── */
    if (sessionStorage.getItem(KEY)) return;
    var observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
            observer.disconnect();
            sessionStorage.setItem(KEY, "1");
            setTimeout(showPopup, 500);
        }
    }, { threshold: 0.3 });
    /* Wait for first scroll before observing — prevents firing on page load */
    var scrollHandler = function() {
        window.removeEventListener("scroll", scrollHandler);
        if (section) observer.observe(section);
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });

    /* ── Form AJAX submit ── */
    var form = popup.querySelector("[data-pslider-form]");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            var btn = form.querySelector(".pslider-popup__btn");
            var msg = form.querySelector(".pslider-popup__msg");
            btn.classList.add("pslider-popup__btn--loading");
            btn.disabled = true;
            var fd = new FormData(form);
            fetch(form.action, { method: "POST", body: fd, credentials: "same-origin" })
            .then(function(r){ return r.json(); })
            .then(function(d){
                msg.removeAttribute("hidden");
                if (d.success) {
                    msg.textContent = d.data || "Gửi thành công!";
                    msg.className = "pslider-popup__msg pslider-popup__msg--ok";
                    form.reset();
                    setTimeout(hidePopup, 1500);
                } else {
                    msg.textContent = d.data || "Có lỗi, vui lòng thử lại.";
                    msg.className = "pslider-popup__msg pslider-popup__msg--err";
                }
            })
            .catch(function(){
                msg.removeAttribute("hidden");
                msg.textContent = "Lỗi kết nối.";
                msg.className = "pslider-popup__msg pslider-popup__msg--err";
            })
            .finally(function(){
                btn.classList.remove("pslider-popup__btn--loading");
                btn.disabled = false;
            });
        });
    }
})();',
        $popup_id,
        $instance
    );
    wp_add_inline_script( 'swiper', $popup_js );
endif;
