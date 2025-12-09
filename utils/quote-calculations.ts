/**
 * Shared utility functions for quote/invoice calculations
 * These functions ensure consistency between the quote page and admin invoice page
 */

export interface PackageLineItem {
  item: string;
  description: string;
  price: number;
}

export interface QuoteData {
  package_id?: string;
  custom_line_items?: PackageLineItem[];
  package_price?: number;
  total_price?: number;
  addons?: any[];
  custom_addons?: any[];
  discount_type?: string | null;
  discount_value?: number | null;
  speaker_rental?: any;
  show_line_item_prices?: boolean;
}

/**
 * Get package breakdown for line items
 * Matches the logic from pages/quote/[id]/invoice.js
 */
export function getPackageBreakdown(packageId: string | null | undefined): PackageLineItem[] {
  if (!packageId) return [];
  
  const breakdowns: { [key: string]: PackageLineItem[] } = {
    // Wedding Package Breakdowns
    'package1': [
      { item: 'Up to 4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 1600 },
      { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
      { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
      { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs.', price: 250 }
    ],
    'package2': [
      { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
      { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
      { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
      { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 }
    ],
    'package3': [
      { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
      { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
      { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
      { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 },
      { item: 'Dancing on the Clouds', description: 'Sophisticated dry ice effect for first dance and special moments. Creates a magical, floor-hugging cloud effect.', price: 500 }
    ],
    // Corporate Package Breakdowns
    'corporate-basics': [
      { item: 'Up to 3 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and music library.', price: 850 }
    ],
    'corporate-package1': [
      { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 945 },
      { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 }
    ],
    'corporate-package2': [
      { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 945 },
      { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 },
      { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 300 }
    ],
    // School Package Breakdowns
    'school-basics': [
      { item: '3 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and age-appropriate music library.', price: 850 }
    ],
    'school-package1': [
      { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and age-appropriate music library.', price: 945 },
      { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 }
    ],
    'school-package2': [
      { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and age-appropriate music library.', price: 945 },
      { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 },
      { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 300 }
    ]
  };
  
  return breakdowns[packageId] || [];
}

/**
 * Get package line items from quote data
 * Uses custom_line_items if available, otherwise falls back to package breakdown
 * Matches the logic from pages/quote/[id]/invoice.js
 */
export function getPackageLineItemsFromQuote(quote: QuoteData | null): PackageLineItem[] {
  if (!quote?.package_id) return [];
  
  // If custom_line_items exist (from admin editing or saved breakdown), use those
  if (quote.custom_line_items && Array.isArray(quote.custom_line_items) && quote.custom_line_items.length > 0) {
    return quote.custom_line_items;
  }
  
  const breakdown = getPackageBreakdown(quote.package_id);
  if (!breakdown || breakdown.length === 0) return [];
  
  // If package was customized, filter out removed features
  if ((quote as any).customized && (quote as any).removed_features && Array.isArray((quote as any).removed_features)) {
    const removedItemNames = (quote as any).removed_features.map((f: any) => f.item?.toLowerCase() || '');
    return breakdown.filter(item => {
      const itemName = item.item?.toLowerCase() || '';
      return !removedItemNames.some((removed: string) => itemName.includes(removed) || removed.includes(itemName));
    });
  }
  
  return breakdown;
}

/**
 * Calculate totals from quote data
 * Matches the logic from pages/quote/[id]/invoice.js calculateTotals()
 */
export function calculateQuoteTotals(quote: QuoteData | null): {
  packagePrice: number;
  speakerRentalPrice: number;
  addonsTotal: number;
  subtotal: number;
  discountAmount: number;
  total: number;
} {
  if (!quote) {
    return { packagePrice: 0, speakerRentalPrice: 0, addonsTotal: 0, subtotal: 0, discountAmount: 0, total: 0 };
  }

  // Package price from quote
  const packagePrice = Number(quote.package_price) || 0;
  
  // Speaker rental price
  let speakerRentalPrice = 0;
  if (quote.speaker_rental) {
    const speakerRental = typeof quote.speaker_rental === 'string' 
      ? JSON.parse(quote.speaker_rental) 
      : quote.speaker_rental;
    if (speakerRental && typeof speakerRental === 'object' && 'price' in speakerRental) {
      speakerRentalPrice = Number(speakerRental.price) || 0;
    }
  }
  
  // Add-ons total
  const addons = quote.addons || quote.custom_addons || [];
  const addonsTotal = addons.reduce((sum: number, addon: any) => {
    const addonPrice = Number(addon.price) || 0;
    const quantity = Number(addon.quantity) || 1;
    return sum + (addonPrice * quantity);
  }, 0);
  
  // Subtotal = package price + speaker rental + addons
  const subtotal = packagePrice + speakerRentalPrice + addonsTotal;
  
  // Calculate discount
  let discountAmount = 0;
  if (quote.discount_type && quote.discount_value && quote.discount_value > 0) {
    if (quote.discount_type === 'percentage') {
      discountAmount = subtotal * (quote.discount_value / 100);
    } else {
      discountAmount = quote.discount_value;
    }
  }
  
  // Total = subtotal - discount
  const total = Math.max(0, subtotal - discountAmount);
  
  return { packagePrice, speakerRentalPrice, addonsTotal, subtotal, discountAmount, total };
}

