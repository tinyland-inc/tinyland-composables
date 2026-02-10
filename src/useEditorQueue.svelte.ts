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

interface EditorQueueState {
	queue: QueuedOperation[];
	isProcessing: boolean;
	lastProcessed: string | null;
	errors: Array<{ id: string; error: unknown; timestamp: number }>;
}

/**
 * Create an editor operation queue with debouncing
 *
 * @param options Configuration options
 * @param options.debounceMs Milliseconds to debounce operations (default: 1500)
 * @param options.maxErrors Maximum errors to keep in history (default: 10)
 */
export function useEditorQueue(options?: { debounceMs?: number; maxErrors?: number }) {
	const DEBOUNCE_MS = options?.debounceMs ?? 1500;
	const MAX_ERRORS = options?.maxErrors ?? 10;

	let state = $state<EditorQueueState>({
		queue: [],
		isProcessing: false,
		lastProcessed: null,
		errors: []
	});

	let debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

	// Derived state
	const pending = $derived(state.queue.length);
	const hasErrors = $derived(state.errors.length > 0);
	const isIdle = $derived(!state.isProcessing && state.queue.length === 0);

	/**
	 * Enqueue an operation for execution
	 *
	 * @param operation Operation to enqueue
	 * @param debounce Whether to debounce this operation (default: true)
	 * @returns Operation ID for tracking/cancellation
	 */
	function enqueue(operation: Omit<QueuedOperation, 'id' | 'createdAt'>, debounce = true): string {
		const id = crypto.randomUUID();
		const fullOperation: QueuedOperation = {
			...operation,
			id,
			createdAt: Date.now(),
			priority: operation.priority ?? 0
		};

		// Cancel existing debounce for same type
		if (debounce && debounceTimers.has(operation.type)) {
			clearTimeout(debounceTimers.get(operation.type)!);
		}

		if (debounce) {
			debounceTimers.set(
				operation.type,
				setTimeout(() => {
					addToQueue(fullOperation);
					debounceTimers.delete(operation.type);
				}, DEBOUNCE_MS)
			);
		} else {
			addToQueue(fullOperation);
		}

		return id;
	}

	/**
	 * Add operation to queue with priority sorting
	 */
	function addToQueue(operation: QueuedOperation): void {
		const insertIndex = state.queue.findIndex((op) => (op.priority ?? 0) < (operation.priority ?? 0));
		if (insertIndex === -1) {
			state.queue = [...state.queue, operation];
		} else {
			state.queue = [
				...state.queue.slice(0, insertIndex),
				operation,
				...state.queue.slice(insertIndex)
			];
		}
		processQueue();
	}

	/**
	 * Process queued operations serially
	 */
	async function processQueue(): Promise<void> {
		if (state.isProcessing || state.queue.length === 0) return;
		state.isProcessing = true;

		while (state.queue.length > 0) {
			const operation = state.queue[0];
			try {
				await operation.execute();
				operation.onSuccess?.();
				state.lastProcessed = operation.id;
			} catch (error) {
				operation.onError?.(error);
				state.errors = [
					{ id: operation.id, error, timestamp: Date.now() },
					...state.errors.slice(0, MAX_ERRORS - 1)
				];
			}
			state.queue = state.queue.slice(1);
		}

		state.isProcessing = false;
	}

	/**
	 * Cancel a specific operation by ID
	 */
	function cancel(operationId: string): void {
		state.queue = state.queue.filter((op) => op.id !== operationId);
	}

	/**
	 * Cancel all pending operations and clear debounce timers
	 */
	function cancelAll(): void {
		debounceTimers.forEach((timer) => clearTimeout(timer));
		debounceTimers.clear();
		state.queue = [];
	}

	/**
	 * Clear error history
	 */
	function clearErrors(): void {
		state.errors = [];
	}

	/**
	 * Flush all debounced operations immediately and process queue
	 */
	async function flush(): Promise<void> {
		debounceTimers.forEach((timer) => clearTimeout(timer));
		debounceTimers.clear();
		return processQueue();
	}

	return {
		// State (read-only)
		get pending() {
			return pending;
		},
		get isProcessing() {
			return state.isProcessing;
		},
		get hasErrors() {
			return hasErrors;
		},
		get isIdle() {
			return isIdle;
		},
		get errors() {
			return state.errors;
		},

		// Actions
		enqueue,
		cancel,
		cancelAll,
		clearErrors,
		flush
	};
}
