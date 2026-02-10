/**
 * Theme Composable
 *
 * Reactive theme composable for reading theme colors from CSS variables,
 * loading theme CSS, and managing dark mode state.
 */

import { browser } from './browser.js';
import type { ThemeConfig } from './types.js';

/** Theme colors based on CSS variables */
export interface ThemeColors {
	primary: string;
	secondary: string;
	tertiary: string;
	surface: string;
	background: string;
	text: string;
	header: string;
}

export function useTheme() {
	let currentTheme = $state<string>('tinyland');
	let darkMode = $state<boolean>(false);
	let themes = $state<ThemeConfig[]>([]);
	let loadedThemes = $state<Set<string>>(new Set(['tinyland']));
	let isLoading = $state<boolean>(false);

	// Derived theme colors from CSS variables
	let themeColors = $derived<ThemeColors>(() => {
		if (!browser) {
			return {
				primary: '',
				secondary: '',
				tertiary: '',
				surface: '',
				background: '',
				text: '',
				header: ''
			};
		}

		const root = document.documentElement;
		const style = getComputedStyle(root);

		return {
			primary: style.getPropertyValue('--color-primary-500').trim() || 'rgb(59, 130, 246)',
			secondary: style.getPropertyValue('--color-secondary-500').trim() || 'rgb(168, 85, 247)',
			tertiary: style.getPropertyValue('--color-tertiary-500').trim() || 'rgb(34, 197, 94)',
			surface: style.getPropertyValue('--color-surface-500').trim() || 'rgb(148, 163, 184)',
			background: style.getPropertyValue('--color-surface-50').trim() || 'rgb(248, 250, 252)',
			text: style.getPropertyValue('--color-surface-900').trim() || 'rgb(15, 23, 42)',
			header: style.getPropertyValue('--color-primary-700').trim() || 'rgb(29, 78, 216)'
		};
	});

	// Color utilities
	function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
		r /= 255;
		g /= 255;
		b /= 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h = 0;
		let s = 0;
		const l = (max + min) / 2;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
				case g: h = ((b - r) / d + 2) / 6; break;
				case b: h = ((r - g) / d + 4) / 6; break;
			}
		}

		return {
			h: Math.round(h * 360),
			s: Math.round(s * 100),
			l: Math.round(l * 100)
		};
	}

	// Contrast ratio calculation
	function getContrastRatio(color1: string, color2: string): number {
		const getLuminance = (rgb: string) => {
			const match = rgb.match(/\d+/g);
			if (!match || match.length < 3) return 0;

			const [r, g, b] = match.map(Number);
			const [rs, gs, bs] = [r, g, b].map(c => {
				c = c / 255;
				return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
			});

			return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
		};

		const l1 = getLuminance(color1);
		const l2 = getLuminance(color2);
		const lighter = Math.max(l1, l2);
		const darker = Math.min(l1, l2);

		return (lighter + 0.05) / (darker + 0.05);
	}

	let isAccessible = $derived(() => {
		const bgColor = darkMode ? 'rgb(15, 23, 42)' : 'rgb(248, 250, 252)';
		const textColor = darkMode ? 'rgb(248, 250, 252)' : 'rgb(15, 23, 42)';
		const ratio = getContrastRatio(bgColor, textColor);
		return ratio >= 4.5;
	});

	// Load theme CSS dynamically
	async function loadThemeCSS(themeName: string) {
		if (!browser) return;

		try {
			isLoading = true;

			document.querySelectorAll('style[data-theme-css]').forEach(style => {
				if (style.getAttribute('data-theme-css') !== themeName) {
					style.remove();
				}
			});

			if (loadedThemes.has(themeName)) {
				return;
			}

			const response = await fetch(`/api/theme-css/${themeName}`);
			if (!response.ok) throw new Error(`Failed to load theme ${themeName}`);

			const css = await response.text();

			const style = document.createElement('style');
			style.setAttribute('data-theme-css', themeName);
			style.textContent = css;
			document.head.appendChild(style);

			loadedThemes = new Set([...loadedThemes, themeName]);
		} catch (err) {
			console.error(`Failed to load theme CSS for ${themeName}:`, err);
		} finally {
			isLoading = false;
		}
	}

	// Set theme
	async function setTheme(themeName: string) {
		if (!browser || currentTheme === themeName) return;

		await loadThemeCSS(themeName);

		const root = document.documentElement;

		root.classList.add('theme-transitioning');

		requestAnimationFrame(() => {
			root.setAttribute('data-theme', themeName);
			root.className = root.className.replace(/theme-\S+/g, '').trim();
			root.classList.add(`theme-${themeName}`);

			if (darkMode) {
				root.classList.add('dark');
			}

			currentTheme = themeName;

			window.dispatchEvent(new CustomEvent('theme-change', {
				detail: { theme: themeName }
			}));

			setTimeout(() => {
				root.classList.remove('theme-transitioning');
			}, 300);
		});
	}

	// Toggle dark mode
	function toggleDarkMode() {
		if (!browser) return;

		const root = document.documentElement;
		root.classList.add('theme-transitioning');

		darkMode = !darkMode;

		if (darkMode) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}

		window.dispatchEvent(new CustomEvent('dark-mode-change', {
			detail: { darkMode }
		}));

		setTimeout(() => {
			root.classList.remove('theme-transitioning');
		}, 300);
	}

	// Initialize theme from server-provided settings
	async function init(serverSettings?: { theme?: string; darkMode?: boolean }) {
		if (!browser) return;

		const initialTheme = serverSettings?.theme || 'trans';
		const initialDarkMode = serverSettings?.darkMode ?? true;

		currentTheme = initialTheme;
		darkMode = initialDarkMode;

		await loadThemeCSS(initialTheme);

		document.documentElement.setAttribute('data-theme', initialTheme);
		document.documentElement.classList.toggle('dark', initialDarkMode);

		try {
			const response = await fetch('/api/themes');
			if (response.ok) {
				themes = await response.json();
			}
		} catch (err) {
			console.error('Failed to load themes:', err);
		}
	}

	return {
		// State
		get currentTheme() { return currentTheme; },
		get darkMode() { return darkMode; },
		get themes() { return themes; },
		get isLoading() { return isLoading; },
		get themeColors() { return themeColors; },
		get isAccessible() { return isAccessible; },

		// Methods
		init,
		setTheme,
		toggleDarkMode,
		getContrastRatio,
		hexToRgb,
		rgbToHsl
	};
}
