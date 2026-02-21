/**
 * Lifecycle Management Composable
 *
 * Auto-cleanup lifecycle management using Svelte 5 patterns.
 * Provides safe wrappers for timers, event listeners, observers,
 * and other resources that require cleanup on component destroy.
 */
import { onMount, onDestroy } from 'svelte';
import { browser } from './browser.js';
export function useLifecycle() {
    const cleanupFunctions = new Set();
    let mounted = $state(false);
    function addCleanup(fn) {
        cleanupFunctions.add(fn);
        return () => {
            cleanupFunctions.delete(fn);
            fn();
        };
    }
    function addEventListener(type, listener, options = {}) {
        if (!browser)
            return () => { };
        const { target = window, ...listenerOptions } = options;
        target.addEventListener(type, listener, listenerOptions);
        return addCleanup(() => {
            target.removeEventListener(type, listener, listenerOptions);
        });
    }
    // Safe setTimeout with automatic cleanup
    function setTimer(callback, delay) {
        if (!browser)
            return () => { };
        const timerId = setTimeout(callback, delay);
        return addCleanup(() => {
            clearTimeout(timerId);
        });
    }
    // Safe setInterval with automatic cleanup
    function setIntervalTimer(callback, interval) {
        if (!browser)
            return () => { };
        const intervalId = setInterval(callback, interval);
        return addCleanup(() => {
            clearInterval(intervalId);
        });
    }
    // Safe requestAnimationFrame with automatic cleanup
    function requestFrame(callback) {
        if (!browser)
            return () => { };
        let frameId = requestAnimationFrame(callback);
        return addCleanup(() => {
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
                frameId = null;
            }
        });
    }
    // Animation loop with automatic cleanup
    function animationLoop(callback) {
        if (!browser)
            return () => { };
        let lastTime = performance.now();
        let animationId = null;
        let running = true;
        const animate = (timestamp) => {
            if (!running)
                return;
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            callback(deltaTime, timestamp);
            if (running) {
                animationId = requestAnimationFrame(animate);
            }
        };
        animationId = requestAnimationFrame(animate);
        return addCleanup(() => {
            running = false;
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        });
    }
    // Intersection observer with automatic cleanup
    function observeIntersection(element, callback, options) {
        if (!browser || !element)
            return () => { };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(callback);
        }, options);
        observer.observe(element);
        return addCleanup(() => {
            observer.disconnect();
        });
    }
    // Resize observer with automatic cleanup
    function observeResize(element, callback) {
        if (!browser || !element || typeof ResizeObserver === 'undefined')
            return () => { };
        const observer = new ResizeObserver((entries) => {
            entries.forEach(callback);
        });
        observer.observe(element);
        return addCleanup(() => {
            observer.disconnect();
        });
    }
    // Media query listener with automatic cleanup
    function watchMediaQuery(query, callback) {
        if (!browser)
            return () => { };
        const mediaQuery = window.matchMedia(query);
        // Call immediately with current state
        callback(mediaQuery.matches);
        const handler = (e) => callback(e.matches);
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
            return addCleanup(() => {
                mediaQuery.removeEventListener('change', handler);
            });
        }
        // Legacy API fallback
        mediaQuery.addListener(handler);
        return addCleanup(() => {
            mediaQuery.removeListener(handler);
        });
    }
    // Debounced function with automatic cleanup
    function debounce(fn, delay) {
        let timeoutId = null;
        const debounced = ((...args) => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                fn(...args);
                timeoutId = null;
            }, delay);
        });
        debounced.cancel = () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };
        addCleanup(debounced.cancel);
        return debounced;
    }
    // Throttled function with automatic cleanup
    function throttle(fn, limit) {
        let inThrottle = false;
        let lastArgs = null;
        let timeoutId = null;
        const throttled = ((...args) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                timeoutId = setTimeout(() => {
                    inThrottle = false;
                    if (lastArgs !== null) {
                        throttled(...lastArgs);
                        lastArgs = null;
                    }
                }, limit);
            }
            else {
                lastArgs = args;
            }
        });
        throttled.cancel = () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            inThrottle = false;
            lastArgs = null;
        };
        addCleanup(throttled.cancel);
        return throttled;
    }
    // Run all cleanup functions
    function cleanup() {
        cleanupFunctions.forEach(fn => fn());
        cleanupFunctions.clear();
    }
    // Setup lifecycle hooks
    onMount(() => {
        mounted = true;
    });
    onDestroy(() => {
        mounted = false;
        cleanup();
    });
    return {
        // State
        get mounted() { return mounted; },
        // Methods
        addCleanup,
        addEventListener,
        setTimer,
        setIntervalTimer,
        requestFrame,
        animationLoop,
        observeIntersection,
        observeResize,
        watchMediaQuery,
        debounce,
        throttle,
        cleanup
    };
}
