/**
 * Color contrast utilities for WCAG compliance
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */

/**
 * Calculate relative luminance of a color
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Get a contrast-safe text color for brand yellow
 * Returns darker variant for light backgrounds
 */
export function getContrastSafeBrand(
  background: string = '#ffffff',
  isLargeText: boolean = false
): string {
  const brandYellow = '#fcba00';
  const brandDark = '#a67600'; // brand-800
  
  // Check if brand yellow meets contrast
  if (meetsWCAGAA(brandYellow, background, isLargeText)) {
    return brandYellow;
  }
  
  // Use darker variant
  return brandDark;
}

/**
 * Brand color variants for different contexts
 */
export const brandContrastVariants = {
  // For text on white/light backgrounds - use darker variant
  textOnLight: '#a67600', // brand-800
  // For text on dark backgrounds - use lighter variant
  textOnDark: '#fcba00', // brand-500
  // For large text on white - can use slightly lighter
  textLargeOnLight: '#d19600', // brand-700
  // For backgrounds/accents - original brand color
  background: '#fcba00', // brand-500
};

