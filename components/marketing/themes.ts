/**
 * Product theme configurations
 * Centralized theme definitions for all products
 */

import { Product, ProductTheme } from './types';

export const productThemes: Record<Product, ProductTheme> = {
  tipjar: {
    primary: 'purple',
    secondary: 'pink',
    accent: 'purple',
    logo: '/tipjar-logo.svg',
    brandName: 'TipJar.Live',
    domain: 'tipjar.live',
  },
  djdash: {
    primary: 'blue',
    secondary: 'indigo',
    accent: 'blue',
    logo: '/djdash-logo.svg',
    brandName: 'DJ Dash',
    domain: 'djdash.com',
  },
  m10dj: {
    primary: 'black',
    secondary: 'gold',
    accent: 'yellow',
    logo: '/logo-static.jpg',
    brandName: 'M10 DJ Company',
    domain: 'm10djcompany.com',
  },
};

export function getProductTheme(product: Product): ProductTheme {
  return productThemes[product];
}




