/**
 * useWorker - Svelte 5 runes-based Web Worker synchronization
 *
 * Implements push-pull reactivity model for worker communication:
 * - PUSH: State changes automatically send messages to worker
 * - PULL: Worker results update reactive state
 * - LIFECYCLE: $effect manages worker creation/cleanup
 * - DERIVED: Computed values from worker data
 */
import { browser } from './browser.js';
// ============================================================================
// Main Composable
// ============================================================================
export function useWorker(config) {
    let worker = $state(null);
    let isReady = $state(false);
    let lastError = $state(null);
    let pendingRequests = $state(0);
    let processingTime = $state(0);
    let messageId = 0;
    const pendingPromises = new Map();
    // ============================================================================
    // Lifecycle Management
    // ============================================================================
    $effect(() => {
        if (!browser || config.enabled === false) {
            return;
        }
        console.log('[useWorker] Initializing worker:', config.url);
        try {
            worker = new Worker(config.url, { type: 'module' });
            isReady = true;
            lastError = null;
            worker.onmessage = handleMessage;
            worker.onerror = handleError;
            console.log('[useWorker] Worker initialized successfully');
        }
        catch (error) {
            console.error('[useWorker] Failed to initialize worker:', error);
            lastError = error instanceof Error ? error : new Error(String(error));
            isReady = false;
        }
        return () => {
            console.log('[useWorker] Cleaning up worker');
            if (worker) {
                worker.terminate();
                worker = null;
                isReady = false;
            }
            pendingPromises.forEach(({ reject }) => {
                reject(new Error('Worker terminated'));
            });
            pendingPromises.clear();
            pendingRequests = 0;
        };
    });
    // ============================================================================
    // Message Handling
    // ============================================================================
    function handleMessage(event) {
        const { id, success, data, error } = event.data;
        const pending = pendingPromises.get(id);
        if (pending) {
            if (success) {
                pending.resolve(data);
            }
            else {
                pending.reject(new Error(error || 'Worker request failed'));
            }
            pendingPromises.delete(id);
            pendingRequests--;
        }
        else {
            console.warn('[useWorker] Received response for unknown request:', id);
        }
    }
    function handleError(event) {
        const error = new Error(event.message);
        console.error('[useWorker] Worker error:', error);
        lastError = error;
        if (config.errorHandler) {
            config.errorHandler(error);
        }
    }
    // ============================================================================
    // Worker Communication
    // ============================================================================
    async function sendMessage(type, payload) {
        if (!worker || !isReady) {
            throw new Error('Worker not ready');
        }
        const startTime = performance.now();
        const id = ++messageId;
        pendingRequests++;
        return new Promise((resolve, reject) => {
            pendingPromises.set(id, { resolve, reject });
            try {
                worker.postMessage({ id, type, payload });
            }
            catch (error) {
                pendingPromises.delete(id);
                pendingRequests--;
                reject(error instanceof Error ? error : new Error(String(error)));
            }
            const updateMetrics = () => {
                processingTime = performance.now() - startTime;
            };
            Promise.allSettled([pendingPromises.get(id) ? pendingPromises.get(id).resolve : Promise.resolve()])
                .then(updateMetrics)
                .catch(updateMetrics);
        });
    }
    function postMessage(type, payload) {
        if (!worker || !isReady) {
            console.warn('[useWorker] Cannot post message: worker not ready');
            return;
        }
        try {
            worker.postMessage({ id: ++messageId, type, payload });
        }
        catch (error) {
            console.error('[useWorker] Failed to post message:', error);
        }
    }
    function terminate() {
        if (worker) {
            worker.terminate();
            worker = null;
            isReady = false;
            lastError = null;
            pendingRequests = 0;
            pendingPromises.forEach(({ reject }) => {
                reject(new Error('Worker terminated'));
            });
            pendingPromises.clear();
        }
    }
    // ============================================================================
    // Reactive Utilities - Push-Pull Pattern
    // ============================================================================
    function createReactiveState(type, initialState, transformer = (v) => v) {
        let state = $state(initialState);
        $effect(() => {
            if (isReady) {
                postMessage(type, transformer(state));
            }
        });
        return { state };
    }
    function useWorkerResult(fn) {
        let data = $state(null);
        let loading = $state(false);
        let error = $state(null);
        $effect(() => {
            if (isReady) {
                loading = true;
                error = null;
                fn()
                    .then((result) => {
                    data = result;
                    loading = false;
                })
                    .catch((err) => {
                    error = err instanceof Error ? err : new Error(String(err));
                    loading = false;
                });
            }
        });
        return { data, loading, error };
    }
    // ============================================================================
    // Return API
    // ============================================================================
    return {
        get worker() { return worker; },
        get isReady() { return isReady; },
        get lastError() { return lastError; },
        get pendingRequests() { return pendingRequests; },
        get processingTime() { return processingTime; },
        sendMessage,
        postMessage,
        terminate,
        createReactiveState,
        useWorkerResult
    };
}
// ============================================================================
// Specialized Workers for Text Processing
// ============================================================================
export function useTextWorker(config) {
    const baseWorker = useWorker(config);
    async function adjustCharacterColors(payload) {
        const response = await baseWorker.sendMessage('adjust_character_colors', payload);
        return response.adjustedCharacters || [];
    }
    async function adjustPixels(payload) {
        const response = await baseWorker.sendMessage('adjust_colors', payload);
        return response.adjustedPixels;
    }
    return {
        ...baseWorker,
        adjustCharacterColors,
        adjustPixels
    };
}
