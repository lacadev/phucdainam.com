<?php
/**
 * Child Theme Options
 *
 * Add custom fields or tabs to the main theme options page.
 *
 * @package LacaDevClientChild
 */

use Carbon_Fields\Field\Field;

add_action('lacadev/theme_options/register_child_tabs', function ($optionsPage) {
    if (!$optionsPage) {
        return;
    }

    $optionsPage->add_tab(__('Tuỳ chỉnh giao diện (Child)', 'laca'), [
        Field::make('textarea', 'footer_contact_budget_options', __('Ngân sách form liên hệ footer', 'laca'))
        ->set_width(50)
            ->set_help_text(__('Mỗi dòng là một lựa chọn ngân sách.', 'laca'))
            ->set_default_value("Dưới 1 tỷ\n1 - 3 tỷ\n3 - 5 tỷ\n5 - 10 tỷ\nTrên 10 tỷ"),
        Field::make('image', 'footer_contact_image', __('Hình ảnh form liên hệ footer', 'laca'))
        ->set_width(50)
            ->set_help_text(__('Ảnh hiển thị bên phải form liên hệ ở footer.', 'laca')),
    ]);

    $optionsPage->add_tab(__('Footer menu(Child)', 'laca'), [
        //Menu Về chúng tôi
        Field::make('html', 'about_footer', __('', 'laca'))
			->set_html('----<i> MENU VỀ CHÚNG TÔI </i>----'),
        Field::make('text', 'about_footer_title' . currentLanguage(), __('', 'laca'))
			->set_attribute('placeholder', 'Tiêu đề menu'),
        Field::make('text', 'company' . currentLanguage(), __('', 'laca'))->set_width(50)
			->set_attribute('placeholder', 'Company | Công ty'),
        

        // Menu dịch vụ
        Field::make('html', 'service_footer', __('', 'laca'))
			->set_html('----<i> MENU DỊCH VỤ </i>----'),
        Field::make('text', 'service_footer_title' . currentLanguage(), __('', 'laca'))
			->set_attribute('placeholder', 'Tiêu đề menu'),
        Field::make('complex', 'service_footer_items' . currentLanguage(), __('', 'laca'))
			->set_layout('tabbed-horizontal')
			->add_fields([
				Field::make('text', 'name', __('', 'laca'))->set_width(50)
				->set_attribute('placeholder', 'Tên dịch vụ'),
				Field::make('text', 'url', __('', 'laca'))->set_width(50)
				->set_attribute('placeholder', 'URL'),
			])->set_header_template('<% if (name) { %><%- name %><% } %>'),

        //Menu chính sách
        Field::make('html', 'policy_footer', __('', 'laca'))
			->set_html('----<i> MENU CHÍNH SÁCH </i>----'),
        Field::make('text', 'policy_footer_title' . currentLanguage(), __('', 'laca'))
			->set_attribute('placeholder', 'Tiêu đề menu'),
        Field::make('complex', 'policy_footer_items' . currentLanguage(), __('', 'laca'))
			->set_layout('tabbed-horizontal')
			->add_fields([
				Field::make('text', 'name', __('', 'laca'))->set_width(50)
				->set_attribute('placeholder', 'Tên chính sách'),
				Field::make('text', 'url', __('', 'laca'))->set_width(50)
				->set_attribute('placeholder', 'URL'),
			])->set_header_template('<% if (name) { %><%- name %><% } %>'),

        //Menu Showroom & Nhà máy
        Field::make('html', 'showroom_factory_footer', __('', 'laca'))
			->set_html('----<i> MENU SHOWROOM & NHÀ MÁY </i>----'),
        Field::make('text', 'showroom_factory_footer_title' . currentLanguage(), __('', 'laca'))
			->set_attribute('placeholder', 'Tiêu đề menu'),

        //Menu Dự án tiêu biểu
        Field::make('html', 'project_footer', __('', 'laca'))
			->set_html('----<i> MENU DỰ ÁN TIÊU BIỂU </i>----'),
        Field::make('text', 'project_footer_title' . currentLanguage(), __('', 'laca'))
			->set_attribute('placeholder', 'Tiêu đề menu'),
        Field::make('complex', 'project_footer_items' . currentLanguage(), __('', 'laca'))
			->set_layout('tabbed-horizontal')
			->add_fields([
				Field::make('text', 'name', __('', 'laca'))->set_width(50)
				->set_attribute('placeholder', 'Tên dự án'),
				Field::make('text', 'url', __('', 'laca'))->set_width(50)
				->set_attribute('placeholder', 'URL'),
			])->set_header_template('<% if (name) { %><%- name %><% } %>'),

        //Menu đối tác
        Field::make('html', 'partner_footer', __('', 'laca'))
			->set_html('----<i> MENU ĐỐI TÁC </i>----'),
        Field::make('text', 'partner_footer_title' . currentLanguage(), __('', 'laca'))
			->set_attribute('placeholder', 'Tiêu đề menu'),
        Field::make('complex', 'partner_footer_items' . currentLanguage(), __('', 'laca'))
			->set_layout('tabbed-horizontal')
			->add_fields([
				Field::make('text', 'name', __('', 'laca'))->set_width(50)
				->set_attribute('placeholder', 'Tên đối tác'),
				Field::make('text', 'url', __('', 'laca'))->set_width(50)
				->set_attribute('placeholder', 'URL'),
			])->set_header_template('<% if (name) { %><%- name %><% } %>'),
    ]);
});
