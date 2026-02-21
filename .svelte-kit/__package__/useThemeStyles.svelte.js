/**
 * Theme Styles Composable
 *
 * Dynamic style generation using Svelte 5 runes.
 *
 * REFACTORED: Accepts theme state as a parameter instead of importing
 * themeStore directly. This breaks the circular dependency between
 * stores and composables.
 *
 * @example
 * ```typescript
 * import { themeStore } from './lib/stores/themeStore.svelte';
 *
 * // Pass the store as the theme state parameter
 * const styles = useThemeStyles({
 *   get currentTheme() { return themeStore.currentTheme; },
 *   get darkMode() { return themeStore.darkMode; },
 *   get hasVectors() { return themeStore.hasVectors; }
 * });
 * ```
 */
import { browser } from './browser.js';
export function useThemeStyles(themeState) {
    // Reactive CSS variable values
    let cssVariables = $state({});
    // Generate dynamic styles based on theme
    let dynamicStyles = $derived.by(() => {
        const theme = themeState.currentTheme;
        const isDark = themeState.darkMode;
        // Base transitions for theme changes
        const transitions = `
			.theme-transitioning * {
				transition: background-color 300ms ease-in-out,
				            color 300ms ease-in-out,
				            border-color 300ms ease-in-out,
				            fill 300ms ease-in-out,
				            stroke 300ms ease-in-out !important;
			}
		`;
        // Glassmorphism effects
        const glassEffects = `
			.glass {
				backdrop-filter: blur(16px) saturate(180%);
				-webkit-backdrop-filter: blur(16px) saturate(180%);
				background-color: ${isDark ? 'rgba(17, 25, 40, 0.75)' : 'rgba(255, 255, 255, 0.75)'};
				border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.125)' : 'rgba(209, 213, 219, 0.3)'};
			}

			.glass-subtle {
				backdrop-filter: blur(8px) saturate(150%);
				-webkit-backdrop-filter: blur(8px) saturate(150%);
				background-color: ${isDark ? 'rgba(17, 25, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
				border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(209, 213, 219, 0.2)'};
			}

			.glass-heavy {
				backdrop-filter: blur(24px) saturate(200%);
				-webkit-backdrop-filter: blur(24px) saturate(200%);
				background-color: ${isDark ? 'rgba(17, 25, 40, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
				border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(209, 213, 219, 0.4)'};
			}

			.sidebar-glassmorphic {
				backdrop-filter: blur(12px) saturate(180%);
				-webkit-backdrop-filter: blur(12px) saturate(180%);
				background-color: ${isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.9)'};
			}

			.header-glassmorphic {
				backdrop-filter: blur(10px) saturate(180%);
				-webkit-backdrop-filter: blur(10px) saturate(180%);
				background-color: ${isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
			}
		`;
        // Theme-specific enhancements
        const themeEnhancements = theme === 'high-contrast' ? `
			/* High contrast mode enhancements */
			.btn:focus,
			button:focus,
			a:focus,
			input:focus,
			textarea:focus,
			select:focus {
				outline: 3px solid ${isDark ? 'oklch(var(--color-surface-100))' : 'oklch(var(--color-surface-900))'} !important;
				outline-offset: 2px !important;
			}

			.text-surface-600 dark:text-surface-300 {
				color: ${isDark ? 'oklch(var(--color-surface-100))' : 'oklch(var(--color-surface-900))'} !important;
			}

			.vectors-background {
				display: none !important;
			}
		` : '';
        // Vector background styles
        const vectorStyles = themeState.hasVectors ? `
			.vectors-background {
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				z-index: 0;
				pointer-events: none;
			}

			.vectors-background svg {
				width: 100%;
				height: 100%;
			}
		` : '';
        // Hamburger menu animations
        const hamburgerStyles = `
			.hamburger-line {
				background-color: currentColor;
				transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
			}

			.btn-hamburger-menu {
				background-color: ${isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.8)'};
				backdrop-filter: blur(8px);
				-webkit-backdrop-filter: blur(8px);
			}

			.btn-hamburger-menu:hover {
				background-color: ${isDark ? 'rgba(51, 65, 85, 0.9)' : 'rgba(241, 245, 249, 0.9)'};
			}
		`;
        // Accessibility scorer styles
        const accessibilityStyles = `
			.accessibility-scorer {
				backdrop-filter: blur(12px) saturate(180%);
				-webkit-backdrop-filter: blur(12px) saturate(180%);
				background-color: ${isDark ? 'rgba(17, 25, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
			}
		`;
        return `
			${transitions}
			${glassEffects}
			${themeEnhancements}
			${vectorStyles}
			${hamburgerStyles}
			${accessibilityStyles}
		`;
    });
    // Get computed CSS variable value
    function getCSSVariable(varName) {
        if (!browser)
            return '';
        const root = document.documentElement;
        const computed = getComputedStyle(root);
        return computed.getPropertyValue(varName).trim();
    }
    // Set CSS variable
    function setCSSVariable(varName, value) {
        if (!browser)
            return;
        document.documentElement.style.setProperty(varName, value);
        cssVariables[varName] = value;
    }
    // Batch update CSS variables
    function updateCSSVariables(variables) {
        if (!browser)
            return;
        const root = document.documentElement;
        Object.entries(variables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        cssVariables = { ...cssVariables, ...variables };
    }
    // Create style element with dynamic content
    function createStyleElement(id, content) {
        if (!browser)
            return null;
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }
        const style = document.createElement('style');
        style.id = id;
        style.textContent = content;
        document.head.appendChild(style);
        return style;
    }
    // Apply dynamic styles
    function applyDynamicStyles() {
        createStyleElement('theme-dynamic-styles', dynamicStyles);
    }
    // Watch for theme changes and apply styles
    $effect(() => {
        // Re-apply styles when theme or dark mode changes
        void themeState.currentTheme;
        void themeState.darkMode;
        if (browser) {
            applyDynamicStyles();
        }
    });
    return {
        // State
        get cssVariables() { return cssVariables; },
        get dynamicStyles() { return dynamicStyles; },
        // Methods
        getCSSVariable,
        setCSSVariable,
        updateCSSVariables,
        createStyleElement,
        applyDynamicStyles
    };
}
