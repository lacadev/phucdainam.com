import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	PanelBody,
	PanelRow,
	TextControl,
	SelectControl,
	Button,
	ColorPicker,
	RangeControl,
} from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { useInserterPreview, BlockPreviewMock } from '../utils/preview';

const LAYOUT_OPTIONS = [
	{ label: 'Ảnh lớn trái + grid phải', value: 'left-main-right-grid' },
	{ label: 'Title trên + 3 cột', value: 'top-title-3cols' },
	{ label: 'Grid trái + ảnh lớn phải', value: 'right-main-left-grid' },
];

function ImagePicker( { imageUrl, imageId, onSelect, label } ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				onSelect={ onSelect }
				allowedTypes={ [ 'image' ] }
				value={ imageId }
				render={ ( { open } ) => (
					<div style={ { marginBottom: 8 } }>
						{ label && (
							<p
								style={ {
									fontSize: 11,
									color: '#888',
									marginBottom: 4,
								} }
							>
								{ label }
							</p>
						) }
						{ imageUrl && (
							<img
								src={ imageUrl }
								alt=""
								style={ {
									width: '100%',
									maxHeight: 80,
									objectFit: 'cover',
									marginBottom: 4,
									borderRadius: 4,
								} }
							/>
						) }
						<Button
							variant="secondary"
							onClick={ open }
							style={ { fontSize: 11 } }
						>
							{ imageUrl
								? __( 'Đổi ảnh', 'laca' )
								: __( 'Chọn ảnh', 'laca' ) }
						</Button>
					</div>
				) }
			/>
		</MediaUploadCheck>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const isPreview = useInserterPreview( attributes );
	if ( isPreview ) {
		return (
			<BlockPreviewMock
				kicker={ __( 'Services Grid', 'laca' ) }
				title={ attributes.sectionTitle || __( 'DỊCH VỤ', 'laca' ) }
				columns={ 3 }
			/>
		);
	}

	const { serviceGroups, bgColor, bgOpacity } = attributes;

	const blockProps = useBlockProps( {
		className: 'wp-block-lacadev-services-grid-block',
	} );

	const updateGroup = ( gIndex, key, value ) => {
		const updated = serviceGroups.map( ( g, i ) =>
			i === gIndex ? { ...g, [ key ]: value } : g
		);
		setAttributes( { serviceGroups: updated } );
	};

	const updateSubImage = ( gIndex, sIndex, key, value ) => {
		const group = serviceGroups[ gIndex ];
		const newSubs = ( group.subImages || [] ).map( ( s, i ) =>
			i === sIndex ? { ...s, [ key ]: value } : s
		);
		updateGroup( gIndex, 'subImages', newSubs );
	};

	const updateItem = ( gIndex, iIndex, key, value ) => {
		const group = serviceGroups[ gIndex ];
		const newItems = ( group.items || [] ).map( ( item, i ) =>
			i === iIndex ? { ...item, [ key ]: value } : item
		);
		updateGroup( gIndex, 'items', newItems );
	};

	const addGroup = () => {
		setAttributes( {
			serviceGroups: [
				...serviceGroups,
				{
					layout: 'left-main-right-grid',
					title: 'DỊCH VỤ MỚI',
					mainImageId: 0,
					mainImageUrl: '',
					subImages: [
						{ imageId: 0, imageUrl: '' },
						{ imageId: 0, imageUrl: '' },
					],
					link: '',
				},
			],
		} );
	};

	const removeGroup = ( gIndex ) => {
		setAttributes( {
			serviceGroups: serviceGroups.filter( ( _, i ) => i !== gIndex ),
		} );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Chung', 'laca' ) } initialOpen={ true }>
					<TextControl
						label={ __( 'Tiêu đề Section', 'laca' ) }
						value={ attributes.sectionTitle || '' }
						onChange={ ( v ) =>
							setAttributes( { sectionTitle: v } )
						}
					/>
					<p style={ { marginBottom: 4 } }>
						{ __( 'Màu nền', 'laca' ) }
					</p>
					<ColorPicker
						color={ bgColor }
						onChange={ ( v ) => setAttributes( { bgColor: v } ) }
						enableAlpha={ false }
					/>
				</PanelBody>

				{ serviceGroups.map( ( group, gIndex ) => (
					<PanelBody
						key={ gIndex }
						title={ `${ __( 'Nhóm', 'laca' ) } ${ gIndex + 1 }: ${
							group.title || ''
						}` }
						initialOpen={ gIndex === 0 }
					>
						<SelectControl
							label={ __( 'Layout', 'laca' ) }
							value={ group.layout }
							options={ LAYOUT_OPTIONS }
							onChange={ ( v ) =>
								updateGroup( gIndex, 'layout', v )
							}
						/>
						<TextControl
							label={ __( 'Tiêu đề', 'laca' ) }
							value={ group.title }
							onChange={ ( v ) =>
								updateGroup( gIndex, 'title', v )
							}
						/>
						<TextControl
							label={ __( 'Link (tùy chọn)', 'laca' ) }
							value={ group.link || '' }
							onChange={ ( v ) =>
								updateGroup( gIndex, 'link', v )
							}
						/>

						{ group.layout !== 'top-title-3cols' && (
							<>
								<ImagePicker
									label={ __( 'Ảnh chính', 'laca' ) }
									imageUrl={ group.mainImageUrl }
									imageId={ group.mainImageId }
									onSelect={ ( media ) => {
										updateGroup(
											gIndex,
											'mainImageId',
											media.id
										);
										updateGroup(
											gIndex,
											'mainImageUrl',
											media.url
										);
									} }
								/>
								{ ( group.subImages || [] ).map(
									( sub, sIndex ) => (
										<ImagePicker
											key={ sIndex }
											label={ `${ __(
												'Ảnh phụ',
												'laca'
											) } ${ sIndex + 1 }` }
											imageUrl={ sub.imageUrl }
											imageId={ sub.imageId }
											onSelect={ ( media ) => {
												updateSubImage(
													gIndex,
													sIndex,
													'imageId',
													media.id
												);
												updateSubImage(
													gIndex,
													sIndex,
													'imageUrl',
													media.url
												);
											} }
										/>
									)
								) }
							</>
						) }

						{ group.layout === 'top-title-3cols' && (
							<>
								{ ( group.items || [] ).map(
									( item, iIndex ) => (
										<div
											key={ iIndex }
											style={ {
												borderBottom: '1px solid #eee',
												marginBottom: 8,
												paddingBottom: 8,
											} }
										>
											<ImagePicker
												label={ `${ __(
													'Ảnh',
													'laca'
												) } ${ iIndex + 1 }` }
												imageUrl={ item.imageUrl }
												imageId={ item.imageId }
												onSelect={ ( media ) => {
													updateItem(
														gIndex,
														iIndex,
														'imageId',
														media.id
													);
													updateItem(
														gIndex,
														iIndex,
														'imageUrl',
														media.url
													);
												} }
											/>
											<TextControl
												label={ __( 'Label', 'laca' ) }
												value={ item.label }
												onChange={ ( v ) =>
													updateItem(
														gIndex,
														iIndex,
														'label',
														v
													)
												}
											/>
											<TextControl
												label={ __( 'Link', 'laca' ) }
												value={ item.link || '' }
												onChange={ ( v ) =>
													updateItem(
														gIndex,
														iIndex,
														'link',
														v
													)
												}
											/>
										</div>
									)
								) }
							</>
						) }

						<Button
							isDestructive
							variant="secondary"
							onClick={ () => removeGroup( gIndex ) }
							style={ { marginTop: 8 } }
						>
							{ __( 'Xóa nhóm này', 'laca' ) }
						</Button>
					</PanelBody>
				) ) }

				<div style={ { padding: '8px 16px 16px' } }>
					<Button variant="primary" onClick={ addGroup }>
						{ __( '+ Thêm nhóm dịch vụ', 'laca' ) }
					</Button>
				</div>

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
					block="lacadev/services-grid-block"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}
