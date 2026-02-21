/**
 * Viewport Text Scanner Composable
 *
 * A Svelte 5 composable for efficiently tracking text elements visible
 * in the viewport using IntersectionObserver and MutationObserver.
 */
import { browser } from './browser.js';
const DEFAULT_SELECTORS = 'p, h1, h2, h3, h4, h5, h6, span, a, li, td, th, label, button';
function createSSRStub() {
    return {
        visibleElements: [],
        totalTracked: 0,
        isScanning: false,
        startScanning: () => { },
        pauseScanning: () => { },
        rescan: () => { },
        destroy: () => { }
    };
}
function isElementActuallyVisible(element) {
    let current = element;
    while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        if (style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0') {
            return false;
        }
        current = current.parentElement;
    }
    if (element.closest('[aria-hidden="true"]') ||
        element.closest('[hidden]')) {
        return false;
    }
    return true;
}
function debounce(fn, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId)
            clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
export function useViewportTextScanner(options = {}) {
    if (!browser) {
        return createSSRStub();
    }
    const { root, rootMargin = '100px', threshold = 0.1, selectors = DEFAULT_SELECTORS, debounceMs = 100 } = options;
    let _visibleElements = $state([]);
    let _trackedElements = $state(new Set());
    let _isScanning = $state(false);
    let intersectionObserver = null;
    let mutationObserver = null;
    const handleIntersection = debounce((entries) => {
        const visibleSet = new Set(_visibleElements);
        for (const entry of entries) {
            const element = entry.target;
            if (entry.isIntersecting && isElementActuallyVisible(element)) {
                visibleSet.add(element);
            }
            else {
                visibleSet.delete(element);
            }
        }
        _visibleElements = Array.from(visibleSet);
    }, debounceMs);
    function observeElement(element) {
        if (!intersectionObserver || _trackedElements.has(element)) {
            return;
        }
        _trackedElements.add(element);
        intersectionObserver.observe(element);
    }
    function unobserveElement(element) {
        if (!intersectionObserver || !_trackedElements.has(element)) {
            return;
        }
        _trackedElements.delete(element);
        intersectionObserver.unobserve(element);
        _visibleElements = _visibleElements.filter((el) => el !== element);
    }
    function scanForTextElements() {
        const rootElement = root ?? document.body;
        const elements = rootElement.querySelectorAll(selectors);
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
    const handleMutation = debounce((mutations) => {
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
                        const element = node;
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
    function startScanning() {
        if (_isScanning)
            return;
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
    function pauseScanning() {
        if (!_isScanning)
            return;
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
    function rescan() {
        if (!_isScanning) {
            startScanning();
        }
        else {
            scanForTextElements();
        }
    }
    function destroy() {
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
