import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	PanelRow,
	TextControl,
	RangeControl,
	SelectControl,
	RadioControl,
	CheckboxControl,
	Button,
	ColorPicker,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import ServerSideRender from '@wordpress/server-side-render';
import { useInserterPreview, BlockPreviewMock } from '../utils/preview';

export default function Edit( { attributes, setAttributes } ) {
	const isPreview = useInserterPreview( attributes );
	if ( isPreview ) {
		return (
			<BlockPreviewMock
				kicker={ __( 'Featured Projects', 'laca' ) }
				title={
					attributes.sectionTitle || __( 'Dự án nổi bật', 'laca' )
				}
				columns={ 3 }
			/>
		);
	}

	const {
		sectionTitle,
		badges,
		ctaText,
		ctaUrl,
		mode,
		postType,
		postIds,
		postsCount,
		orderBy,
		bgColor,
		bgOpacity,
	} = attributes;

	const blockProps = useBlockProps( {
		className: 'wp-block-lacadev-featured-projects-block',
	} );

	// Lấy danh sách post types
	const postTypes = useSelect( ( select ) => {
		const types = select( 'core' ).getPostTypes( { per_page: -1 } );
		if ( ! types ) {
			return [];
		}
		return types
			.filter( ( t ) => t.viewable && t.slug !== 'attachment' )
			.map( ( t ) => ( { label: t.name, value: t.slug } ) );
	}, [] );

	// Lấy posts để chọn (manual mode)
	const availablePosts = useSelect(
		( select ) => {
			return (
				select( 'core' ).getEntityRecords( 'postType', postType, {
					per_page: 50,
					status: 'publish',
				} ) || []
			);
		},
		[ postType ]
	);

	// Preview posts (auto mode)
	const previewPosts = useSelect(
		( select ) => {
			if ( mode !== 'auto' ) {
				return [];
			}
			return (
				select( 'core' ).getEntityRecords( 'postType', postType, {
					per_page: postsCount,
					status: 'publish',
					orderby: orderBy,
				} ) || []
			);
		},
		[ mode, postType, postsCount, orderBy ]
	);

	const postsToShow =
		mode === 'manual'
			? availablePosts.filter( ( p ) => postIds.includes( p.id ) )
			: previewPosts;

	const updateBadge = ( index, key, value ) => {
		const updated = badges.map( ( b, i ) =>
			i === index ? { ...b, [ key ]: value } : b
		);
		setAttributes( { badges: updated } );
	};

	const addBadge = () => {
		setAttributes( {
			badges: [ ...badges, { label: 'LABEL', sublabel: 'SUBLABEL' } ],
		} );
	};

	const removeBadge = ( index ) => {
		setAttributes( { badges: badges.filter( ( _, i ) => i !== index ) } );
	};

	const togglePost = ( id ) => {
		if ( postIds.includes( id ) ) {
			setAttributes( { postIds: postIds.filter( ( v ) => v !== id ) } );
		} else {
			setAttributes( { postIds: [ ...postIds, id ] } );
		}
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Nội dung', 'laca' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Tiêu đề section', 'laca' ) }
						value={ sectionTitle }
						onChange={ ( v ) =>
							setAttributes( { sectionTitle: v } )
						}
					/>
					<p
						style={ {
							fontWeight: 600,
							marginTop: 12,
							marginBottom: 8,
						} }
					>
						{ __( 'Badges', 'laca' ) }
					</p>
					{ badges.map( ( badge, index ) => (
						<div
							key={ index }
							style={ {
								borderBottom: '1px solid #eee',
								marginBottom: 8,
								paddingBottom: 8,
							} }
						>
							<TextControl
								label={ __( 'Label', 'laca' ) }
								value={ badge.label }
								onChange={ ( v ) =>
									updateBadge( index, 'label', v )
								}
							/>
							<TextControl
								label={ __( 'Sub-label', 'laca' ) }
								value={ badge.sublabel }
								onChange={ ( v ) =>
									updateBadge( index, 'sublabel', v )
								}
							/>
							<Button
								isDestructive
								variant="secondary"
								onClick={ () => removeBadge( index ) }
							>
								{ __( 'Xóa', 'laca' ) }
							</Button>
						</div>
					) ) }
					<Button variant="secondary" onClick={ addBadge }>
						{ __( '+ Thêm badge', 'laca' ) }
					</Button>
					<TextControl
						label={ __( 'CTA Text', 'laca' ) }
						value={ ctaText }
						onChange={ ( v ) => setAttributes( { ctaText: v } ) }
						style={ { marginTop: 12 } }
					/>
					<TextControl
						label={ __( 'CTA URL', 'laca' ) }
						value={ ctaUrl }
						onChange={ ( v ) => setAttributes( { ctaUrl: v } ) }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Dự án', 'laca' ) }
					initialOpen={ false }
				>
					<RadioControl
						label={ __( 'Chế độ', 'laca' ) }
						selected={ mode }
						options={ [
							{ label: 'Tự động', value: 'auto' },
							{ label: 'Thủ công', value: 'manual' },
						] }
						onChange={ ( v ) => setAttributes( { mode: v } ) }
					/>
					{ mode === 'auto' ? (
						<>
							<SelectControl
								label={ __( 'Post Type', 'laca' ) }
								value={ postType }
								options={ postTypes }
								onChange={ ( v ) =>
									setAttributes( { postType: v } )
								}
							/>
							<RangeControl
								label={ __( 'Số lượng', 'laca' ) }
								value={ postsCount }
								onChange={ ( v ) =>
									setAttributes( { postsCount: v } )
								}
								min={ 1 }
								max={ 12 }
							/>
							<SelectControl
								label={ __( 'Sắp xếp theo', 'laca' ) }
								value={ orderBy }
								options={ [
									{ label: 'Ngày đăng', value: 'date' },
									{ label: 'Tiêu đề', value: 'title' },
									{
										label: 'Menu Order',
										value: 'menu_order',
									},
								] }
								onChange={ ( v ) =>
									setAttributes( { orderBy: v } )
								}
							/>
						</>
					) : (
						<>
							<SelectControl
								label={ __( 'Post Type', 'laca' ) }
								value={ postType }
								options={ postTypes }
								onChange={ ( v ) =>
									setAttributes( {
										postType: v,
										postIds: [],
									} )
								}
							/>
							<p style={ { fontWeight: 600, marginBottom: 8 } }>
								{ __( 'Chọn bài viết', 'laca' ) }
							</p>
							{ availablePosts.length === 0 ? (
								<Spinner />
							) : (
								availablePosts.map( ( post ) => (
									<CheckboxControl
										key={ post.id }
										label={
											post.title?.rendered || post.slug
										}
										checked={ postIds.includes( post.id ) }
										onChange={ () => togglePost( post.id ) }
									/>
								) )
							) }
						</>
					) }
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
					block="lacadev/featured-projects-block"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}
