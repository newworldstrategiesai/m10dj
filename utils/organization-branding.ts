/**
 * Organization Branding Utilities
 * 
 * Functions to retrieve and apply custom branding for organizations
 */

import { createClient } from '@supabase/supabase-js';

export interface OrganizationBranding {
  whiteLabelEnabled: boolean;
  customLogoUrl?: string;
  customFaviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  customDomain?: string;
}

export interface BrandingStyles {
  '--brand-primary': string;
  '--brand-secondary': string;
  '--brand-background': string;
  '--brand-text': string;
  '--brand-font': string;
}

/**
 * Get organization branding by slug
 */
export async function getOrganizationBranding(
  supabaseUrl: string,
  supabaseServiceKey: string,
  slug: string
): Promise<OrganizationBranding | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: organization, error } = await supabase
      .from('organizations')
      .select(`
        white_label_enabled,
        custom_logo_url,
        custom_favicon_url,
        primary_color,
        secondary_color,
        background_color,
        text_color,
        font_family,
        custom_domain
      `)
      .eq('slug', slug)
      .single();

    if (error || !organization) {
      return null;
    }

    return {
      whiteLabelEnabled: organization.white_label_enabled || false,
      customLogoUrl: organization.custom_logo_url || undefined,
      customFaviconUrl: organization.custom_favicon_url || undefined,
      primaryColor: organization.primary_color || '#8B5CF6',
      secondaryColor: organization.secondary_color || '#EC4899',
      backgroundColor: organization.background_color || '#FFFFFF',
      textColor: organization.text_color || '#1F2937',
      fontFamily: organization.font_family || 'system-ui, sans-serif',
      customDomain: organization.custom_domain || undefined,
    };
  } catch (error) {
    console.error('Error getting organization branding:', error);
    return null;
  }
}

/**
 * Get organization branding by ID
 */
export async function getOrganizationBrandingById(
  supabaseUrl: string,
  supabaseServiceKey: string,
  organizationId: string
): Promise<OrganizationBranding | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: organization, error } = await supabase
      .from('organizations')
      .select(`
        white_label_enabled,
        custom_logo_url,
        custom_favicon_url,
        primary_color,
        secondary_color,
        background_color,
        text_color,
        font_family,
        custom_domain
      `)
      .eq('id', organizationId)
      .single();

    if (error || !organization) {
      return null;
    }

    return {
      whiteLabelEnabled: organization.white_label_enabled || false,
      customLogoUrl: organization.custom_logo_url || undefined,
      customFaviconUrl: organization.custom_favicon_url || undefined,
      primaryColor: organization.primary_color || '#8B5CF6',
      secondaryColor: organization.secondary_color || '#EC4899',
      backgroundColor: organization.background_color || '#FFFFFF',
      textColor: organization.text_color || '#1F2937',
      fontFamily: organization.font_family || 'system-ui, sans-serif',
      customDomain: organization.custom_domain || undefined,
    };
  } catch (error) {
    console.error('Error getting organization branding:', error);
    return null;
  }
}

/**
 * Convert branding to CSS custom properties
 */
export function brandingToStyles(branding: OrganizationBranding): BrandingStyles {
  return {
    '--brand-primary': branding.primaryColor,
    '--brand-secondary': branding.secondaryColor,
    '--brand-background': branding.backgroundColor,
    '--brand-text': branding.textColor,
    '--brand-font': branding.fontFamily,
  };
}

/**
 * Get default branding (platform default)
 */
export function getDefaultBranding(): OrganizationBranding {
  return {
    whiteLabelEnabled: false,
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontFamily: 'system-ui, sans-serif',
  };
}

