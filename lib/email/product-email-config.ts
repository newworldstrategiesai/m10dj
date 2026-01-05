/**
 * Product-Aware Email Configuration
 * Returns the correct "from" email address based on product context
 * Supports: TipJar.live, DJDash.net, M10DJCompany.com
 */

export type ProductContext = 'tipjar' | 'djdash' | 'm10dj';

/**
 * Get the "from" email address for a product context
 */
export function getProductFromEmail(productContext: ProductContext | null | undefined): string {
  // Default to tipjar if not specified
  const context = productContext || 'tipjar';

  // Check for product-specific environment variables first
  switch (context) {
    case 'tipjar':
      return process.env.RESEND_FROM_EMAIL_TIPJAR || 
             process.env.RESEND_FROM_EMAIL || 
             'TipJar <noreply@tipjar.live>';
    
    case 'djdash':
      return process.env.RESEND_FROM_EMAIL_DJDASH || 
             process.env.RESEND_FROM_EMAIL || 
             'DJ Dash <noreply@djdash.net>';
    
    case 'm10dj':
      return process.env.RESEND_FROM_EMAIL_M10DJ || 
             process.env.RESEND_FROM_EMAIL || 
             'M10 DJ Company <noreply@m10djcompany.com>';
    
    default:
      return process.env.RESEND_FROM_EMAIL || 'TipJar <noreply@tipjar.live>';
  }
}

/**
 * Get the product name for email content
 */
export function getProductName(productContext: ProductContext | null | undefined): string {
  const context = productContext || 'tipjar';
  
  switch (context) {
    case 'tipjar':
      return 'TipJar';
    case 'djdash':
      return 'DJ Dash';
    case 'm10dj':
      return 'M10 DJ Company';
    default:
      return 'TipJar';
  }
}

/**
 * Get the product domain for email content
 */
export function getProductDomain(productContext: ProductContext | null | undefined): string {
  const context = productContext || 'tipjar';
  
  switch (context) {
    case 'tipjar':
      return 'tipjar.live';
    case 'djdash':
      return 'djdash.net';
    case 'm10dj':
      return 'm10djcompany.com';
    default:
      return 'tipjar.live';
  }
}

/**
 * Get the product base URL for email links
 */
export function getProductBaseUrl(productContext: ProductContext | null | undefined): string {
  const context = productContext || 'tipjar';
  
  switch (context) {
    case 'tipjar':
      return process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://tipjar.live';
    case 'djdash':
      return process.env.NEXT_PUBLIC_DJDASH_URL || 'https://djdash.net';
    case 'm10dj':
      return process.env.NEXT_PUBLIC_M10DJ_URL || 'https://m10djcompany.com';
    default:
      return process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
  }
}

