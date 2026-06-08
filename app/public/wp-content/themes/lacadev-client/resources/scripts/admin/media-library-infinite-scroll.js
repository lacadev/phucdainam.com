/**
 * Auto-click "Load more" in the Media Library modal when the user scrolls near the bottom.
 *
 * Listens to document scroll in capture phase so the real scroll target is always known
 * (WordPress may attach overflow to .attachments-wrapper, ul.attachments, etc.).
 *
 * Requires the "Load more" button. Filter `media_library_infinite_scrolling` is forced false
 * in app/hooks.php so core keeps that control unless a plugin overrides with priority > 9999.
 */
( function () {
	'use strict';

	const MEDIA_MODAL_SELECTOR = '.media-modal';
	const BOTTOM_THRESHOLD = 220;

	const OVERFLOW_SCAN_SELECTORS = [
		'.attachments-wrapper',
		'ul.attachments',
		'.attachments-browser',
		'.media-frame-content',
	];

	function findLoadMoreButton( modal ) {
		const selectors = [
			'button.load-more',
			'.load-more-wrapper button.load-more',
			'.load-more-wrapper button.button-primary',
			'.load-more-wrapper button',
			'.load-more-wrapper .button',
			'a.load-more',
		];

		for ( const sel of selectors ) {
			const nodes = modal.querySelectorAll( sel );
			for ( const btn of nodes ) {
				if ( isLoadMoreAvailable( btn ) ) {
					return btn;
				}
			}
		}

		return null;
	}

	function isLoadMoreAvailable( button ) {
		if ( ! button ) {
			return false;
		}

		if ( button.disabled ) {
			return false;
		}

		if ( button.getAttribute( 'aria-disabled' ) === 'true' ) {
			return false;
		}

		if ( button.classList.contains( 'hidden' ) ) {
			return false;
		}

		const r = button.getBoundingClientRect();
		if ( r.width < 1 || r.height < 1 ) {
			return false;
		}

		return true;
	}

	function firstOverflowingInModal( modal ) {
		for ( const sel of OVERFLOW_SCAN_SELECTORS ) {
			const inner = modal.querySelector( sel );
			if (
				inner &&
				inner.scrollHeight > inner.clientHeight + 1
			) {
				return inner;
			}
		}
		return null;
	}

	function maybeLoadMore( modal, scrollContainer ) {
		if ( ! scrollContainer || typeof scrollContainer.scrollTop !== 'number' ) {
			return;
		}

		const button = findLoadMoreButton( modal );
		if ( ! button ) {
			return;
		}

		const distanceToBottom =
			scrollContainer.scrollHeight -
			( scrollContainer.scrollTop + scrollContainer.clientHeight );

		if ( distanceToBottom <= BOTTOM_THRESHOLD ) {
			button.click();
		}
	}

	function resolveModalAndScrollTarget( eventTarget ) {
		if ( ! eventTarget ) {
			return { modal: null, scrollEl: null };
		}

		if ( eventTarget.nodeType === 1 ) {
			const el = /** @type {Element} */ ( eventTarget );
			const modalFromEl = el.closest && el.closest( MEDIA_MODAL_SELECTOR );
			if ( modalFromEl && modalFromEl.querySelector( '.attachments-browser' ) ) {
				if ( el.scrollHeight > el.clientHeight + 1 ) {
					return { modal: modalFromEl, scrollEl: el };
				}
				const inner = firstOverflowingInModal( modalFromEl );
				if ( inner ) {
					return { modal: modalFromEl, scrollEl: inner };
				}
				return { modal: modalFromEl, scrollEl: null };
			}
		}

		if (
			eventTarget === document ||
			eventTarget === document.documentElement ||
			eventTarget === document.body
		) {
			const browser = document.querySelector(
				`${ MEDIA_MODAL_SELECTOR } .attachments-browser`
			);
			const modal = browser && browser.closest( MEDIA_MODAL_SELECTOR );
			if ( ! modal ) {
				return { modal: null, scrollEl: null };
			}
			const inner = firstOverflowingInModal( modal );
			return { modal, scrollEl: inner };
		}

		return { modal: null, scrollEl: null };
	}

	let scrollTicking = false;

	function onDocumentScroll( ev ) {
		const { modal, scrollEl } = resolveModalAndScrollTarget( ev.target );
		if ( ! modal || ! scrollEl ) {
			return;
		}

		if ( scrollTicking ) {
			return;
		}
		scrollTicking = true;
		window.requestAnimationFrame( () => {
			maybeLoadMore( modal, scrollEl );
			scrollTicking = false;
		} );
	}

	let debounceTimer = null;

	function scheduleBindModals() {
		if ( debounceTimer !== null ) {
			window.clearTimeout( debounceTimer );
		}
		debounceTimer = window.setTimeout( () => {
			debounceTimer = null;
			const modals = document.querySelectorAll( MEDIA_MODAL_SELECTOR );
			for ( const modal of modals ) {
				if ( ! modal.querySelector( '.attachments-browser' ) ) {
					continue;
				}
				const button = findLoadMoreButton( modal );
				if ( ! button ) {
					continue;
				}
				const inner = firstOverflowingInModal( modal );
				if ( inner ) {
					maybeLoadMore( modal, inner );
				}
			}
		}, 120 );
	}

	function initMediaLibraryInfiniteScroll() {
		document.addEventListener( 'scroll', onDocumentScroll, true );

		scheduleBindModals();

		const observer = new MutationObserver( () => {
			scheduleBindModals();
		} );
		observer.observe( document.body, { childList: true, subtree: true } );

		let tries = 0;
		const iv = window.setInterval( () => {
			tries += 1;
			scheduleBindModals();
			if ( tries >= 40 ) {
				window.clearInterval( iv );
			}
		}, 250 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener(
			'DOMContentLoaded',
			initMediaLibraryInfiniteScroll
		);
	} else {
		initMediaLibraryInfiniteScroll();
	}
} )();
