/**
 * posts-highlight-block — edit.js
 * Layout: 1 bài lớn bên trái (span full height) + 4 bài nhỏ 2×2 bên phải
 * Đồng bộ chuẩn kiến trúc projects-slider-block
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	PanelBody,
	PanelRow,
	TextControl,
	SelectControl,
	RangeControl,
	CheckboxControl,
	RadioControl,
	Spinner,
	ColorPicker,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import ServerSideRender from '@wordpress/server-side-render';
import { useInserterPreview, BlockPreviewMock } from '../utils/preview';

export default function Edit( { attributes, setAttributes } ) {
	const isPreview = useInserterPreview( attributes );
	if ( isPreview ) {
		return (
			<BlockPreviewMock
				kicker={ __( 'Posts Highlight', 'laca' ) }
				title={
					attributes.sectionTitle || __( 'Bài viết nổi bật', 'laca' )
				}
				columns={ 3 }
			/>
		);
	}

	const {
		sectionTitle,
		postType,
		taxonomy,
		selectedTerms,
		mode,
		orderBy,
		order,
		postsCount,
		selectedPosts,
		ctaText,
		bgColor,
		bgOpacity,
	} = attributes;

	const [ postSearch, setPostSearch ] = useState( '' );

	// ── Post types ─────────────────────────────────────────────────────────
	const postTypes = useSelect( ( select ) => {
		const types = select( 'core' ).getPostTypes( { per_page: -1 } );
		if ( ! types ) {
			return [];
		}
		return types
			.filter(
				( t ) =>
					t.viewable &&
					! [
						'attachment',
						'wp_block',
						'wp_template',
						'wp_template_part',
						'wp_navigation',
						'wp_font_family',
						'wp_font_face',
					].includes( t.slug )
			)
			.map( ( t ) => ( { label: t.name, value: t.slug } ) );
	}, [] );

	// ── Taxonomies theo postType ───────────────────────────────────────────
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

	// ── Terms theo taxonomy ──────────────────────────────────────────────
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

	// ── Auto preview ──────────────────────────────────────────────────────
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
			// Dùng đúng slug taxonomy làm key query (e.g. 'categories', 'tags', custom slug)
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
		[
			mode,
			postType,
			taxonomy,
			selectedTerms.join( ',' ),
			postsCount,
			orderBy,
			order,
		]
	);

	// ── Manual: all posts (checkbox list) ─────────────────────────────────
	const manualPosts = useSelect(
		( select ) => {
			if ( mode !== 'manual' ) {
				return [];
			}
			return (
				select( 'core' ).getEntityRecords( 'postType', postType, {
					per_page: 50,
					status: 'publish',
					search: postSearch || undefined,
					_embed: true,
				} ) || []
			);
		},
		[ mode, postType, postSearch ]
	);

	// ── Manual: fetch by IDs (canvas preview) ────────────────────────────
	const selectedPostsData = useSelect(
		( select ) => {
			if ( mode !== 'manual' || selectedPosts.length === 0 ) {
				return [];
			}
			return (
				select( 'core' ).getEntityRecords( 'postType', postType, {
					include: selectedPosts.join( ',' ),
					per_page: 100,
					orderby: 'include',
					_embed: true,
				} ) || []
			);
		},
		[ mode, postType, selectedPosts.join( ',' ) ]
	);

	// Reset khi đổi postType
	useEffect( () => {
		setAttributes( { selectedTerms: [], taxonomy: '' } );
	}, [ postType ] );

	// ── Posts to render ──────────────────────────────────────────────
	const allPosts =
		mode === 'manual'
			? selectedPosts
					.map( ( id ) =>
						selectedPostsData.find( ( p ) => p.id === id )
					)
					.filter( Boolean )
			: previewPosts;

	// ── Helpers ────────────────────────────────────────────────────────────
	const toggleId = ( arr, id ) =>
		arr.includes( id ) ? arr.filter( ( x ) => x !== id ) : [ ...arr, id ];

	const getThumb = ( post ) =>
		post?._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ]?.source_url || '';

	const getCat = ( post ) => {
		const t = post?._embedded?.[ 'wp:term' ]?.[ 0 ] || [];
		return t[ 0 ]?.name || '';
	};

	const blockProps = useBlockProps( {
		className: 'block-posts-highlight',
	} );

	// ── Card render (horizontal: thumb left + body right) ──────────────────
	const renderCard = ( post ) => {
		const thumb = getThumb( post );
		const title = post.title?.rendered || '';
		const cat = getCat( post );

		return (
			<div key={ post.id } className="phb__card">
				<div className="phb__card-inner">
					<div className="phb__thumb">
						{ thumb ? (
							<img
								src={ thumb }
								alt={ title }
								className="phb__img"
							/>
						) : (
							<div className="phb__thumb-placeholder" />
						) }
					</div>
					<div className="phb__body">
						<div className="phb__content">
							<h3
								className="phb__title"
								dangerouslySetInnerHTML={ { __html: title } }
							/>
						</div>
						<div className="phb__separator" />
						<div className="phb__footer">
							{ cat && <span className="phb__cat">{ cat }</span> }
							<span className="phb__cta">
								{ ctaText } <span aria-hidden="true">→</span>
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const taxonomyOptions = [
		{ label: __( '— Không lọc —', 'laca' ), value: '' },
		...taxonomies.map( ( tx ) => ( { label: tx.label, value: tx.value } ) ),
	];

	return (
		<>
			<InspectorControls>
				{ /* Tiêu đề */ }
				<PanelBody
					title={ __( 'Hiển thị', 'laca' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Tiêu đề section', 'laca' ) }
						value={ sectionTitle }
						onChange={ ( v ) =>
							setAttributes( { sectionTitle: v } )
						}
					/>
					<TextControl
						label={ __( 'Text nút CTA', 'laca' ) }
						value={ ctaText }
						onChange={ ( v ) => setAttributes( { ctaText: v } ) }
					/>
				</PanelBody>

				{ /* Nguồn bài viết */ }
				<PanelBody
					title={ __( 'Nguồn bài viết', 'laca' ) }
					initialOpen={ true }
				>
					<RadioControl
						label={ __( 'Chế độ', 'laca' ) }
						selected={ mode }
						options={ [
							{
								label: __( 'Tự động (query)', 'laca' ),
								value: 'auto',
							},
							{
								label: __( 'Thủ công (chọn tay)', 'laca' ),
								value: 'manual',
							},
						] }
						onChange={ ( v ) => setAttributes( { mode: v } ) }
					/>

					{ postTypes.length > 0 && (
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
					) }

					{ /* AUTO */ }
					{ mode === 'auto' && (
						<>
							{ taxonomyOptions.length > 1 && (
								<SelectControl
									label={ __( 'Taxonomy', 'laca' ) }
									value={ taxonomy }
									options={ taxonomyOptions }
									onChange={ ( v ) =>
										setAttributes( {
											taxonomy: v,
											selectedTerms: [],
										} )
									}
								/>
							) }

							{ taxonomy && terms.length > 0 && (
								<>
									<p
										style={ {
											fontSize: '11px',
											fontWeight: 600,
											marginBottom: '6px',
										} }
									>
										{ __( 'Chọn danh mục', 'laca' ) }
									</p>
									<div
										style={ {
											maxHeight: '200px',
											overflowY: 'auto',
											border: '1px solid #ddd',
											borderRadius: '4px',
											padding: '4px 8px',
										} }
									>
										{ terms.map( ( term ) => (
											<CheckboxControl
												key={ term.id }
												label={ `${ term.name } (${ term.count })` }
												checked={ selectedTerms.includes(
													term.id
												) }
												onChange={ () =>
													setAttributes( {
														selectedTerms: toggleId(
															selectedTerms,
															term.id
														),
													} )
												}
											/>
										) ) }
									</div>
								</>
							) }

							<RangeControl
								label={ __( 'Số bài viết', 'laca' ) }
								value={ postsCount }
								min={ 3 }
								max={ 20 }
								help={ __(
									'5 bài đầu: grid nổi bật. Bài 6+: 3 cột phía dưới.',
									'laca'
								) }
								onChange={ ( v ) =>
									setAttributes( { postsCount: v } )
								}
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
										label: __( 'Tiêu đề', 'laca' ),
										value: 'title',
									},
									{
										label: __( 'Menu Order', 'laca' ),
										value: 'menu_order',
									},
									{
										label: __( 'Lượt bình luận', 'laca' ),
										value: 'comment_count',
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

					{ /* MANUAL */ }
					{ mode === 'manual' && (
						<>
							<p
								style={ {
									fontSize: '11px',
									color: '#666',
									margin: '4px 0 8px',
								} }
							>
								{ __( 'Đã chọn: ', 'laca' ) }
								<strong>{ selectedPosts.length }</strong>
								{ __(
									' bài — bài đầu tiên sẽ là ảnh lớn, từ bài 6 hiển 3 cột phía dưới',
									'laca'
								) }
							</p>
							<TextControl
								label={ __( 'Tìm bài viết', 'laca' ) }
								value={ postSearch }
								onChange={ setPostSearch }
								placeholder={ __( 'Nhập tên bài…', 'laca' ) }
							/>
							<div
								style={ {
									maxHeight: '240px',
									overflowY: 'auto',
									border: '1px solid #ddd',
									borderRadius: '4px',
									padding: '4px 8px',
								} }
							>
								{ manualPosts.map( ( post ) => (
									<CheckboxControl
										key={ post.id }
										label={
											post.title?.rendered ||
											`#${ post.id }`
										}
										checked={ selectedPosts.includes(
											post.id
										) }
										onChange={ () =>
											setAttributes( {
												selectedPosts: toggleId(
													selectedPosts,
													post.id
												),
											} )
										}
									/>
								) ) }
							</div>
						</>
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
			<div { ...useBlockProps() }>
				<ServerSideRender
					block="lacadev/posts-highlight-block"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}
