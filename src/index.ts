/**
 * @tinyland-inc/tinyland-composables
 *
 * Svelte 5 rune-based composables for reactive state management,
 * lifecycle utilities, theming, and Web Worker synchronization.
 */

// Types
export type {
	RGB,
	RGBA,
	HSL,
	ColorContrast,
	ColorUtilities,
	ThemeConfig,
	ThemeState,
	ConsentCategories,
	ConsentStep,
	ConsentSubmission,
	RestorableSettings
} from './types.js';

// Browser detection
export { browser } from './browser.js';

// Composables
export { useBulkSelection } from './useBulkSelection.svelte.js';
export { useColorCalculations } from './useColorCalculations.svelte.js';
export { useConsentState } from './useConsentState.svelte.js';
export { useDraftPersistence } from './useDraftPersistence.svelte.js';
export { useEditorQueue } from './useEditorQueue.svelte.js';
export { useLifecycle } from './useLifecycle.svelte.js';
export { useTheme } from './useTheme.svelte.js';
export type { ThemeColors } from './useTheme.svelte.js';
export { useThemeStyles } from './useThemeStyles.svelte.js';
export { useViewportTextScanner } from './useViewportTextScanner.svelte.js';
export type { ViewportScannerOptions, UseViewportTextScannerResult } from './useViewportTextScanner.svelte.js';
export { useWorker, useTextWorker } from './useWorker.svelte.js';
export type { WorkerMessage, WorkerResponse, WorkerConfig } from './useWorker.svelte.js';
