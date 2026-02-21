/**
 * Viewport Text Scanner Composable
 *
 * A Svelte 5 composable for efficiently tracking text elements visible
 * in the viewport using IntersectionObserver and MutationObserver.
 */
/** Configuration options for viewport text scanning */
export interface ViewportScannerOptions {
    /** Root element to scan within (default: document.body) */
    root?: HTMLElement;
    /** Root margin for IntersectionObserver (default: '100px') */
    rootMargin?: string;
    /** Visibility threshold (default: 0.1 = 10% visible) */
    threshold?: number;
    /** Text element selectors (default: 'p, h1, h2, h3, h4, h5, h6, span, a, li, td, th, label, button') */
    selectors?: string;
    /** Debounce time for scan updates (default: 100ms) */
    debounceMs?: number;
}
/** Result interface for the viewport text scanner composable */
export interface UseViewportTextScannerResult {
    readonly visibleElements: HTMLElement[];
    readonly totalTracked: number;
    readonly isScanning: boolean;
    startScanning(): void;
    pauseScanning(): void;
    rescan(): void;
    destroy(): void;
}
export declare function useViewportTextScanner(options?: ViewportScannerOptions): UseViewportTextScannerResult;
//# sourceMappingURL=useViewportTextScanner.svelte.d.ts.map