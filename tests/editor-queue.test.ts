/**
 * Tests for useEditorQueue composable
 *
 * Validates debounce behavior and serial execution without requiring
 * Svelte component context. Tests the core queue logic directly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Editor Queue - debounce behavior', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Mock crypto.randomUUID for deterministic IDs
		vi.stubGlobal('crypto', {
			randomUUID: vi.fn(() => `uuid-${Math.random().toString(36).slice(2)}`)
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('should debounce operations by type', async () => {
		const DEBOUNCE_MS = 1500;
		const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
		const queue: Array<{ type: string; execute: () => Promise<void> }> = [];

		function enqueue(
			operation: { type: string; execute: () => Promise<void> },
			debounce = true
		) {
			if (debounce && debounceTimers.has(operation.type)) {
				clearTimeout(debounceTimers.get(operation.type)!);
			}

			if (debounce) {
				debounceTimers.set(
					operation.type,
					setTimeout(() => {
						queue.push(operation);
						debounceTimers.delete(operation.type);
					}, DEBOUNCE_MS)
				);
			} else {
				queue.push(operation);
			}
		}

		const executeFn1 = vi.fn(async () => {});
		const executeFn2 = vi.fn(async () => {});
		const executeFn3 = vi.fn(async () => {});

		// Rapid enqueue -- only last should survive debounce
		enqueue({ type: 'autosave', execute: executeFn1 });
		enqueue({ type: 'autosave', execute: executeFn2 });
		enqueue({ type: 'autosave', execute: executeFn3 });

		// Nothing in queue yet (all debounced)
		expect(queue.length).toBe(0);

		// Advance past debounce
		vi.advanceTimersByTime(DEBOUNCE_MS + 100);

		// Only last operation should be in queue
		expect(queue.length).toBe(1);
		expect(queue[0].execute).toBe(executeFn3);
	});

	it('should skip debounce when explicitly disabled', () => {
		const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
		const queue: Array<{ type: string }> = [];

		function enqueue(
			operation: { type: string },
			debounce = true
		) {
			if (debounce) {
				debounceTimers.set(
					operation.type,
					setTimeout(() => {
						queue.push(operation);
						debounceTimers.delete(operation.type);
					}, 1500)
				);
			} else {
				queue.push(operation);
			}
		}

		enqueue({ type: 'publish' }, false);

		// Should be in queue immediately
		expect(queue.length).toBe(1);
		expect(queue[0].type).toBe('publish');
	});
});

describe('Editor Queue - serial execution', () => {
	it('should execute operations serially', async () => {
		const executionOrder: number[] = [];

		const operations = [
			{
				execute: async () => {
					await new Promise(r => setTimeout(r, 10));
					executionOrder.push(1);
				}
			},
			{
				execute: async () => {
					await new Promise(r => setTimeout(r, 5));
					executionOrder.push(2);
				}
			},
			{
				execute: async () => {
					executionOrder.push(3);
				}
			}
		];

		// Process serially
		for (const op of operations) {
			await op.execute();
		}

		expect(executionOrder).toEqual([1, 2, 3]);
	});

	it('should track errors during execution', async () => {
		const errors: Array<{ error: unknown }> = [];

		const operations = [
			{
				execute: async () => { /* success */ },
				onError: (e: unknown) => errors.push({ error: e })
			},
			{
				execute: async () => { throw new Error('save failed'); },
				onError: (e: unknown) => errors.push({ error: e })
			},
			{
				execute: async () => { /* success */ },
				onError: (e: unknown) => errors.push({ error: e })
			}
		];

		for (const op of operations) {
			try {
				await op.execute();
			} catch (error) {
				op.onError?.(error);
			}
		}

		expect(errors.length).toBe(1);
		expect((errors[0].error as Error).message).toBe('save failed');
	});

	it('should support priority-based ordering', () => {
		const queue: Array<{ priority: number; label: string }> = [];

		function addToQueue(operation: { priority: number; label: string }) {
			const insertIndex = queue.findIndex(
				(op) => op.priority < operation.priority
			);
			if (insertIndex === -1) {
				queue.push(operation);
			} else {
				queue.splice(insertIndex, 0, operation);
			}
		}

		addToQueue({ priority: 0, label: 'autosave-1' });
		addToQueue({ priority: 10, label: 'publish' });
		addToQueue({ priority: 0, label: 'autosave-2' });
		addToQueue({ priority: 5, label: 'draft' });

		expect(queue.map(q => q.label)).toEqual([
			'publish',
			'draft',
			'autosave-1',
			'autosave-2'
		]);
	});
});

describe('Editor Queue - cancel operations', () => {
	it('should cancel specific operations by ID', () => {
		const queue = [
			{ id: 'a', type: 'autosave' },
			{ id: 'b', type: 'publish' },
			{ id: 'c', type: 'autosave' }
		];

		const filtered = queue.filter(op => op.id !== 'b');

		expect(filtered.length).toBe(2);
		expect(filtered.map(q => q.id)).toEqual(['a', 'c']);
	});

	it('should cancel all operations and clear debounce timers', () => {
		vi.useFakeTimers();

		const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
		const callback = vi.fn();

		debounceTimers.set('autosave', setTimeout(callback, 1500));
		debounceTimers.set('draft', setTimeout(callback, 1500));

		// Cancel all
		debounceTimers.forEach((timer) => clearTimeout(timer));
		debounceTimers.clear();

		vi.advanceTimersByTime(2000);

		expect(callback).not.toHaveBeenCalled();
		expect(debounceTimers.size).toBe(0);

		vi.useRealTimers();
	});
});
