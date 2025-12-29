/**
 * Shared Marketing Components
 * 
 * Product-agnostic marketing components that can be used across:
 * - TipJar.live
 * - DJDash.net
 * - M10DJCompany.com
 * 
 * All components accept a `product` prop to apply brand-specific styling.
 */

export { FeatureCard } from './FeatureCard';
export { TestimonialCard } from './TestimonialCard';
export { 
  ProductStructuredData,
  OrganizationSchema,
  SoftwareApplicationSchema,
  FAQSchema,
  BreadcrumbSchema,
  WebsiteSchema,
} from './StructuredData';

// Re-export types
export type { Product, ProductTheme } from '@/components/marketing/types';

