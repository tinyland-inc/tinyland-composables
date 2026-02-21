/**
 * Theme Composable
 *
 * Reactive theme composable for reading theme colors from CSS variables,
 * loading theme CSS, and managing dark mode state.
 */
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
export declare function useTheme(): {
    readonly currentTheme: string;
    readonly darkMode: boolean;
    readonly themes: ThemeConfig[];
    readonly isLoading: boolean;
    readonly themeColors: ThemeColors;
    readonly isAccessible: () => boolean;
    init: (serverSettings?: {
        theme?: string;
        darkMode?: boolean;
    }) => Promise<void>;
    setTheme: (themeName: string) => Promise<void>;
    toggleDarkMode: () => void;
    getContrastRatio: (color1: string, color2: string) => number;
    hexToRgb: (hex: string) => {
        r: number;
        g: number;
        b: number;
    } | null;
    rgbToHsl: (r: number, g: number, b: number) => {
        h: number;
        s: number;
        l: number;
    };
};
//# sourceMappingURL=useTheme.svelte.d.ts.map