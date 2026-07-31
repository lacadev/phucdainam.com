import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	RangeControl,
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
				kicker={ __( 'Team Carousel', 'laca' ) }
				title={
					attributes.sectionTitle ||
					__( 'Đội ngũ của chúng tôi', 'laca' )
				}
				columns={ 3 }
			/>
		);
	}

	const {
		sectionTitle,
		slides,
		loop,
		autoplay,
		autoplayDelay,
		spaceBetween,
		inactiveScale,

		bgColor,
		bgOpacity,
	} = attributes;

	const blockProps = useBlockProps( {
		style: { background: bgColor || '#ffffff' },
	} );

	/* ── Media picker ── */
	const openMedia = ( index ) => {
		if ( ! window.wp || ! window.wp.media ) {
			return;
		}
		const frame = window.wp.media( {
			title: __( 'Chọn ảnh', 'laca' ),
			button: { text: __( 'Dùng ảnh này', 'laca' ) },
			multiple: false,
		} );
		frame.on( 'select', () => {
			const att = frame.state().get( 'selection' ).first().toJSON();
			const next = slides.map( ( item, i ) =>
				i === index
					? {
							...item,
							imageId: att.id,
							imageUrl: att.url,
							imageAlt: att.alt || '',
					  }
					: item
			);
			setAttributes( { slides: next } );
		} );
		frame.open();
	};

	/* ── Slide helpers ── */
	const updateSlide = ( index, key, value ) => {
		const next = slides.map( ( item, i ) =>
			i === index ? { ...item, [ key ]: value } : item
		);
		setAttributes( { slides: next } );
	};
	const addSlide = () =>
		setAttributes( {
			slides: [ ...slides, { imageId: 0, imageUrl: '', imageAlt: '' } ],
		} );
	const removeSlide = ( index ) =>
		setAttributes( { slides: slides.filter( ( _, i ) => i !== index ) } );

	return (
		<>
			<InspectorControls>
				{ /* ── Cài đặt chung ── */ }
				<PanelBody
					title={ __( 'Cài đặt chung', 'laca' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Tiêu đề section', 'laca' ) }
						value={ sectionTitle }
						onChange={ ( v ) =>
							setAttributes( { sectionTitle: v } )
						}
						placeholder={ __( 'Để trống nếu không cần', 'laca' ) }
					/>
					<TextControl
						type="color"
						label={ __( 'Màu nền section', 'laca' ) }
						value={ bgColor || '#ffffff' }
						onChange={ ( v ) => setAttributes( { bgColor: v } ) }
					/>
				</PanelBody>

				{ /* ── Swiper config ── */ }
				<PanelBody
					title={ __( 'Cấu hình Swiper', 'laca' ) }
					initialOpen={ true }
				>
					<ToggleControl
						label={ __( 'Loop (lặp vô hạn)', 'laca' ) }
						checked={ loop }
						onChange={ ( v ) => setAttributes( { loop: v } ) }
					/>
					<ToggleControl
						label={ __( 'Tự động chạy', 'laca' ) }
						checked={ autoplay }
						onChange={ ( v ) => setAttributes( { autoplay: v } ) }
					/>
					{ autoplay && (
						<RangeControl
							label={ __( 'Delay autoplay (ms)', 'laca' ) }
							value={ autoplayDelay }
							onChange={ ( v ) =>
								setAttributes( { autoplayDelay: v } )
							}
							min={ 1000 }
							max={ 8000 }
							step={ 500 }
						/>
					) }
					<RangeControl
						label={ __( 'Khoảng cách slide (px)', 'laca' ) }
						value={ spaceBetween }
						onChange={ ( v ) =>
							setAttributes( { spaceBetween: v } )
						}
						min={ 0 }
						max={ 80 }
						step={ 4 }
					/>
					<RangeControl
						label={ __( 'Tỉ lệ slide không active (%)', 'laca' ) }
						value={ inactiveScale }
						onChange={ ( v ) =>
							setAttributes( { inactiveScale: v } )
						}
						min={ 40 }
						max={ 95 }
						step={ 5 }
						help={ __(
							'Slide không active sẽ thu nhỏ xuống tỉ lệ này so với slide active',
							'laca'
						) }
					/>
				</PanelBody>

				{ /* ── Danh sách slide ── */ }
				<PanelBody
					title={ __( 'Danh sách slide', 'laca' ) }
					initialOpen={ true }
				>
					{ slides.map( ( slide, index ) => (
						<div
							key={ index }
							style={ {
								borderBottom: '1px solid #e0e0e0',
								marginBottom: '1.4rem',
								paddingBottom: '1.4rem',
							} }
						>
							<strong
								style={ {
									display: 'block',
									marginBottom: '0.6rem',
								} }
							>
								{ __( 'Slide', 'laca' ) } { index + 1 }
							</strong>
							{ slide.imageUrl && (
								<img
									src={ slide.imageUrl }
									alt={ slide.imageAlt }
									style={ {
										width: '100%',
										borderRadius: '8px',
										marginBottom: '0.6rem',
										aspectRatio: '3/4',
										objectFit: 'cover',
										display: 'block',
									} }
								/>
							) }
							<Button
								variant={
									slide.imageUrl ? 'secondary' : 'primary'
								}
								onClick={ () => openMedia( index ) }
								style={ {
									marginBottom: '0.4rem',
									display: 'block',
								} }
							>
								{ slide.imageUrl
									? __( 'Đổi ảnh', 'laca' )
									: __( 'Chọn ảnh', 'laca' ) }
							</Button>
							{ slide.imageUrl && (
								<Button
									isDestructive
									variant="secondary"
									size="small"
									onClick={ () => {
										updateSlide( index, 'imageId', 0 );
										updateSlide( index, 'imageUrl', '' );
										updateSlide( index, 'imageAlt', '' );
									} }
									style={ {
										marginBottom: '0.4rem',
										display: 'block',
									} }
								>
									{ __( 'Xoá ảnh', 'laca' ) }
								</Button>
							) }
							<Button
								isDestructive
								variant="secondary"
								size="small"
								onClick={ () => removeSlide( index ) }
								style={ { marginTop: '0.4rem' } }
							>
								{ __( 'Xoá slide này', 'laca' ) }
							</Button>
						</div>
					) ) }
					<Button variant="primary" onClick={ addSlide }>
						{ __( '+ Thêm slide', 'laca' ) }
					</Button>
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
					block="lacadev/team-carousel-block"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}
