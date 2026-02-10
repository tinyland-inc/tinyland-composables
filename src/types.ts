/**
 * Type definitions for tinyland-composables
 *
 * Local copies of types that were previously imported from $lib/ paths.
 * These are kept minimal -- only the types actually used by composables.
 */

// =============================================================================
// Color types (from $lib/utils/color/types)
// =============================================================================

/** RGB color with values 0-255 */
export interface RGB {
	r: number;
	g: number;
	b: number;
	a?: number;
}

/** RGBA color (explicit alpha channel) */
export interface RGBA {
	r: number;
	g: number;
	b: number;
	a: number;
}

/** HSL color space */
export interface HSL {
	h: number; // 0-360
	s: number; // 0-100
	l: number; // 0-100
	a?: number;
}

/** Color contrast analysis result */
export interface ColorContrast {
	ratio: number;
	passes: {
		aa: boolean;
		aaa: boolean;
		largeAA: boolean;
		largeAAA: boolean;
	};
}

// =============================================================================
// Color utility function signatures (for dependency injection)
// =============================================================================

/** Functions expected by useColorCalculations */
export interface ColorUtilities {
	parseColor: (color: string) => RGB | null;
	hexToRgb: (hex: string) => RGB | null;
	rgbToHex: (rgb: RGB) => string;
	rgbToHsl: (rgb: RGB) => HSL;
	hslToRgb: (hsl: HSL) => RGB;
	getRelativeLuminance: (rgb: RGB) => number;
	getContrastRatio: (color1: RGB | string, color2: RGB | string) => number;
}

// =============================================================================
// Theme types (from $lib/types/theme)
// =============================================================================

/** Theme configuration */
export interface ThemeConfig {
	name: string;
	label?: string;
	displayName?: string;
	description?: string;
	hasVectors?: boolean;
	isHighContrast?: boolean;
	colors?: string[];
	source?: string;
}

// =============================================================================
// Theme state interface (for useThemeStyles dependency injection)
// =============================================================================

/**
 * Minimal theme state required by useThemeStyles.
 * Replaces the direct import of themeStore singleton.
 */
export interface ThemeState {
	readonly currentTheme: string;
	readonly darkMode: boolean;
	readonly hasVectors: boolean;
}

// =============================================================================
// Consent types (from $lib/components/consent/types)
// =============================================================================

/** Five-category consent system aligned with GDPR requirements */
export interface ConsentCategories {
	essential: boolean;
	preferences: boolean;
	functional: boolean;
	tracking: boolean;
	performance: boolean;
}

/** Consent modal step navigation */
export type ConsentStep = 'welcome' | 'privacy' | 'preferences';

/** Settings that can be restored from Tempo fingerprint history */
export interface RestorableSettings {
	lastKnownLocation: {
		city: string | null;
		country: string;
		latitude: number | null;
		longitude: number | null;
	};
	deviceContext: {
		deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
		browserName: string;
		browserVersion: string;
		os: string;
	};
	lastVisit: {
		pathname: string;
		timestamp: string;
		referrerHostname: string | null;
	};
	userContext: {
		handle: string | null;
		role: string | null;
	};
	a11yPreferences: {
		reducedMotion: boolean;
		highContrast: boolean;
		screenReaderDetected: boolean;
	};
	preferences?: {
		theme?: string;
		darkMode?: 'light' | 'dark' | 'system';
		a11y?: {
			reducedMotion?: boolean;
			highContrast?: boolean;
			fontSize?: 'normal' | 'large' | 'x-large';
		};
	};
	consentCategories?: ConsentCategories;
}

/** Full consent submission payload */
export interface ConsentSubmission {
	categories: ConsentCategories;
	preciseLocation: boolean;
	ageVerified: boolean;
	optionalHandle: string | null;
	preferences: {
		theme: string;
		darkMode: 'light' | 'dark' | 'system';
	};
	resetToDefaults: boolean;
}
