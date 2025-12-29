/**
 * Shared Components Index
 * 
 * Cross-product components that can be used by:
 * - M10DJCompany.com (flagship)
 * - TipJar.live
 * - DJDash.net
 * 
 * These components are product-agnostic and use the theme system
 * from components/marketing/themes.ts for brand-specific styling.
 */

// Re-export payment components from crowd-request (shared across all products)
export { default as PaymentAmountSelector } from '../crowd-request/PaymentAmountSelector';
export { default as PaymentMethodSelection } from '../crowd-request/PaymentMethodSelection';
export { default as PaymentSuccessScreen } from '../crowd-request/PaymentSuccessScreen';
export { default as LoadingSpinner } from '../crowd-request/LoadingSpinner';

// Re-export marketing utilities
export { productThemes, getProductTheme } from '../marketing/themes';
export type { Product, ProductTheme, MarketingHeaderProps, MarketingFooterProps, FeatureCardProps, PricingCardProps } from '../marketing/types';

// Shared marketing components
export { FeatureCard } from './marketing/FeatureCard';
export { TestimonialCard } from './marketing/TestimonialCard';
export { 
  ProductStructuredData,
  OrganizationSchema,
  SoftwareApplicationSchema,
  FAQSchema,
  BreadcrumbSchema,
  WebsiteSchema,
} from './marketing/StructuredData';

// Future shared components (to be created as needed)
// export { HeroSection } from './marketing/HeroSection';
// export { PricingCard } from './marketing/PricingCard';
// export { CTASection } from './marketing/CTASection';
// export { SocialProofBar } from './marketing/SocialProofBar';

