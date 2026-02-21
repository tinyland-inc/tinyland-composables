/**
 * Lifecycle Management Composable
 *
 * Auto-cleanup lifecycle management using Svelte 5 patterns.
 * Provides safe wrappers for timers, event listeners, observers,
 * and other resources that require cleanup on component destroy.
 */
type CleanupFunction = () => void;
interface EventOptions extends AddEventListenerOptions {
    target?: EventTarget;
}
export declare function useLifecycle(): {
    readonly mounted: boolean;
    addCleanup: (fn: CleanupFunction) => () => void;
    addEventListener: {
        <K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => void, options?: EventOptions): CleanupFunction;
        (type: string, listener: EventListener, options?: EventOptions): CleanupFunction;
    };
    setTimer: (callback: () => void, delay: number) => CleanupFunction;
    setIntervalTimer: (callback: () => void, interval: number) => CleanupFunction;
    requestFrame: (callback: FrameRequestCallback) => CleanupFunction;
    animationLoop: (callback: (deltaTime: number, timestamp: number) => void) => CleanupFunction;
    observeIntersection: (element: Element, callback: (entry: IntersectionObserverEntry) => void, options?: IntersectionObserverInit) => CleanupFunction;
    observeResize: (element: Element, callback: (entry: ResizeObserverEntry) => void) => CleanupFunction;
    watchMediaQuery: (query: string, callback: (matches: boolean) => void) => CleanupFunction;
    debounce: <T extends (...args: any[]) => void>(fn: T, delay: number) => T & {
        cancel: () => void;
    };
    throttle: <T extends (...args: any[]) => void>(fn: T, limit: number) => T & {
        cancel: () => void;
    };
    cleanup: () => void;
};
export {};
//# sourceMappingURL=useLifecycle.svelte.d.ts.map