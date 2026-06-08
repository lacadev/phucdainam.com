import { __, sprintf } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	Button,
	ToggleControl,
	RangeControl,
	ColorPicker,
} from '@wordpress/components';
import { useInserterPreview, BlockPreviewMock } from '../utils/preview';
import { hexToRgba } from '../utils/style';

/**
 * Trích YouTube ID từ nhiều dạng URL.
 * @param url
 */
function extractYoutubeId( url ) {
	if ( ! url ) {
		return '';
	}
	const m = url.match(
		/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/
	);
	return m ? m[ 1 ] : '';
}

function getVideoThumbnail( video ) {
	if ( video?.thumbnailUrl ) {
		return video.thumbnailUrl;
	}

	const ytId = extractYoutubeId( video?.url );
	return ytId ? `https://i.ytimg.com/vi/${ ytId }/hqdefault.jpg` : '';
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		heading,
		videos,
		slidesPerView,
		spaceBetween,
		loop,
		autoplay,
		autoplayDelay,
		showPagination,
		showNavigation,
		bgColor,
		bgOpacity,
	} = attributes;

	const isPreview = useInserterPreview( attributes );
	const blockProps = useBlockProps( {
		className: 'block-video-feedback block-video-feedback--editor-preview',
		style: {
			background: hexToRgba( bgColor || '#0f0f0f', bgOpacity ),
		},
	} );

	if ( isPreview ) {
		return (
			<BlockPreviewMock
				kicker={ __( 'Video Feedback', 'laca' ) }
				title={
					attributes.heading ||
					__( 'Khách hàng nói gì về chúng tôi', 'laca' )
				}
				columns={ 3 }
			/>
		);
	}

	const previewVideos = videos.filter(
		( item ) => item?.url || item?.thumbnailUrl
	);
	const previewColumns = Math.max(
		1,
		Math.min(
			slidesPerView || 4,
			previewVideos.length || slidesPerView || 4
		)
	);

	/* ── Video repeater helpers ── */
	const updateVideo = ( index, key, value ) => {
		const next = videos.map( ( item, i ) =>
			i === index ? { ...item, [ key ]: value } : item
		);
		setAttributes( { videos: next } );
	};
	const addVideo = () =>
		setAttributes( { videos: [ ...videos, { url: '', name: '' } ] } );
	const removeVideo = ( index ) =>
		setAttributes( { videos: videos.filter( ( _, i ) => i !== index ) } );

	return (
		<>
			<InspectorControls>
				{ /* ── Nội dung ── */ }
				<PanelBody
					title={ __( 'Nội dung', 'laca' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Tiêu đề block', 'laca' ) }
						value={ heading }
						onChange={ ( v ) => setAttributes( { heading: v } ) }
						placeholder={ __(
							'VD: Khách hàng nói gì về Phúc Đại Nam',
							'laca'
						) }
					/>
				</PanelBody>

				{ /* ── Slider Settings ── */ }
				<PanelBody
					title={ __( 'Slider Settings', 'laca' ) }
					initialOpen={ true }
				>
					<RangeControl
						label={ __( 'Slides Per View (Desktop)', 'laca' ) }
						value={ slidesPerView }
						onChange={ ( v ) =>
							setAttributes( { slidesPerView: v } )
						}
						min={ 1 }
						max={ 6 }
						help={ __(
							'Mobile: 1.2 / Tablet: 2.2 / Desktop: giá trị này',
							'laca'
						) }
					/>
					<RangeControl
						label={ __( 'Space Between (px)', 'laca' ) }
						value={ spaceBetween }
						onChange={ ( v ) =>
							setAttributes( { spaceBetween: v } )
						}
						min={ 0 }
						max={ 60 }
					/>
					<ToggleControl
						label={ __( 'Loop', 'laca' ) }
						checked={ loop }
						onChange={ ( v ) => setAttributes( { loop: v } ) }
					/>
					<ToggleControl
						label={ __( 'Autoplay', 'laca' ) }
						checked={ autoplay }
						onChange={ ( v ) => setAttributes( { autoplay: v } ) }
					/>
					{ autoplay && (
						<RangeControl
							label={ __( 'Autoplay Delay (ms)', 'laca' ) }
							value={ autoplayDelay }
							onChange={ ( v ) =>
								setAttributes( { autoplayDelay: v } )
							}
							min={ 1000 }
							max={ 10000 }
							step={ 500 }
						/>
					) }
					<ToggleControl
						label={ __( 'Show Pagination (dots)', 'laca' ) }
						checked={ showPagination }
						onChange={ ( v ) =>
							setAttributes( { showPagination: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Show Navigation (prev/next)', 'laca' ) }
						checked={ showNavigation }
						onChange={ ( v ) =>
							setAttributes( { showNavigation: v } )
						}
					/>
				</PanelBody>

				{ /* ── Danh sách video ── */ }
				<PanelBody
					title={ __( 'Danh sách video', 'laca' ) }
					initialOpen={ false }
				>
					{ videos.map( ( item, index ) => {
						const ytId = extractYoutubeId( item.url );
						return (
							<div
								key={ index }
								style={ {
									borderBottom: '1px solid #e0e0e0',
									marginBottom: '1.6rem',
									paddingBottom: '1.6rem',
								} }
							>
								<strong
									style={ {
										display: 'block',
										marginBottom: '0.8rem',
									} }
								>
									{ __( 'Video', 'laca' ) } { index + 1 }
								</strong>
								<TextControl
									label={ __( 'URL YouTube', 'laca' ) }
									value={ item.url }
									onChange={ ( v ) =>
										updateVideo( index, 'url', v )
									}
									placeholder="https://youtu.be/..."
								/>
								{ ytId && ! item.thumbnailUrl && (
									<img
										src={ `https://img.youtube.com/vi/${ ytId }/mqdefault.jpg` }
										alt="YouTube thumbnail"
										style={ {
											width: '100%',
											borderRadius: '4px',
											marginBottom: '0.8rem',
										} }
									/>
								) }
								<div style={ { marginBottom: '0.8rem' } }>
									<p
										style={ {
											marginBottom: '0.4rem',
											fontSize: '13px',
										} }
									>
										{ __(
											'Ảnh Thumbnail (tùy chọn)',
											'laca'
										) }
									</p>
									<MediaUploadCheck>
										<MediaUpload
											onSelect={ ( media ) => {
												const next = [ ...videos ];
												next[ index ] = {
													...next[ index ],
													thumbnailUrl: media.url,
													thumbnailId: media.id,
												};
												setAttributes( {
													videos: next,
												} );
											} }
											allowedTypes={ [ 'image' ] }
											value={ item.thumbnailId }
											render={ ( { open } ) => (
												<div
													style={ {
														display: 'flex',
														gap: '10px',
														alignItems:
															'flex-start',
													} }
												>
													{ item.thumbnailUrl ? (
														<img
															src={
																item.thumbnailUrl
															}
															style={ {
																width: '100px',
																height: 'auto',
																cursor: 'pointer',
																borderRadius:
																	'4px',
															} }
															onClick={ open }
														/>
													) : (
														<Button
															variant="secondary"
															onClick={ open }
														>
															{ __(
																'Chọn ảnh',
																'laca'
															) }
														</Button>
													) }
													{ item.thumbnailUrl && (
														<Button
															isDestructive
															variant="link"
															style={ {
																padding: 0,
															} }
															onClick={ () => {
																const next = [
																	...videos,
																];
																next[ index ] =
																	{
																		...next[
																			index
																		],
																		thumbnailUrl:
																			'',
																		thumbnailId:
																			null,
																	};
																setAttributes( {
																	videos: next,
																} );
															} }
														>
															{ __(
																'Xóa ảnh',
																'laca'
															) }
														</Button>
													) }
												</div>
											) }
										/>
									</MediaUploadCheck>
								</div>
								<TextControl
									label={ __( 'Tên người feedback', 'laca' ) }
									value={ item.name }
									onChange={ ( v ) =>
										updateVideo( index, 'name', v )
									}
									placeholder={ __(
										'VD: Mr Thành – Đồng Nai',
										'laca'
									) }
								/>
								<Button
									isDestructive
									variant="secondary"
									size="small"
									onClick={ () => removeVideo( index ) }
								>
									{ __( 'Xoá video này', 'laca' ) }
								</Button>
							</div>
						);
					} ) }
					<Button variant="primary" onClick={ addVideo }>
						{ __( '+ Thêm video', 'laca' ) }
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
			<div { ...blockProps }>
				<div className="container">
					{ heading && (
						<div className="header-section">
							<h2 className="heading">{ heading }</h2>
						</div>
					) }

					{ previewVideos.length > 0 ? (
						<div
							className="block-video-feedback__editor-grid"
							style={ {
								'--vfb-preview-cols': previewColumns,
								gap: `${ spaceBetween || 20 }px`,
							} }
						>
							{ previewVideos.map( ( video, index ) => {
								const name = video?.name || '';
								const thumb = getVideoThumbnail( video );

								return (
									<figure
										key={ index }
										className="block-video-feedback__figure block-video-feedback__editor-card"
									>
										<article
											className="block-video-feedback__item"
											aria-label={
												name
													? sprintf(
															__(
																'Xem video: %s',
																'laca'
															),
															name
													  )
													: __( 'Xem video', 'laca' )
											}
										>
											<div className="block-video-feedback__thumb">
												{ thumb ? (
													<img
														src={ thumb }
														alt={
															name ||
															__(
																'Video feedback',
																'laca'
															)
														}
														className="block-video-feedback__img"
													/>
												) : (
													<div className="block-video-feedback__empty-thumb">
														{ __(
															'Chưa có thumbnail',
															'laca'
														) }
													</div>
												) }
												<span
													className="block-video-feedback__play"
													aria-hidden="true"
												>
													<svg
														viewBox="0 0 24 24"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<circle
															cx="12"
															cy="12"
															r="11"
															stroke="#fff"
															strokeWidth="1.5"
															opacity=".9"
														/>
														<path
															d="M10 8.5l6 3.5-6 3.5V8.5z"
															fill="#fff"
														/>
													</svg>
												</span>
											</div>
										</article>
										{ name && (
											<figcaption className="block-video-feedback__name">
												{ name }
											</figcaption>
										) }
									</figure>
								);
							} ) }
						</div>
					) : (
						<p className="block-video-feedback__editor-empty">
							{ __(
								'Thêm video feedback trong sidebar.',
								'laca'
							) }
						</p>
					) }
				</div>
			</div>
		</>
	);
}
