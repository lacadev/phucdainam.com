import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    ColorPicker,
    RangeControl
} from '@wordpress/components';
import { useInserterPreview, BlockPreviewMock } from '../utils/preview';

export default function Edit( { attributes, setAttributes } ) {
    const isPreview = useInserterPreview( attributes );
    if ( isPreview ) {
        return (
            <BlockPreviewMock
                kicker={ __( 'Shortcode Widget', 'laca' ) }
                title={ attributes.heading || __( 'Widget công cụ', 'laca' ) }
                columns={ 2 }
            />
        );
    }

    const { heading, shortcode1, shortcode2 , bgColor, bgOpacity } = attributes;
    const blockProps = useBlockProps();

    const colStyle = {
        border: '2px dashed #b9c3cc',
        borderRadius: '4px',
        padding: '1.6rem',
        background: '#f8fafc',
        flex: '1 1 0',
        minWidth: 0,
    };
    const codeStyle = { fontSize: '1.2rem', color: '#555' };

    return (
        <>
            <InspectorControls>
                <PanelBody title={ __( 'Cài đặt', 'laca' ) } initialOpen={ true }>
                    <TextControl
                        label={ __( 'Tiêu đề block', 'laca' ) }
                        value={ heading }
                        onChange={ ( v ) => setAttributes( { heading: v } ) }
                        placeholder={ __( 'VD: Nhận tư vấn trực tiếp từ KTS', 'laca' ) }
                    />
                    <TextControl
                        label={ __( 'Shortcode 1', 'laca' ) }
                        value={ shortcode1 }
                        onChange={ ( v ) => setAttributes( { shortcode1: v } ) }
                        placeholder="[wp_tuoixaydung]"
                    />
                    <TextControl
                        label={ __( 'Shortcode 2', 'laca' ) }
                        value={ shortcode2 }
                        onChange={ ( v ) => setAttributes( { shortcode2: v } ) }
                        placeholder="[wp_xemhuongnha]"
                    />
                </PanelBody>
            
                { /* Panel 3: Giao diện */ }
                <PanelBody title={ __( 'Giao diện', 'laca' ) } initialOpen={ false }>
                    <p style={ { fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' } }>
                        { __( 'Màu nền section', 'laca' ) }
                    </p>
                    <ColorPicker
                        color={ bgColor }
                        onChange={ ( v ) => setAttributes( { bgColor: v } ) }
                        enableAlpha={ false }
                        defaultValue="#0f0f0f"
                    />
                    <RangeControl
                        label={ __( 'Độ mờ nền (%) — 0 = trong suốt', 'laca' ) }
                        value={ bgOpacity }
                        min={ 0 }
                        max={ 100 }
                        step={ 5 }
                        onChange={ ( v ) => setAttributes( { bgOpacity: v } ) }
                    />
                </PanelBody>

            </InspectorControls>

            <div { ...blockProps }>
                { heading && (
                    <div className="block-shortcode-widget__header">
                        <h2 className="block-shortcode-widget__heading">{ heading }</h2>
                    </div>
                ) }
                <div style={ { display: 'flex', gap: '2rem' } }>
                    <div style={ colStyle }>
                        <code style={ codeStyle }>{ shortcode1 || '[shortcode 1]' }</code>
                    </div>
                    <div style={ colStyle }>
                        <code style={ codeStyle }>{ shortcode2 || '[shortcode 2]' }</code>
                    </div>
                </div>
            </div>
        </>
    );
}
