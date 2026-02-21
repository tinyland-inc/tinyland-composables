/**
 * Color Calculations Composable
 *
 * Reactive color calculations using Svelte 5 runes.
 * Accepts color utility functions via dependency injection to avoid
 * coupling to specific color library implementations.
 */
import type { RGB, HSL, ColorContrast, ColorUtilities } from './types.js';
export type { RGB, HSL, ColorContrast };
/**
 * Create a color calculations composable with injected color utilities.
 *
 * @param utils - Color utility functions. If omitted, a default set of
 *   inline implementations is used (hex/rgb parsing only, no OKLCH).
 */
export declare function useColorCalculations(utils?: ColorUtilities): {
    parseColor: (color: string) => RGB | null;
    hexToRgb: (hex: string) => RGB | null;
    rgbToHex: (r: number, g: number, b: number) => string;
    rgbToHsl: (r: number, g: number, b: number) => HSL;
    hslToRgb: (h: number, s: number, l: number) => RGB;
    getLuminance: (rgb: RGB) => number;
    getContrastRatio: (color1: string, color2: string) => ColorContrast;
    adjustBrightness: (color: string, factor: number) => string;
    mixColors: (color1: string, color2: string, weight?: number) => string;
    getComplementary: (color: string) => string;
    generatePalette: (baseColor: string) => never[] | {
        lighter: string;
        light: string;
        base: string;
        dark: string;
        darker: string;
        complementary: string;
        muted: string;
        vibrant: string;
    };
};
//# sourceMappingURL=useColorCalculations.svelte.d.ts.map