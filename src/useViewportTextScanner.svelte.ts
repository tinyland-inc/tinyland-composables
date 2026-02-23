






import { browser } from './browser.js';


export interface ViewportScannerOptions {
	
	root?: HTMLElement;
	
	rootMargin?: string;
	
	threshold?: number;
	
	selectors?: string;
	
	debounceMs?: number;
}


export interface UseViewportTextScannerResult {
	readonly visibleElements: HTMLElement[];
	readonly totalTracked: number;
	readonly isScanning: boolean;
	startScanning(): void;
	pauseScanning(): void;
	rescan(): void;
	destroy(): void;
}

const DEFAULT_SELECTORS =
	'p, h1, h2, h3, h4, h5, h6, span, a, li, td, th, label, button';

function createSSRStub(): UseViewportTextScannerResult {
	return {
		visibleElements: [],
		totalTracked: 0,
		isScanning: false,
		startScanning: () => {},
		pauseScanning: () => {},
		rescan: () => {},
		destroy: () => {}
	};
}

function isElementActuallyVisible(element: HTMLElement): boolean {
	let current: HTMLElement | null = element;
	while (current && current !== document.body) {
		const style = window.getComputedStyle(current);
		if (
			style.display === 'none' ||
			style.visibility === 'hidden' ||
			style.opacity === '0'
		) {
			return false;
		}
		current = current.parentElement;
	}

	if (
		element.closest('[aria-hidden="true"]') ||
		element.closest('[hidden]')
	) {
		return false;
	}

	return true;
}

function debounce<T extends (...args: any[]) => void>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	return (...args: Parameters<T>) => {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}

export function useViewportTextScanner(
	options: ViewportScannerOptions = {}
): UseViewportTextScannerResult {
	if (!browser) {
		return createSSRStub();
	}

	const {
		root,
		rootMargin = '100px',
		threshold = 0.1,
		selectors = DEFAULT_SELECTORS,
		debounceMs = 100
	} = options;

	let _visibleElements = $state<HTMLElement[]>([]);
	let _trackedElements = $state<Set<HTMLElement>>(new Set());
	let _isScanning = $state(false);

	let intersectionObserver: IntersectionObserver | null = null;
	let mutationObserver: MutationObserver | null = null;

	const handleIntersection = debounce((entries: IntersectionObserverEntry[]) => {
		const visibleSet = new Set(_visibleElements);

		for (const entry of entries) {
			const element = entry.target as HTMLElement;

			if (entry.isIntersecting && isElementActuallyVisible(element)) {
				visibleSet.add(element);
			} else {
				visibleSet.delete(element);
			}
		}

		_visibleElements = Array.from(visibleSet);
	}, debounceMs);

	function observeElement(element: HTMLElement): void {
		if (!intersectionObserver || _trackedElements.has(element)) {
			return;
		}

		_trackedElements.add(element);
		intersectionObserver.observe(element);
	}

	function unobserveElement(element: HTMLElement): void {
		if (!intersectionObserver || !_trackedElements.has(element)) {
			return;
		}

		_trackedElements.delete(element);
		intersectionObserver.unobserve(element);
		_visibleElements = _visibleElements.filter((el) => el !== element);
	}

	function scanForTextElements(): void {
		const rootElement = root ?? document.body;
		const elements = rootElement.querySelectorAll<HTMLElement>(selectors);

		elements.forEach((element) => {
			if (!_trackedElements.has(element)) {
				observeElement(element);
			}
		});

		const existingElements = new Set(elements);
		_trackedElements.forEach((tracked) => {
			if (!existingElements.has(tracked)) {
				unobserveElement(tracked);
			}
		});
	}

	const handleMutation = debounce((mutations: MutationRecord[]) => {
		let shouldRescan = false;

		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						shouldRescan = true;
					}
				});

				mutation.removedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const element = node as HTMLElement;
						if (_trackedElements.has(element)) {
							unobserveElement(element);
						}
					}
				});
			}
		}

		if (shouldRescan) {
			scanForTextElements();
		}
	}, debounceMs);

	function startScanning(): void {
		if (_isScanning) return;

		intersectionObserver = new IntersectionObserver(handleIntersection, {
			root: root ?? null,
			rootMargin,
			threshold
		});

		mutationObserver = new MutationObserver(handleMutation);
		mutationObserver.observe(root ?? document.body, {
			childList: true,
			subtree: true
		});

		_isScanning = true;
		scanForTextElements();
	}

	function pauseScanning(): void {
		if (!_isScanning) return;

		if (intersectionObserver) {
			intersectionObserver.disconnect();
			intersectionObserver = null;
		}

		if (mutationObserver) {
			mutationObserver.disconnect();
			mutationObserver = null;
		}

		_isScanning = false;
	}

	function rescan(): void {
		if (!_isScanning) {
			startScanning();
		} else {
			scanForTextElements();
		}
	}

	function destroy(): void {
		pauseScanning();
		_trackedElements.clear();
		_visibleElements = [];
	}

	startScanning();

	return {
		get visibleElements() {
			return _visibleElements;
		},
		get totalTracked() {
			return _trackedElements.size;
		},
		get isScanning() {
			return _isScanning;
		},
		startScanning,
		pauseScanning,
		rescan,
		destroy
	};
}
