











export interface RGB {
	r: number;
	g: number;
	b: number;
	a?: number;
}


export interface RGBA {
	r: number;
	g: number;
	b: number;
	a: number;
}


export interface HSL {
	h: number; 
	s: number; 
	l: number; 
	a?: number;
}


export interface ColorContrast {
	ratio: number;
	passes: {
		aa: boolean;
		aaa: boolean;
		largeAA: boolean;
		largeAAA: boolean;
	};
}






export interface ColorUtilities {
	parseColor: (color: string) => RGB | null;
	hexToRgb: (hex: string) => RGB | null;
	rgbToHex: (rgb: RGB) => string;
	rgbToHsl: (rgb: RGB) => HSL;
	hslToRgb: (hsl: HSL) => RGB;
	getRelativeLuminance: (rgb: RGB) => number;
	getContrastRatio: (color1: RGB | string, color2: RGB | string) => number;
}






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









export interface ThemeState {
	readonly currentTheme: string;
	readonly darkMode: boolean;
	readonly hasVectors: boolean;
}






export interface ConsentCategories {
	essential: boolean;
	preferences: boolean;
	functional: boolean;
	tracking: boolean;
	performance: boolean;
}


export type ConsentStep = 'welcome' | 'privacy' | 'preferences';


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
