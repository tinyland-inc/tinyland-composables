/**
 * useWorker - Svelte 5 runes-based Web Worker synchronization
 *
 * Implements push-pull reactivity model for worker communication:
 * - PUSH: State changes automatically send messages to worker
 * - PULL: Worker results update reactive state
 * - LIFECYCLE: $effect manages worker creation/cleanup
 * - DERIVED: Computed values from worker data
 */
export interface WorkerMessage<T = unknown> {
    id: number;
    type: string;
    payload: T;
}
export interface WorkerResponse<T = unknown> {
    id: number;
    type: string;
    success: boolean;
    data?: T;
    error?: string;
}
export interface WorkerConfig {
    url: string | URL;
    enabled?: boolean;
    errorHandler?: (error: Error) => void;
}
export declare function useWorker<TRequest = unknown, TResponse = unknown>(config: WorkerConfig): {
    readonly worker: Worker | null;
    readonly isReady: boolean;
    readonly lastError: Error | null;
    readonly pendingRequests: number;
    readonly processingTime: number;
    sendMessage: (type: string, payload: TRequest) => Promise<TResponse>;
    postMessage: (type: string, payload: TRequest) => void;
    terminate: () => void;
    createReactiveState: <U>(type: string, initialState: U, transformer?: (value: U) => TRequest) => {
        state: U;
    };
    useWorkerResult: <T>(fn: () => Promise<T>) => {
        data: T | null;
        loading: boolean;
        error: Error | null;
    };
};
export declare function useTextWorker(config: WorkerConfig): {
    adjustCharacterColors: (payload: {
        characters: Array<{
            char_index: number;
            x: number;
            y: number;
            width: number;
            height: number;
        }>;
        textColors: Array<[number, number, number]>;
        backgroundAtCenter: Array<[number, number, number]>;
        targetContrast: number;
        isLargeText: boolean;
    }) => Promise<Array<{
        char_index: number;
        r: number;
        g: number;
        b: number;
    }>>;
    adjustPixels: (payload: {
        textPixels: Uint8Array;
        backgroundPixels: Uint8Array;
        width: number;
        height: number;
        targetContrast: number;
        isLargeText: boolean;
    }) => Promise<Uint8Array>;
    worker: Worker | null;
    isReady: boolean;
    lastError: Error | null;
    pendingRequests: number;
    processingTime: number;
    sendMessage: (type: string, payload: unknown) => Promise<unknown>;
    postMessage: (type: string, payload: unknown) => void;
    terminate: () => void;
    createReactiveState: <U>(type: string, initialState: U, transformer?: (value: U) => unknown) => {
        state: U;
    };
    useWorkerResult: <T>(fn: () => Promise<T>) => {
        data: T | null;
        loading: boolean;
        error: Error | null;
    };
};
//# sourceMappingURL=useWorker.svelte.d.ts.map