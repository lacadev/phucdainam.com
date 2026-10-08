import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	PanelRow,
	SelectControl,
	RangeControl,
	CheckboxControl,
	TextControl,
	ToggleControl,
	ColorPicker,
	Button,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import ServerSideRender from '@wordpress/server-side-render';
import { useInserterPreview, BlockPreviewMock } from '../utils/preview';

export default function Edit( { attributes, setAttributes } ) {
	const isPreview = useInserterPreview( attributes );
	if ( isPreview ) {
		return (
			<BlockPreviewMock
				kicker={
					attributes.sectionBadge || __( 'Dự Án Tiêu Biểu', 'laca' )
				}
				title={
					attributes.sectionTitle ||
					__( 'Dự Án Sử Dụng Sản Phẩm', 'laca' )
				}
				columns={ 3 }
			/>
		);
	}

	// ── Local state ──────────────────────────────────────────────────────────
	const [ postSearch, setPostSearch ] = useState( '' );

	const {
		sectionBadge,
		sectionTitle,
		ctaText,
		headingColor,
		postType,
		taxonomy,
		selectedTerms,
		mode,
		orderBy,
		order,
		postsCount,
		selectedPosts,
		bgColor,
		bgOpacity,
		pauseOnHover,
		showPopupForm,
		popupBudgetOptions,
		popupButtonText,
	} = attributes;

	// Tính màu nền thực tế với opacity
	const bgRgba = ( () => {
		const hex = bgColor || '#0f0f0f';
		const r = parseInt( hex.slice( 1, 3 ), 16 );
		const g = parseInt( hex.slice( 3, 5 ), 16 );
		const b = parseInt( hex.slice( 5, 7 ), 16 );
		const a = ( bgOpacity ?? 100 ) / 100;
		return `rgba(${ r },${ g },${ b },${ a })`;
	} )();

	const blockProps = useBlockProps( {
		className: 'wp-block-lacadev-projects-slider-block',
		style: { background: bgRgba, padding: '4rem 0', overflow: 'hidden' },
	} );

	// ── Lấy Post Types ──────────────────────────────────────────────────────
	const postTypes = useSelect( ( select ) => {
		const types = select( 'core' ).getPostTypes( { per_page: -1 } );
		if ( ! types ) {
			return [];
		}
		return types
			.filter( ( t ) => t.viewable && t.slug !== 'attachment' )
			.map( ( t ) => ( { label: t.name, value: t.slug } ) );
	}, [] );

	// ── Lấy Taxonomies theo postType ────────────────────────────────────────
	const taxonomies = useSelect(
		( select ) => {
			const types = select( 'core' ).getPostTypes( { per_page: -1 } );
			if ( ! types ) {
				return [];
			}
			const current = types.find( ( t ) => t.slug === postType );
			if ( ! current ) {
				return [];
			}
			return ( current.taxonomies || [] ).map( ( slug ) => {
				const tax = select( 'core' ).getTaxonomy( slug );
				return { label: tax ? tax.name : slug, value: slug };
			} );
		},
		[ postType ]
	);

	// ── Terms theo taxonomy ──────────────────────────────────────────────────
	const terms = useSelect(
		( select ) => {
			if ( ! taxonomy ) {
				return [];
			}
			return (
				select( 'core' ).getEntityRecords( 'taxonomy', taxonomy, {
					per_page: 50,
				} ) || []
			);
		},
		[ taxonomy ]
	);

	// ── Manual: danh sách tất cả posts (cho checkbox panel) ────────────────
	const manualPosts = useSelect(
		( select ) => {
			if ( mode !== 'manual' ) {
				return [];
			}
			return (
				select( 'core' ).getEntityRecords( 'postType', postType, {
					per_page: 100,
					status: 'publish',
					_embed: true,
				} ) || []
			);
		},
		[ mode, postType ]
	);

	// ── Manual: fetch chính xác bài đã chọn theo ID (cho canvas preview) ───
	const selectedPostsData = useSelect(
		( select ) => {
			if ( mode !== 'manual' || selectedPosts.length === 0 ) {
				return [];
			}
			return (
				select( 'core' ).getEntityRecords( 'postType', postType, {
					include: selectedPosts.join( ',' ), // REST API cần string, không phải array
					per_page: 100,
					orderby: 'include', // giữ đúng thứ tự đã chọn
					_embed: true,
				} ) || []
			);
		},
		[ mode, postType, selectedPosts.join( ',' ) ]
	);

	// ── Auto: preview posts trong editor ────────────────────────────────────
	const previewPosts = useSelect(
		( select ) => {
			if ( mode !== 'auto' ) {
				return [];
			}
			const query = {
				per_page: postsCount,
				status: 'publish',
				orderby: orderBy,
				order,
				_embed: true,
			};
			if ( selectedTerms.length > 0 && taxonomy ) {
				query[ taxonomy ] = selectedTerms.join( ',' );
			}
			return (
				select( 'core' ).getEntityRecords(
					'postType',
					postType,
					query
				) || []
			);
		},
		[ mode, postType, taxonomy, selectedTerms, postsCount, orderBy, order ]
	);

	// ── Reset khi đổi postType ──────────────────────────────────────────────
	useEffect( () => {
		setAttributes( { selectedTerms: [], taxonomy: '' } );
	}, [ postType ] );

	// ── Posts hiển thị trên canvas ──────────────────────────────────────────
	// Khi manual: dùng selectedPostsData (fetch theo ID) → đảm bảo đúng bài và có thumbnail
	// Giữ đúng thứ tự theo selectedPosts
	const postsToShow =
		mode === 'manual'
			? selectedPosts
					.map( ( id ) =>
						selectedPostsData.find( ( p ) => p.id === id )
					)
					.filter( Boolean )
			: previewPosts;

	// ── Helper: decode HTML entities (` &#8217;`, `&amp;`, etc.) ─────────────
	const decodeHTML = ( html ) => {
		try {
			const doc = new DOMParser().parseFromString( html, 'text/html' );
			return doc.documentElement.textContent;
		} catch ( e ) {
			return html;
		}
	};

	// ── Render card preview trong editor ────────────────────────────────────
	const renderCard = ( post, i ) => {
		const thumb = post._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ]?.source_url;
		const title = post.title?.rendered || `(Dự án #${ post.id })`;
		return (
			<div
				key={ post.id || i }
				style={ {
					flex: '0 0 30%',
					minWidth: '28rem',
					aspectRatio: '4/3',
					background: thumb
						? `url(${ thumb }) center/cover no-repeat`
						: '#333',
					borderRadius: '4px',
					position: 'relative',
					overflow: 'hidden',
				} }
			>
				<div
					style={ {
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						padding: '2rem 1.5rem 1.5rem',
						background:
							'linear-gradient(transparent, rgba(0,0,0,0.85))',
					} }
				>
					<h3
						style={ {
							color: '#fff',
							margin: '0 0 0.75rem',
							fontSize: '1.1rem',
							fontWeight: 500,
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						} }
						dangerouslySetInnerHTML={ { __html: title } }
					/>
					<span
						style={ {
							color: 'rgba(255,255,255,0.8)',
							fontSize: '0.8rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.4rem',
						} }
					>
						{ ctaText } →
					</span>
				</div>
			</div>
		);
	};

	// ── Skeleton cards khi chưa có dữ liệu ─────────────────────────────────
	const renderSkeleton = ( count ) =>
		[ ...Array( count ) ].map( ( _, i ) => (
			<div
				key={ i }
				style={ {
					flex: '0 0 30%',
					minWidth: '28rem',
					aspectRatio: '4/3',
					background: '#2a2a2a',
					borderRadius: '4px',
					display: 'flex',
					alignItems: 'flex-end',
					padding: '1.5rem',
				} }
			>
				<div>
					<span
						style={ {
							display: 'block',
							width: '60%',
							height: '0.9rem',
							background: '#3a3a3a',
							borderRadius: 3,
							marginBottom: '0.5rem',
						} }
					/>
					<span
						style={ {
							display: 'block',
							width: '30%',
							height: '0.65rem',
							background: '#333',
							borderRadius: 3,
						} }
					/>
				</div>
			</div>
		) );

	return (
		<>
			{ /* ── Sidebar Controls ────────────────────────────────────────── */ }
			<InspectorControls>
				{ /* Panel 1: Tiêu đề */ }
				<PanelBody
					title={ __( 'Tiêu đề Section', 'laca' ) }
					initialOpen={ true }
				>
					<PanelRow>
						<TextControl
							label={ __( 'Badge nhỏ', 'laca' ) }
							value={ sectionBadge }
							onChange={ ( v ) =>
								setAttributes( { sectionBadge: v } )
							}
						/>
					</PanelRow>
					<PanelRow>
						<TextControl
							label={ __( 'Tiêu đề chính', 'laca' ) }
							value={ sectionTitle }
							onChange={ ( v ) =>
								setAttributes( { sectionTitle: v } )
							}
						/>
					</PanelRow>
					<PanelRow>
						<TextControl
							label={ __( 'Text nút CTA', 'laca' ) }
							value={ ctaText }
							onChange={ ( v ) =>
								setAttributes( { ctaText: v } )
							}
						/>
					</PanelRow>
					<p
						style={ {
							fontSize: '0.8rem',
							fontWeight: 600,
							margin: '8px 0 4px',
						} }
					>
						{ __( 'Màu tiêu đề', 'laca' ) }
						{ headingColor && (
							<button
								style={ {
									marginLeft: '8px',
									fontSize: '0.75rem',
									color: '#007cba',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									padding: 0,
								} }
								onClick={ () =>
									setAttributes( { headingColor: '' } )
								}
							>
								{ __( '↺ Reset về primary', 'laca' ) }
							</button>
						) }
					</p>
					<ColorPicker
						color={ headingColor || '#ffffff' }
						onChange={ ( v ) =>
							setAttributes( { headingColor: v } )
						}
						enableAlpha={ false }
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
					<ToggleControl
						label={ __( 'Dừng slider khi hover', 'laca' ) }
						checked={ pauseOnHover }
						onChange={ ( v ) =>
							setAttributes( { pauseOnHover: v } )
						}
					/>
				</PanelBody>

				{ /* Panel: Popup Liên Hệ */ }
				<PanelBody
					title={ __( 'Popup Liên Hệ', 'laca' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Hiện popup form khi scroll tới', 'laca' ) }
						checked={ showPopupForm }
						onChange={ ( v ) =>
							setAttributes( { showPopupForm: v } )
						}
					/>
					{ showPopupForm && (
						<>
							<TextControl
								label={ __( 'Text nút gửi', 'laca' ) }
								value={ popupButtonText }
								onChange={ ( v ) =>
									setAttributes( { popupButtonText: v } )
								}
							/>
							<p
								style={ {
									fontWeight: 600,
									fontSize: '0.8rem',
									margin: '12px 0 6px',
								} }
							>
								{ __( 'Ngân sách (dropdown)', 'laca' ) }
							</p>
							{ popupBudgetOptions.map( ( item, index ) => (
								<div
									key={ index }
									style={ {
										display: 'flex',
										gap: '6px',
										marginBottom: '6px',
										alignItems: 'center',
									} }
								>
									<TextControl
										value={ item }
										onChange={ ( v ) => {
											const next = popupBudgetOptions.map(
												( o, i ) =>
													i === index ? v : o
											);
											setAttributes( {
												popupBudgetOptions: next,
											} );
										} }
										placeholder={ __(
											'VD: 1 - 3 tỷ',
											'laca'
										) }
										style={ { flex: 1, marginBottom: 0 } }
									/>
									<Button
										isDestructive
										size="small"
										onClick={ () => {
											setAttributes( {
												popupBudgetOptions:
													popupBudgetOptions.filter(
														( _, i ) => i !== index
													),
											} );
										} }
									>
										✕
									</Button>
								</div>
							) ) }
							<Button
								variant="secondary"
								onClick={ () =>
									setAttributes( {
										popupBudgetOptions: [
											...popupBudgetOptions,
											'',
										],
									} )
								}
							>
								{ __( '+ Thêm mục', 'laca' ) }
							</Button>
						</>
					) }
				</PanelBody>

				{ /* Panel 2: Nguồn dự án */ }
				<PanelBody
					title={ __( 'Nguồn dự án', 'laca' ) }
					initialOpen={ true }
				>
					{ /* Post Type */ }
					{ postTypes.length > 0 ? (
						<SelectControl
							label={ __( 'Loại bài viết (Post Type)', 'laca' ) }
							value={ postType }
							options={ postTypes }
							onChange={ ( v ) =>
								setAttributes( {
									postType: v,
									selectedTerms: [],
									selectedPosts: [],
								} )
							}
						/>
					) : (
						<Spinner />
					) }

					{ /* Taxonomy */ }
					{ taxonomies.length > 0 && (
						<SelectControl
							label={ __( 'Taxonomy', 'laca' ) }
							value={ taxonomy }
							options={ [
								{
									label: __( '— Tất cả —', 'laca' ),
									value: '',
								},
								...taxonomies,
							] }
							onChange={ ( v ) =>
								setAttributes( {
									taxonomy: v,
									selectedTerms: [],
								} )
							}
						/>
					) }

					{ /* Terms */ }
					{ taxonomy && terms.length > 0 && (
						<div style={ { marginTop: '0.75rem' } }>
							<p
								style={ {
									fontWeight: 600,
									marginBottom: '0.5rem',
									fontSize: '0.8rem',
								} }
							>
								{ __( 'Chọn danh mục:', 'laca' ) }
							</p>
							{ terms.map( ( term ) => (
								<CheckboxControl
									key={ term.id }
									label={ `${ term.name } (${ term.count })` }
									checked={ selectedTerms.includes(
										term.id
									) }
									onChange={ ( checked ) => {
										const next = checked
											? [ ...selectedTerms, term.id ]
											: selectedTerms.filter(
													( id ) => id !== term.id
											  );
										setAttributes( {
											selectedTerms: next,
										} );
									} }
								/>
							) ) }
						</div>
					) }

					{ /* Mode */ }
					<SelectControl
						label={ __( 'Chế độ chọn dự án', 'laca' ) }
						value={ mode }
						options={ [
							{
								label: __( 'Tự động (theo query)', 'laca' ),
								value: 'auto',
							},
							{
								label: __( 'Thủ công (chọn tay)', 'laca' ),
								value: 'manual',
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { mode: v, selectedPosts: [] } )
						}
						style={ { marginTop: '1rem' } }
					/>

					{ /* Manual: checkbox posts */ }
					{ mode === 'manual' && (
						<div style={ { marginTop: '0.75rem' } }>
							<p
								style={ {
									fontWeight: 600,
									marginBottom: '0.5rem',
									fontSize: '0.8rem',
								} }
							>
								{ __( 'Chọn dự án hiển thị:', 'laca' ) }
							</p>
							{ /* Ô tìm kiếm */ }
							<TextControl
								placeholder={ __( '🔍 Tìm theo tên…', 'laca' ) }
								value={ postSearch }
								onChange={ ( v ) => setPostSearch( v ) }
								style={ { marginBottom: '0.5rem' } }
							/>
							{ manualPosts.length === 0 ? (
								<Spinner />
							) : (
								manualPosts
									.filter( ( p ) => {
										const title = decodeHTML(
											p.title?.rendered || ''
										);
										return title
											.toLowerCase()
											.includes(
												postSearch.toLowerCase()
											);
									} )
									.map( ( p ) => (
										<CheckboxControl
											key={ p.id }
											label={ decodeHTML(
												p.title?.rendered ||
													`(Post #${ p.id })`
											) }
											checked={ selectedPosts.includes(
												p.id
											) }
											onChange={ ( checked ) => {
												const next = checked
													? [ ...selectedPosts, p.id ]
													: selectedPosts.filter(
															( id ) =>
																id !== p.id
													  );
												setAttributes( {
													selectedPosts: next,
												} );
											} }
										/>
									) )
							) }
						</div>
					) }

					{ /* Auto: count + order */ }
					{ mode === 'auto' && (
						<>
							<RangeControl
								label={ __( 'Số dự án hiển thị', 'laca' ) }
								value={ postsCount }
								min={ 1 }
								max={ 12 }
								onChange={ ( v ) =>
									setAttributes( { postsCount: v } )
								}
								style={ { marginTop: '1rem' } }
							/>
							<SelectControl
								label={ __( 'Sắp xếp theo', 'laca' ) }
								value={ orderBy }
								options={ [
									{
										label: __( 'Ngày đăng', 'laca' ),
										value: 'date',
									},
									{
										label: __( 'Tiêu đề (A-Z)', 'laca' ),
										value: 'title',
									},
									{
										label: __( 'Menu Order', 'laca' ),
										value: 'menu_order',
									},
								] }
								onChange={ ( v ) =>
									setAttributes( { orderBy: v } )
								}
							/>
							<SelectControl
								label={ __( 'Thứ tự', 'laca' ) }
								value={ order }
								options={ [
									{
										label: __( 'Mới nhất (DESC)', 'laca' ),
										value: 'DESC',
									},
									{
										label: __( 'Cũ nhất (ASC)', 'laca' ),
										value: 'ASC',
									},
								] }
								onChange={ ( v ) =>
									setAttributes( { order: v } )
								}
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<ServerSideRender
					block="lacadev/projects-slider-block"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}
