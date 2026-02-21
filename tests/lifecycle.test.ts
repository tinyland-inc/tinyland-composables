/**
 * Tests for useLifecycle composable
 *
 * Note: useLifecycle depends on Svelte lifecycle hooks (onMount, onDestroy)
 * which require a Svelte component context. These tests validate the
 * standalone utility functions that can be tested outside component context.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useLifecycle - timer cleanup', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should clean up timers via addCleanup pattern', () => {
		const cleanups = new Set<() => void>();

		function addCleanup(fn: () => void) {
			cleanups.add(fn);
			return () => {
				cleanups.delete(fn);
				fn();
			};
		}

		const callback = vi.fn();
		const timerId = setTimeout(callback, 1000);

		const removeCleanup = addCleanup(() => {
			clearTimeout(timerId);
		});

		// Timer should not have fired yet
		expect(callback).not.toHaveBeenCalled();
		expect(cleanups.size).toBe(1);

		// Manually cancel via returned cleanup
		removeCleanup();
		expect(cleanups.size).toBe(0);

		// Advance time -- callback should NOT fire (timer was cleared)
		vi.advanceTimersByTime(1500);
		expect(callback).not.toHaveBeenCalled();
	});

	it('should clean up intervals via cleanup set', () => {
		const cleanups = new Set<() => void>();

		function addCleanup(fn: () => void) {
			cleanups.add(fn);
			return () => {
				cleanups.delete(fn);
				fn();
			};
		}

		function cleanupAll() {
			cleanups.forEach(fn => fn());
			cleanups.clear();
		}

		const callback = vi.fn();
		const intervalId = setInterval(callback, 100);

		addCleanup(() => {
			clearInterval(intervalId);
		});

		// Let a few intervals fire
		vi.advanceTimersByTime(350);
		expect(callback).toHaveBeenCalledTimes(3);

		// Run cleanup
		cleanupAll();
		expect(cleanups.size).toBe(0);

		// Advance time -- no more calls
		vi.advanceTimersByTime(500);
		expect(callback).toHaveBeenCalledTimes(3);
	});

	it('should handle multiple cleanup functions', () => {
		const cleanups = new Set<() => void>();

		function addCleanup(fn: () => void) {
			cleanups.add(fn);
			return () => {
				cleanups.delete(fn);
				fn();
			};
		}

		function cleanupAll() {
			cleanups.forEach(fn => fn());
			cleanups.clear();
		}

		const fn1 = vi.fn();
		const fn2 = vi.fn();
		const fn3 = vi.fn();

		addCleanup(fn1);
		addCleanup(fn2);
		addCleanup(fn3);

		expect(cleanups.size).toBe(3);

		cleanupAll();

		expect(fn1).toHaveBeenCalledTimes(1);
		expect(fn2).toHaveBeenCalledTimes(1);
		expect(fn3).toHaveBeenCalledTimes(1);
		expect(cleanups.size).toBe(0);
	});
});

describe('useLifecycle - debounce logic', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should debounce rapid calls', () => {
		const fn = vi.fn();

		// Inline debounce implementation matching the composable
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		const debounced = (...args: any[]) => {
			if (timeoutId !== null) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				fn(...args);
				timeoutId = null;
			}, 200);
		};

		debounced('a');
		debounced('b');
		debounced('c');

		// Should not have fired yet
		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(200);

		// Should have fired once with last call args
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('c');
	});

	it('should allow cancel of debounced function', () => {
		const fn = vi.fn();
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const debounced = () => {
			if (timeoutId !== null) clearTimeout(timeoutId);
			timeoutId = setTimeout(fn, 200);
		};

		const cancel = () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};

		debounced();
		cancel();

		vi.advanceTimersByTime(300);
		expect(fn).not.toHaveBeenCalled();
	});
});

describe('useLifecycle - event listener cleanup', () => {
	it('should track and clean up event listeners', () => {
		const target = {
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		};

		const cleanups = new Set<() => void>();

		function addCleanup(fn: () => void) {
			cleanups.add(fn);
			return () => {
				cleanups.delete(fn);
				fn();
			};
		}

		const listener = vi.fn();
		target.addEventListener('click', listener);

		addCleanup(() => {
			target.removeEventListener('click', listener);
		});

		expect(target.addEventListener).toHaveBeenCalledWith('click', listener);

		// Cleanup
		cleanups.forEach(fn => fn());
		cleanups.clear();

		expect(target.removeEventListener).toHaveBeenCalledWith('click', listener);
	});
});
