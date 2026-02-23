





























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

	
	const pending = $derived(state.queue.length);
	const hasErrors = $derived(state.errors.length > 0);
	const isIdle = $derived(!state.isProcessing && state.queue.length === 0);

	






	function enqueue(operation: Omit<QueuedOperation, 'id' | 'createdAt'>, debounce = true): string {
		const id = crypto.randomUUID();
		const fullOperation: QueuedOperation = {
			...operation,
			id,
			createdAt: Date.now(),
			priority: operation.priority ?? 0
		};

		
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

	


	function cancel(operationId: string): void {
		state.queue = state.queue.filter((op) => op.id !== operationId);
	}

	


	function cancelAll(): void {
		debounceTimers.forEach((timer) => clearTimeout(timer));
		debounceTimers.clear();
		state.queue = [];
	}

	


	function clearErrors(): void {
		state.errors = [];
	}

	


	async function flush(): Promise<void> {
		debounceTimers.forEach((timer) => clearTimeout(timer));
		debounceTimers.clear();
		return processQueue();
	}

	return {
		
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

		
		enqueue,
		cancel,
		cancelAll,
		clearErrors,
		flush
	};
}
