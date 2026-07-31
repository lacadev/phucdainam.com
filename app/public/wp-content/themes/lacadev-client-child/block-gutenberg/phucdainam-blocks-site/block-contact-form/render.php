<?php
/**
 * Render Contact Form Block
 */

$form_id = $attributes['formId'] ?? 0;
$heading = $attributes['heading'] ?? '';
$subheading = $attributes['subheading'] ?? '';

if (!$form_id) {
    if (is_admin()) {
        echo '<div style="padding: 20px; border: 1px dashed #ccc;">Vui lòng chọn Form ID trong phần cài đặt Block.</div>';
    }
    return;
}

?>
<section class="section-contact-block">
    <div class="container">
        <?php if ($heading || $subheading) : ?>
            <div class="contact-header">
                <?php if ($heading) : ?>
                    <h2 class="contact-title"><?php echo esc_html($heading); ?></h2>
                <?php endif; ?>
                <?php if ($subheading) : ?>
                    <p class="contact-desc"><?php echo esc_html($subheading); ?></p>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <div class="contact-form-wrapper">
            <?php echo do_shortcode('[laca_contact_form id="' . $form_id . '"]'); ?>
        </div>
    </div>
</section>
