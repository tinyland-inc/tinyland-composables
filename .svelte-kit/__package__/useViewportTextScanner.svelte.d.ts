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
export declare function useViewportTextScanner(options?: ViewportScannerOptions): UseViewportTextScannerResult;
//# sourceMappingURL=useViewportTextScanner.svelte.d.ts.map