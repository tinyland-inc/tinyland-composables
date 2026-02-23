









import { browser } from './browser.js';





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





export function useWorker<TRequest = unknown, TResponse = unknown>(config: WorkerConfig) {
	let worker = $state<Worker | null>(null);
	let isReady = $state(false);
	let lastError = $state<Error | null>(null);
	let pendingRequests = $state(0);
	let processingTime = $state(0);

	let messageId = 0;
	const pendingPromises = new Map<
		number,
		{ resolve: (value: TResponse) => void; reject: (error: Error) => void }
	>();

	
	
	

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
		} catch (error) {
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

	
	
	

	function handleMessage(event: MessageEvent<WorkerResponse<TResponse>>) {
		const { id, success, data, error } = event.data;
		const pending = pendingPromises.get(id);

		if (pending) {
			if (success) {
				pending.resolve(data as TResponse);
			} else {
				pending.reject(new Error(error || 'Worker request failed'));
			}
			pendingPromises.delete(id);
			pendingRequests--;
		} else {
			console.warn('[useWorker] Received response for unknown request:', id);
		}
	}

	function handleError(event: ErrorEvent) {
		const error = new Error(event.message);
		console.error('[useWorker] Worker error:', error);
		lastError = error;

		if (config.errorHandler) {
			config.errorHandler(error);
		}
	}

	
	
	

	async function sendMessage(type: string, payload: TRequest): Promise<TResponse> {
		if (!worker || !isReady) {
			throw new Error('Worker not ready');
		}

		const startTime = performance.now();
		const id = ++messageId;
		pendingRequests++;

		return new Promise((resolve, reject) => {
			pendingPromises.set(id, { resolve, reject });

			try {
				worker!.postMessage({ id, type, payload });
			} catch (error) {
				pendingPromises.delete(id);
				pendingRequests--;
				reject(error instanceof Error ? error : new Error(String(error)));
			}

			const updateMetrics = () => {
				processingTime = performance.now() - startTime;
			};

			Promise.allSettled([pendingPromises.get(id) ? pendingPromises.get(id)!.resolve : Promise.resolve()])
				.then(updateMetrics)
				.catch(updateMetrics);
		});
	}

	function postMessage(type: string, payload: TRequest): void {
		if (!worker || !isReady) {
			console.warn('[useWorker] Cannot post message: worker not ready');
			return;
		}

		try {
			worker.postMessage({ id: ++messageId, type, payload });
		} catch (error) {
			console.error('[useWorker] Failed to post message:', error);
		}
	}

	function terminate(): void {
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

	
	
	

	function createReactiveState<U>(
		type: string,
		initialState: U,
		transformer: (value: U) => TRequest = (v) => v as unknown as TRequest
	) {
		let state = $state<U>(initialState);

		$effect(() => {
			if (isReady) {
				postMessage(type, transformer(state));
			}
		});

		return { state };
	}

	function useWorkerResult<T>(fn: () => Promise<T>) {
		let data = $state<T | null>(null);
		let loading = $state(false);
		let error = $state<Error | null>(null);

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





export function useTextWorker(config: WorkerConfig) {
	const baseWorker = useWorker(config);

	async function adjustCharacterColors(payload: {
		characters: Array<{ char_index: number; x: number; y: number; width: number; height: number }>;
		textColors: Array<[number, number, number]>;
		backgroundAtCenter: Array<[number, number, number]>;
		targetContrast: number;
		isLargeText: boolean;
	}): Promise<Array<{ char_index: number; r: number; g: number; b: number }>> {
		const response = await baseWorker.sendMessage('adjust_character_colors', payload) as { adjustedCharacters?: Array<{ char_index: number; r: number; g: number; b: number }> };
		return response.adjustedCharacters || [];
	}

	async function adjustPixels(payload: {
		textPixels: Uint8Array;
		backgroundPixels: Uint8Array;
		width: number;
		height: number;
		targetContrast: number;
		isLargeText: boolean;
	}): Promise<Uint8Array> {
		const response = await baseWorker.sendMessage('adjust_colors', payload) as { adjustedPixels: Uint8Array };
		return response.adjustedPixels;
	}

	return {
		...baseWorker,
		adjustCharacterColors,
		adjustPixels
	};
}
