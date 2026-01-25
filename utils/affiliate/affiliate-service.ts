import { createClient } from '@/utils/supabase/server';
import { createClient as createClientDirect } from '@supabase/supabase-js';

export interface AffiliateData {
  id: string;
  user_id: string;
  organization_id: string;
  affiliate_code: string;
  display_name?: string;
  bio?: string;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  commission_rate: number;
  platform_fee_rate: number;
  lifetime_value: number;
  total_earned: number;
  total_paid: number;
  pending_balance: number;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  payout_threshold: number;
  payout_frequency: 'weekly' | 'monthly' | 'quarterly';
  auto_payout: boolean;
  custom_landing_page: boolean;
  marketing_materials_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralData {
  id: string;
  affiliate_id: string;
  referred_user_id?: string;
  referred_organization_id?: string;
  referral_code: string;
  referral_source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  conversion_status: 'clicked' | 'signed_up' | 'subscribed' | 'first_payment' | 'active_user';
  converted_at?: string;
  conversion_value: number;
  commission_eligible: boolean;
  commission_rate?: number;
  commission_expires_at?: string;
  total_commissions_earned: number;
  total_commissions_paid: number;
  referrer_ip?: string;
  referrer_user_agent?: string;
  click_metadata?: any;
  first_clicked_at: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionData {
  id: string;
  affiliate_id: string;
  referral_id: string;
  amount: number;
  commission_type: 'subscription_monthly' | 'subscription_setup' | 'platform_fee' | 'upgrade_bonus' | 'referral_bonus';
  source_table?: string;
  source_transaction_id?: string;
  source_amount?: number;
  commission_rate?: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled' | 'disputed';
  payout_batch_id?: string;
  payout_date?: string;
  payout_transaction_id?: string;
  disputed: boolean;
  dispute_reason?: string;
  dispute_resolved_at?: string;
  dispute_resolution_notes?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  paid_at?: string;
}

export class AffiliateService {
  private supabase: any;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Generate a unique affiliate code for a user
   */
  async generateAffiliateCode(userId: string, baseName?: string): Promise<string> {
    try {
      // Get user's organization info for base name
      const { data: org } = await this.supabase
        .from('organizations')
        .select('name')
        .eq('user_id', userId)
        .single();

      const base = baseName || org?.name || 'AFFILIATE';
      const cleanBase = base.replace(/[^A-Z0-9]/gi, '_').toUpperCase();

      // Generate unique code with retry logic
      let attempts = 0;
      let code = '';

      while (attempts < 10) {
        const suffix = Math.floor(Math.random() * 900 + 100);
        code = `${cleanBase}_${suffix}`;

        const { data: existing } = await this.supabase
          .from('affiliates')
          .select('id')
          .eq('affiliate_code', code)
          .single();

        if (!existing) break;
        attempts++;
      }

      if (attempts >= 10) {
        throw new Error('Could not generate unique affiliate code');
      }

      return code;
    } catch (error) {
      console.error('Error generating affiliate code:', error);
      throw error;
    }
  }

  /**
   * Create or get affiliate account for a user
   */
  async getOrCreateAffiliate(userId: string): Promise<AffiliateData> {
    try {
      // Check if user already has an affiliate account
      const { data: existing, error: fetchError } = await this.supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing && !fetchError) {
        return existing;
      }

      // Create new affiliate account
      const affiliateCode = await this.generateAffiliateCode(userId);

      const { data: affiliate, error: createError } = await this.supabase
        .from('affiliates')
        .insert({
          user_id: userId,
          affiliate_code: affiliateCode,
          status: 'active', // Auto-approve for now
          commission_rate: 25.00,
          platform_fee_rate: 10.00,
          payout_threshold: 25.00,
          payout_frequency: 'monthly',
          auto_payout: true,
          marketing_materials_access: true
        })
        .select()
        .single();

      if (createError) throw createError;

      // Link affiliate to user's organization
      const { data: org } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (org) {
        await this.supabase
          .from('affiliates')
          .update({ organization_id: org.id })
          .eq('id', affiliate.id);
      }

      return affiliate;
    } catch (error) {
      console.error('Error creating/getting affiliate:', error);
      throw error;
    }
  }

  /**
   * Track affiliate referral click
   */
  async trackReferralClick(
    affiliateCode: string,
    metadata: {
      ip?: string;
      userAgent?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      referrer?: string;
    } = {}
  ): Promise<string> {
    try {
      // Find affiliate by code
      const { data: affiliate, error: affiliateError } = await this.supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single();

      if (affiliateError || !affiliate) {
        throw new Error('Invalid affiliate code');
      }

      // Create referral tracking record
      const { data: referral, error: referralError } = await this.supabase
        .from('affiliate_referrals')
        .insert({
          affiliate_id: affiliate.id,
          referral_code: affiliateCode,
          referral_source: metadata.utmMedium === 'social' ? 'social_media' :
                          metadata.utmMedium === 'email' ? 'email' :
                          metadata.utmMedium === 'qr' ? 'qr_code' : 'direct_link',
          utm_source: metadata.utmSource,
          utm_medium: metadata.utmMedium,
          utm_campaign: metadata.utmCampaign,
          referrer_ip: metadata.ip,
          referrer_user_agent: metadata.userAgent,
          click_metadata: {
            referrer: metadata.referrer,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (referralError) throw referralError;

      // Update affiliate click count
      await this.supabase
        .from('affiliates')
        .update({
          total_clicks: this.supabase.raw('total_clicks + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', affiliate.id);

      return referral.id;
    } catch (error) {
      console.error('Error tracking referral click:', error);
      throw error;
    }
  }

  /**
   * Convert referral to signup
   */
  async convertReferral(referralId: string, userId: string, organizationId?: string): Promise<void> {
    try {
      // Update referral with conversion data
      const { error: updateError } = await this.supabase
        .from('affiliate_referrals')
        .update({
          referred_user_id: userId,
          referred_organization_id: organizationId,
          conversion_status: 'signed_up',
          converted_at: new Date().toISOString(),
          commission_eligible: true,
          commission_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        })
        .eq('id', referralId);

      if (updateError) throw updateError;

      // Update affiliate stats
      const { data: referral } = await this.supabase
        .from('affiliate_referrals')
        .select('affiliate_id')
        .eq('id', referralId)
        .single();

      if (referral) {
        await this.supabase
          .from('affiliates')
          .update({
            total_signups: this.supabase.raw('total_signups + 1'),
            updated_at: new Date().toISOString()
          })
          .eq('id', referral.affiliate_id);
      }

      // Link organization to affiliate
      if (organizationId) {
        await this.supabase
          .from('organizations')
          .update({
            referred_by_affiliate_id: referral.affiliate_id,
            affiliate_attribution: {
              referral_id: referralId,
              converted_at: new Date().toISOString()
            }
          })
          .eq('id', organizationId);
      }
    } catch (error) {
      console.error('Error converting referral:', error);
      throw error;
    }
  }

  /**
   * Get affiliate dashboard data
   */
  async getAffiliateDashboard(affiliateId: string): Promise<{
    affiliate: AffiliateData;
    recentReferrals: ReferralData[];
    recentCommissions: CommissionData[];
    stats: {
      totalClicks: number;
      totalSignups: number;
      totalConversions: number;
      conversionRate: number;
      pendingBalance: number;
      totalEarned: number;
      totalPaid: number;
    };
  }> {
    try {
      // Get affiliate data
      const { data: affiliate, error: affiliateError } = await this.supabase
        .from('affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single();

      if (affiliateError || !affiliate) {
        throw new Error('Affiliate not found');
      }

      // Get recent referrals
      const { data: referrals } = await this.supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent commissions
      const { data: commissions } = await this.supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate stats
      const stats = {
        totalClicks: affiliate.total_clicks,
        totalSignups: affiliate.total_signups,
        totalConversions: affiliate.total_conversions,
        conversionRate: affiliate.total_clicks > 0 ? (affiliate.total_conversions / affiliate.total_clicks) * 100 : 0,
        pendingBalance: affiliate.pending_balance,
        totalEarned: affiliate.total_earned,
        totalPaid: affiliate.total_paid
      };

      return {
        affiliate,
        recentReferrals: referrals || [],
        recentCommissions: commissions || [],
        stats
      };
    } catch (error) {
      console.error('Error getting affiliate dashboard:', error);
      throw error;
    }
  }

  /**
   * Get affiliate by code
   */
  async getAffiliateByCode(code: string): Promise<AffiliateData | null> {
    try {
      const { data, error } = await this.supabase
        .from('affiliates')
        .select('*')
        .eq('affiliate_code', code)
        .eq('status', 'active')
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting affiliate by code:', error);
      return null;
    }
  }

  /**
   * Update affiliate settings
   */
  async updateAffiliateSettings(affiliateId: string, updates: Partial<AffiliateData>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('affiliates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', affiliateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating affiliate settings:', error);
      throw error;
    }
  }
}