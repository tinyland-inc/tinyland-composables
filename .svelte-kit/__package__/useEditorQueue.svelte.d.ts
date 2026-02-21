/**
 * Editor Operation Queue with Debouncing
 *
 * Prevents race conditions during rapid editor updates by:
 * - Queueing operations for serial execution
 * - Debouncing rapid changes by operation type
 * - Supporting priority-based execution
 * - Providing error tracking and recovery
 *
 * @example
 * ```typescript
 * const queue = useEditorQueue({ debounceMs: 1500 });
 *
 * // Add operation (will be debounced)
 * queue.enqueue({
 *   type: 'autosave',
 *   execute: async () => { await saveDraft(); },
 *   onSuccess: () => console.log('Saved'),
 *   onError: (err) => console.error('Failed', err)
 * });
 *
 * // Add high-priority operation (executes first)
 * queue.enqueue({
 *   type: 'publish',
 *   execute: async () => { await publishContent(); },
 *   priority: 10
 * }, false); // No debounce for publish
 * ```
 */
interface QueuedOperation {
    id: string;
    type: 'save' | 'autosave' | 'publish' | 'draft';
    execute: () => Promise<void>;
    onError?: (error: unknown) => void;
    onSuccess?: () => void;
    priority?: number;
    createdAt: number;
}
/**
 * Create an editor operation queue with debouncing
 *
 * @param options Configuration options
 * @param options.debounceMs Milliseconds to debounce operations (default: 1500)
 * @param options.maxErrors Maximum errors to keep in history (default: 10)
 */
export declare function useEditorQueue(options?: {
    debounceMs?: number;
    maxErrors?: number;
}): {
    readonly pending: number;
    readonly isProcessing: boolean;
    readonly hasErrors: boolean;
    readonly isIdle: boolean;
    readonly errors: {
        id: string;
        error: unknown;
        timestamp: number;
    }[];
    enqueue: (operation: Omit<QueuedOperation, "id" | "createdAt">, debounce?: boolean) => string;
    cancel: (operationId: string) => void;
    cancelAll: () => void;
    clearErrors: () => void;
    flush: () => Promise<void>;
};
export {};
//# sourceMappingURL=useEditorQueue.svelte.d.ts.map