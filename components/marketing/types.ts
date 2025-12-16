/**
 * Shared marketing component types
 * Used across TipJar, DJ Dash, and M10 DJ Company
 */

export type Product = 'tipjar' | 'djdash' | 'm10dj';

export interface ProductTheme {
  primary: string;
  secondary?: string;
  accent?: string;
  logo: string;
  brandName: string;
  domain: string;
}

export interface MarketingHeaderProps {
  product: Product;
  theme: ProductTheme;
  showSignIn?: boolean;
  showSignUp?: boolean;
  currentPath?: string;
}

export interface MarketingFooterProps {
  product: Product;
  theme: ProductTheme;
  links?: FooterLink[];
}

export interface FooterLink {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

export interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  features: string[];
  cta: {
    text: string;
    href: string;
  };
  highlighted?: boolean;
  product: Product;
}

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  product: Product;
}


