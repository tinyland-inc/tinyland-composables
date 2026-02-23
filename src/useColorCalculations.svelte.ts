







import { browser } from './browser.js';
import type { RGB, HSL, ColorContrast, ColorUtilities } from './types.js';

export type { RGB, HSL, ColorContrast };







export function useColorCalculations(utils?: ColorUtilities) {
	
	const defaultUtils: ColorUtilities = {
		parseColor(color: string): RGB | null {
			
			const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
			if (rgbMatch) {
				return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
			}
			
			const hexResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
			if (hexResult) {
				return {
					r: parseInt(hexResult[1], 16),
					g: parseInt(hexResult[2], 16),
					b: parseInt(hexResult[3], 16)
				};
			}
			return null;
		},
		hexToRgb(hex: string): RGB | null {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result
				? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
				: null;
		},
		rgbToHex(rgb: RGB): string {
			const toHex = (n: number) => {
				const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
				return hex.length === 1 ? '0' + hex : hex;
			};
			return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
		},
		rgbToHsl(rgb: RGB): HSL {
			let r = rgb.r / 255;
			let g = rgb.g / 255;
			let b = rgb.b / 255;
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
			return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
		},
		hslToRgb(hsl: HSL): RGB {
			const { h, s, l } = hsl;
			const sNorm = s / 100;
			const lNorm = l / 100;
			const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
			const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
			const m = lNorm - c / 2;
			let r = 0, g = 0, b = 0;
			if (h < 60) { r = c; g = x; }
			else if (h < 120) { r = x; g = c; }
			else if (h < 180) { g = c; b = x; }
			else if (h < 240) { g = x; b = c; }
			else if (h < 300) { r = x; b = c; }
			else { r = c; b = x; }
			return {
				r: Math.round((r + m) * 255),
				g: Math.round((g + m) * 255),
				b: Math.round((b + m) * 255)
			};
		},
		getRelativeLuminance(rgb: RGB): number {
			const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
				c = c / 255;
				return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
			});
			return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
		},
		getContrastRatio(color1: RGB | string, color2: RGB | string): number {
			const toRgb = (c: RGB | string): RGB | null => {
				if (typeof c === 'object') return c;
				return defaultUtils.parseColor(c);
			};
			const rgb1 = toRgb(color1);
			const rgb2 = toRgb(color2);
			if (!rgb1 || !rgb2) return 1;
			const l1 = defaultUtils.getRelativeLuminance(rgb1);
			const l2 = defaultUtils.getRelativeLuminance(rgb2);
			const lighter = Math.max(l1, l2);
			const darker = Math.min(l1, l2);
			return (lighter + 0.05) / (darker + 0.05);
		}
	};

	const u = utils ?? defaultUtils;

	function parseColor(color: string): RGB | null {
		const parsed = u.parseColor(color);
		if (parsed) return parsed;

		
		if (browser) {
			const div = document.createElement('div');
			div.style.color = color;
			document.body.appendChild(div);
			const computed = getComputedStyle(div).color;
			document.body.removeChild(div);
			return u.parseColor(computed);
		}

		return null;
	}

	function hexToRgb(hex: string): RGB | null {
		try {
			return u.hexToRgb(hex);
		} catch {
			return null;
		}
	}

	function rgbToHex(r: number, g: number, b: number): string {
		return u.rgbToHex({ r, g, b });
	}

	function rgbToHsl(r: number, g: number, b: number): HSL {
		return u.rgbToHsl({ r, g, b });
	}

	function hslToRgb(h: number, s: number, l: number): RGB {
		return u.hslToRgb({ h, s, l });
	}

	function getLuminance(rgb: RGB): number {
		return u.getRelativeLuminance(rgb);
	}

	function getContrastRatio(color1: string, color2: string): ColorContrast {
		const rgb1 = parseColor(color1);
		const rgb2 = parseColor(color2);

		if (!rgb1 || !rgb2) {
			return {
				ratio: 1,
				passes: { aa: false, aaa: false, largeAA: false, largeAAA: false }
			};
		}

		const ratio = u.getContrastRatio(rgb1, rgb2);

		return {
			ratio,
			passes: {
				aa: ratio >= 4.5,
				aaa: ratio >= 7,
				largeAA: ratio >= 3,
				largeAAA: ratio >= 4.5
			}
		};
	}

	function adjustBrightness(color: string, factor: number): string {
		const rgb = parseColor(color);
		if (!rgb) return color;

		const adjusted = {
			r: Math.max(0, Math.min(255, Math.round(rgb.r * factor))),
			g: Math.max(0, Math.min(255, Math.round(rgb.g * factor))),
			b: Math.max(0, Math.min(255, Math.round(rgb.b * factor)))
		};

		return `rgb(${adjusted.r}, ${adjusted.g}, ${adjusted.b})`;
	}

	function mixColors(color1: string, color2: string, weight = 0.5): string {
		const rgb1 = parseColor(color1);
		const rgb2 = parseColor(color2);

		if (!rgb1 || !rgb2) return color1;

		const w1 = weight;
		const w2 = 1 - weight;

		const mixed = {
			r: Math.round(rgb1.r * w1 + rgb2.r * w2),
			g: Math.round(rgb1.g * w1 + rgb2.g * w2),
			b: Math.round(rgb1.b * w1 + rgb2.b * w2)
		};

		return `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`;
	}

	function getComplementary(color: string): string {
		const rgb = parseColor(color);
		if (!rgb) return color;

		const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
		hsl.h = (hsl.h + 180) % 360;

		const complementary = hslToRgb(hsl.h, hsl.s, hsl.l);
		return `rgb(${complementary.r}, ${complementary.g}, ${complementary.b})`;
	}

	function generatePalette(baseColor: string) {
		const rgb = parseColor(baseColor);
		if (!rgb) return [];

		const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

		return {
			lighter: adjustBrightness(baseColor, 1.3),
			light: adjustBrightness(baseColor, 1.15),
			base: baseColor,
			dark: adjustBrightness(baseColor, 0.85),
			darker: adjustBrightness(baseColor, 0.7),
			complementary: getComplementary(baseColor),
			muted: mixColors(baseColor, 'rgb(128, 128, 128)', 0.7),
			vibrant: (() => {
				const vibrantHsl = { ...hsl, s: Math.min(100, hsl.s * 1.2) };
				const vibrantRgb = hslToRgb(vibrantHsl.h, vibrantHsl.s, vibrantHsl.l);
				return `rgb(${vibrantRgb.r}, ${vibrantRgb.g}, ${vibrantRgb.b})`;
			})()
		};
	}

	return {
		parseColor,
		hexToRgb,
		rgbToHex,
		rgbToHsl,
		hslToRgb,
		getLuminance,
		getContrastRatio,
		adjustBrightness,
		mixColors,
		getComplementary,
		generatePalette
	};
}
