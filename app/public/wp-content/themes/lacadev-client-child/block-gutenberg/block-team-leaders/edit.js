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
	TextareaControl,
	Button,
	ColorPicker,
	RangeControl,
} from '@wordpress/components';
import { useInserterPreview, BlockPreviewMock } from '../utils/preview';
import { hexToRgba } from '../utils/style';

export default function Edit( { attributes, setAttributes } ) {
	const isPreview = useInserterPreview( attributes );
	if ( isPreview ) {
		return (
			<BlockPreviewMock
				kicker={ __( 'Team Leaders', 'laca' ) }
				title={
					attributes.sectionTitle || __( 'Đội ngũ lãnh đạo', 'laca' )
				}
				columns={ 3 }
			/>
		);
	}

	const { sectionTitle, leaders, bgColor, bgOpacity } = attributes;
	const leadersList = Array.isArray( leaders ) ? leaders : [];
	const previewCols = Math.max( 1, Math.min( leadersList.length || 1, 4 ) );

	const blockProps = useBlockProps( {
		className: 'block-team-leaders block-team-leaders--editor-preview',
		style: {
			background: hexToRgba( bgColor || '#0f0f0f', bgOpacity ?? 100 ),
		},
	} );

	const updateLeader = ( index, key, value ) => {
		const updated = leadersList.map( ( l, i ) =>
			i === index ? { ...l, [ key ]: value } : l
		);
		setAttributes( { leaders: updated } );
	};

	const addLeader = () => {
		if ( leadersList.length >= 4 ) {
			return;
		}
		setAttributes( {
			leaders: [
				...leadersList,
				{
					imageId: 0,
					imageUrl: '',
					prefix: 'Ông',
					name: 'TÊN LÃNH ĐẠO',
					position: 'CHỨC VỤ',
					quote: '',
				},
			],
		} );
	};

	const removeLeader = ( index ) => {
		setAttributes( {
			leaders: leadersList.filter( ( _, i ) => i !== index ),
		} );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Tiêu đề section', 'laca' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Tiêu đề', 'laca' ) }
						value={ sectionTitle }
						onChange={ ( v ) =>
							setAttributes( { sectionTitle: v } )
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
				</PanelBody>

				<PanelBody
					title={ __( 'Danh sách lãnh đạo (tối đa 4)', 'laca' ) }
					initialOpen={ false }
				>
					{ leadersList.map( ( leader, index ) => (
						<div
							key={ index }
							style={ {
								borderBottom: '1px solid #ddd',
								marginBottom: 16,
								paddingBottom: 16,
							} }
						>
							<p style={ { fontWeight: 600, marginBottom: 8 } }>
								{ __( 'Lãnh đạo', 'laca' ) } { index + 1 }
							</p>

							<MediaUploadCheck>
								<MediaUpload
									onSelect={ ( media ) => {
										updateLeader(
											index,
											'imageId',
											media.id
										);
										updateLeader(
											index,
											'imageUrl',
											media.url
										);
									} }
									allowedTypes={ [ 'image' ] }
									value={ leader.imageId }
									render={ ( { open } ) => (
										<div style={ { marginBottom: 8 } }>
											{ leader.imageUrl ? (
												<img
													src={ leader.imageUrl }
													alt=""
													style={ {
														width: '100%',
														maxHeight: 120,
														objectFit: 'cover',
														marginBottom: 4,
													} }
												/>
											) : null }
											<Button
												variant="secondary"
												onClick={ open }
											>
												{ leader.imageUrl
													? __( 'Đổi ảnh', 'laca' )
													: __( 'Chọn ảnh', 'laca' ) }
											</Button>
										</div>
									) }
								/>
							</MediaUploadCheck>

							<PanelRow>
								<TextControl
									label={ __( 'Prefix (Ông/Bà)', 'laca' ) }
									value={ leader.prefix }
									onChange={ ( v ) =>
										updateLeader( index, 'prefix', v )
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextControl
									label={ __( 'Tên', 'laca' ) }
									value={ leader.name }
									onChange={ ( v ) =>
										updateLeader( index, 'name', v )
									}
								/>
							</PanelRow>
							<PanelRow>
								<TextControl
									label={ __( 'Chức vụ', 'laca' ) }
									value={ leader.position }
									onChange={ ( v ) =>
										updateLeader( index, 'position', v )
									}
								/>
							</PanelRow>
							<TextareaControl
								label={ __( 'Quote', 'laca' ) }
								value={ leader.quote }
								onChange={ ( v ) =>
									updateLeader( index, 'quote', v )
								}
								rows={ 3 }
							/>
							<Button
								isDestructive
								variant="secondary"
								onClick={ () => removeLeader( index ) }
							>
								{ __( 'Xóa', 'laca' ) }
							</Button>
						</div>
					) ) }

					{ leadersList.length < 4 && (
						<Button variant="primary" onClick={ addLeader }>
							{ __( '+ Thêm lãnh đạo', 'laca' ) }
						</Button>
					) }
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
			<div { ...blockProps }>
				<div className="block-team-leaders__editor-inner">
					{ sectionTitle ? (
						<div className="block-team-leaders__editor-header">
							<h2 className="block-team-leaders__editor-heading">
								{ sectionTitle }
							</h2>
						</div>
					) : null }

					{ leadersList.length > 0 ? (
						<div
							className="block-team-leaders__editor-grid"
							style={ {
								gridTemplateColumns: `repeat(${ previewCols }, minmax(0, 1fr))`,
							} }
						>
							{ leadersList.map( ( leader, index ) => {
								const nameLine = [ leader.prefix, leader.name ]
									.filter( Boolean )
									.join( ' ' );

								return (
									<div
										key={ index }
										className="block-team-leaders__editor-card"
									>
										<div className="block-team-leaders__editor-thumb">
											{ leader.imageUrl ? (
												<img
													src={ leader.imageUrl }
													alt={ nameLine || '' }
												/>
											) : (
												<div className="block-team-leaders__editor-thumb-placeholder">
													{ __(
														'Chưa có ảnh',
														'laca'
													) }
												</div>
											) }
										</div>
										<div className="block-team-leaders__editor-meta">
											{ nameLine ? (
												<div className="block-team-leaders__editor-name">
													{ nameLine }
												</div>
											) : null }
											{ leader.position ? (
												<div className="block-team-leaders__editor-position">
													{ leader.position }
												</div>
											) : null }
										</div>
									</div>
								);
							} ) }
						</div>
					) : (
						<p className="block-team-leaders__editor-empty">
							{ __(
								'Thêm lãnh đạo trong sidebar (tối đa 4).',
								'laca'
							) }
						</p>
					) }
				</div>
			</div>
		</>
	);
}
