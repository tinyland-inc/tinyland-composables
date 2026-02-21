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
import type { ThemeState } from './types.js';
export declare function useThemeStyles(themeState: ThemeState): {
    readonly cssVariables: Record<string, string>;
    readonly dynamicStyles: string;
    getCSSVariable: (varName: string) => string;
    setCSSVariable: (varName: string, value: string) => void;
    updateCSSVariables: (variables: Record<string, string>) => void;
    createStyleElement: (id: string, content: string) => HTMLStyleElement | null;
    applyDynamicStyles: () => void;
};
//# sourceMappingURL=useThemeStyles.svelte.d.ts.map