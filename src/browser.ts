/**
 * Browser environment detection.
 *
 * Replaces `import { browser } from '$app/environment'` for use
 * outside of SvelteKit. When running inside SvelteKit, consumers
 * can alias this module to $app/environment if preferred.
 */
export const browser: boolean = typeof window !== 'undefined';
