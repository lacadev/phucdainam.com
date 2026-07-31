import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	PanelRow,
	TextControl,
	RangeControl,
	SelectControl,
	Button,
	ColorPicker,
} from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { useInserterPreview, BlockPreviewMock } from '../utils/preview';

export default function Edit( { attributes, setAttributes } ) {
	const isPreview = useInserterPreview( attributes );
	if ( isPreview ) {
		return (
			<BlockPreviewMock
				kicker={ __( 'Stats Counter', 'laca' ) }
				title={ attributes.heading || __( 'Thống kê nổi bật', 'laca' ) }
				columns={ 3 }
			/>
		);
	}

	const {
		items,

		numberColor,
		labelColor,
		paddingTop,
		paddingBottom,
		countUpDuration,
		countUpTrigger,
		bgColor,
		bgOpacity,
	} = attributes;

	const blockProps = useBlockProps( {
		className: 'wp-block-lacadev-stats-counter-block',
	} );

	const updateItem = ( index, key, value ) => {
		const newItems = items.map( ( item, i ) =>
			i === index ? { ...item, [ key ]: value } : item
		);
		setAttributes( { items: newItems } );
	};

	const addItem = () => {
		setAttributes( {
			items: [ ...items, { number: '0', suffix: '+', label: 'LABEL' } ],
		} );
	};

	const removeItem = ( index ) => {
		setAttributes( { items: items.filter( ( _, i ) => i !== index ) } );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Danh sách chỉ số', 'laca' ) }
					initialOpen={ true }
				>
					{ items.map( ( item, index ) => (
						<div
							key={ index }
							style={ {
								borderBottom: '1px solid #ddd',
								marginBottom: 12,
								paddingBottom: 12,
							} }
						>
							<PanelRow>
								<TextControl
									label={ __( 'Số', 'laca' ) }
									value={ item.number }
									onChange={ ( v ) =>
										updateItem( index, 'number', v )
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextControl
									label={ __( 'Hậu tố', 'laca' ) }
									value={ item.suffix }
									onChange={ ( v ) =>
										updateItem( index, 'suffix', v )
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextControl
									label={ __( 'Label', 'laca' ) }
									value={ item.label }
									onChange={ ( v ) =>
										updateItem( index, 'label', v )
									}
								/>
							</PanelRow>
							<Button
								isDestructive
								variant="secondary"
								onClick={ () => removeItem( index ) }
								style={ { marginTop: 4 } }
							>
								{ __( 'Xóa', 'laca' ) }
							</Button>
						</div>
					) ) }
					<Button variant="primary" onClick={ addItem }>
						{ __( '+ Thêm chỉ số', 'laca' ) }
					</Button>
				</PanelBody>

				<PanelBody
					title={ __( 'Animation', 'laca' ) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __( 'Thời gian count-up (ms)', 'laca' ) }
						value={ countUpDuration }
						onChange={ ( v ) =>
							setAttributes( { countUpDuration: v } )
						}
						min={ 500 }
						max={ 5000 }
						step={ 100 }
					/>
					<SelectControl
						label={ __( 'Trigger', 'laca' ) }
						value={ countUpTrigger }
						options={ [
							{
								label: 'Viewport (scroll vào)',
								value: 'viewport',
							},
							{ label: 'Ngay lập tức', value: 'immediate' },
						] }
						onChange={ ( v ) =>
							setAttributes( { countUpTrigger: v } )
						}
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Style', 'laca' ) }
					initialOpen={ false }
				>
					<p style={ { marginBottom: 4 } }>
						{ __( 'Màu nền', 'laca' ) }
					</p>
					<ColorPicker
						color={ bgColor }
						onChange={ ( v ) => setAttributes( { bgColor: v } ) }
						enableAlpha={ false }
					/>
					<p style={ { marginTop: 12, marginBottom: 4 } }>
						{ __( 'Màu số', 'laca' ) }
					</p>
					<ColorPicker
						color={ numberColor }
						onChange={ ( v ) =>
							setAttributes( { numberColor: v } )
						}
						enableAlpha={ false }
					/>
					<p style={ { marginTop: 12, marginBottom: 4 } }>
						{ __( 'Màu label', 'laca' ) }
					</p>
					<ColorPicker
						color={ labelColor }
						onChange={ ( v ) => setAttributes( { labelColor: v } ) }
						enableAlpha={ false }
					/>
					<RangeControl
						label={ __( 'Padding trên (px)', 'laca' ) }
						value={ paddingTop }
						onChange={ ( v ) => setAttributes( { paddingTop: v } ) }
						min={ 0 }
						max={ 200 }
					/>
					<RangeControl
						label={ __( 'Padding dưới (px)', 'laca' ) }
						value={ paddingBottom }
						onChange={ ( v ) =>
							setAttributes( { paddingBottom: v } )
						}
						min={ 0 }
						max={ 200 }
					/>
				</PanelBody>

				{ /* Panel 3: Giao diện */ }
				<PanelBody
					title={ __( 'Giao diện', 'laca' ) }
					initialOpen={ false }
				>
					<p
						style={ {
							fontSize: '0.8rem',
							fontWeight: 600,
							marginBottom: '0.5rem',
						} }
					>
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
			<div { ...useBlockProps() }>
				<ServerSideRender
					block="lacadev/stats-counter-block"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}
