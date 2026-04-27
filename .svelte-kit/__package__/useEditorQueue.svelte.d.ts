interface QueuedOperation {
    id: string;
    type: 'save' | 'autosave' | 'publish' | 'draft';
    execute: () => Promise<void>;
    onError?: (error: unknown) => void;
    onSuccess?: () => void;
    priority?: number;
    createdAt: number;
}
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