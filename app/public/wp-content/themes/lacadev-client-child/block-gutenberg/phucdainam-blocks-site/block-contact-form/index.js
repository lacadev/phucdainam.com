import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { createElement, Fragment } from '@wordpress/element';

registerBlockType('lacadev/contact-form-block', {
    edit: (props) => {
        const { attributes, setAttributes } = props;

        return createElement(
            Fragment,
            null,
            createElement(
                InspectorControls,
                null,
                createElement(
                    PanelBody,
                    { title: __('Cài đặt', 'laca'), initialOpen: true },
                    createElement(TextControl, {
                        label: __('Form ID', 'laca'),
                        value: attributes.formId,
                        onChange: (val) => setAttributes({ formId: parseInt(val) || 0 })
                    }),
                    createElement(TextControl, {
                        label: __('Tiêu đề', 'laca'),
                        value: attributes.heading,
                        onChange: (val) => setAttributes({ heading: val })
                    }),
                    createElement(TextControl, {
                        label: __('Mô tả', 'laca'),
                        value: attributes.subheading,
                        onChange: (val) => setAttributes({ subheading: val })
                    })
                )
            ),
            createElement(
                'div',
                { className: 'wp-block-lacadev-contact-form' },
                createElement(ServerSideRender, {
                    block: 'lacadev/contact-form-block',
                    attributes: attributes
                })
            )
        );
    },
    save: () => null,
});
