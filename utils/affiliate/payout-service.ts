import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface PayoutRequest {
  affiliateId: string;
  amount: number;
  commissions: Array<{
    id: string;
    amount: number;
  }>;
}

export interface StripeAccountInfo {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
}

export class AffiliatePayoutService {
  private supabase: any;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Get Stripe account information for an affiliate
   */
  async getStripeAccount(affiliateId: string): Promise<StripeAccountInfo | null> {
    try {
      // Get affiliate's Stripe account ID
      const { data: affiliate } = await this.supabase
        .from('affiliates')
        .select('stripe_account_id')
        .eq('id', affiliateId)
        .single();

      if (!affiliate?.stripe_account_id) {
        return null;
      }

      const account = await stripe.accounts.retrieve(affiliate.stripe_account_id);
      const requirements = account.requirements;
      return {
        id: account.id,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        requirements: {
          currently_due: requirements?.currently_due || [],
          eventually_due: requirements?.eventually_due || [],
          past_due: requirements?.past_due || [],
          pending_verification: requirements?.pending_verification || []
        }
      };
    } catch (error) {
      console.error('Error getting Stripe account:', error);
      return null;
    }
  }

  /**
   * Create Stripe Connect account for affiliate
   */
  async createStripeAccount(affiliateId: string, email: string, country: string = 'US'): Promise<string> {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: false },
          transfers: { requested: true },
        },
        business_type: 'individual', // Most affiliates are individuals
        metadata: {
          affiliate_id: affiliateId,
          platform: 'tipjar_affiliate'
        }
      });

      // Store the Stripe account ID
      await this.supabase
        .from('affiliates')
        .update({
          stripe_account_id: account.id,
          stripe_account_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', affiliateId);

      return account.id;
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      throw error;
    }
  }

  /**
   * Create account onboarding link
   */
  async createAccountLink(stripeAccountId: string, refreshUrl: string, returnUrl: string): Promise<string> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw error;
    }
  }

  /**
   * Process affiliate payout
   */
  async processPayout(request: PayoutRequest): Promise<{ transferId: string; payoutId: string }> {
    try {
      // Get affiliate's Stripe account
      const { data: affiliate } = await this.supabase
        .from('affiliates')
        .select('stripe_account_id, stripe_account_status')
        .eq('id', request.affiliateId)
        .single();

      if (!affiliate?.stripe_account_id) {
        throw new Error('Affiliate does not have a Stripe account');
      }

      if (affiliate.stripe_account_status !== 'active') {
        throw new Error('Affiliate Stripe account is not active');
      }

      // Create a transfer to the affiliate's Stripe account
      const transfer = await stripe.transfers.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: 'usd',
        destination: affiliate.stripe_account_id,
        metadata: {
          affiliate_id: request.affiliateId,
          commission_count: request.commissions.length,
          platform: 'tipjar_affiliate'
        }
      });

      // Create payout batch record
      const { data: batch } = await this.supabase
        .from('affiliate_payout_batches')
        .insert({
          batch_reference: `AFF_PAYOUT_${Date.now()}`,
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          total_commissions: request.amount,
          total_fees: 0, // No fees for affiliate payouts
          total_payout: request.amount,
          commission_count: request.commissions.length,
          status: 'completed',
          processed_at: new Date().toISOString(),
          stripe_batch_id: transfer.id
        })
        .select()
        .single();

      // Update commission records
      const commissionIds = request.commissions.map(c => c.id);
      await this.supabase
        .from('affiliate_commissions')
        .update({
          status: 'paid',
          payout_batch_id: batch.id,
          payout_date: new Date().toISOString().split('T')[0],
          payout_transaction_id: transfer.id,
          paid_at: new Date().toISOString()
        })
        .in('id', commissionIds);

      // Update affiliate stats
      await this.supabase
        .from('affiliates')
        .update({
          total_paid: this.supabase.raw(`total_paid + ${request.amount}`),
          pending_balance: this.supabase.raw(`pending_balance - ${request.amount}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.affiliateId);

      return {
        transferId: transfer.id,
        payoutId: batch.id
      };

    } catch (error) {
      console.error('Error processing affiliate payout:', error);
      throw error;
    }
  }

  /**
   * Process monthly automatic payouts
   */
  async processMonthlyPayouts(): Promise<void> {
    try {
      console.log('Starting monthly affiliate payouts...');

      // Get affiliates eligible for automatic payouts
      const { data: affiliates } = await this.supabase
        .from('affiliates')
        .select('*')
        .eq('status', 'active')
        .eq('auto_payout', true)
        .gt('pending_balance', this.supabase.raw('payout_threshold'))
        .not('stripe_account_id', 'is', null);

      if (!affiliates || affiliates.length === 0) {
        console.log('No affiliates eligible for automatic payout');
        return;
      }

      let totalPayouts = 0;
      let totalAffiliates = 0;

      for (const affiliate of affiliates) {
        try {
          // Verify Stripe account is active
          const accountInfo = await this.getStripeAccount(affiliate.id);
          if (!accountInfo?.payouts_enabled) {
            console.log(`Skipping affiliate ${affiliate.affiliate_code} - payouts not enabled`);
            continue;
          }

          // Get pending commissions
          const { data: commissions } = await this.supabase
            .from('affiliate_commissions')
            .select('id, amount')
            .eq('affiliate_id', affiliate.id)
            .eq('status', 'approved')
            .is('payout_date', null);

          if (!commissions || commissions.length === 0) continue;

          const payoutAmount = commissions.reduce((sum: number, comm: any) =>
            sum + parseFloat(comm.amount), 0
          );

          // Only payout if above threshold
          if (payoutAmount < affiliate.payout_threshold) continue;

          // Process the payout
          await this.processPayout({
            affiliateId: affiliate.id,
            amount: payoutAmount,
            commissions: commissions
          });

          totalPayouts += payoutAmount;
          totalAffiliates++;

          console.log(`Processed payout of $${payoutAmount.toFixed(2)} for affiliate ${affiliate.affiliate_code}`);

        } catch (error) {
          console.error(`Error processing payout for affiliate ${affiliate.id}:`, error);
        }
      }

      console.log(`Monthly payouts completed: ${totalAffiliates} affiliates paid $${totalPayouts.toFixed(2)}`);

    } catch (error) {
      console.error('Error processing monthly payouts:', error);
    }
  }

  /**
   * Handle Stripe webhook for account updates
   */
  async handleAccountUpdate(accountId: string, event: any): Promise<void> {
    try {
      const account = event.data.object;

      // Find affiliate by Stripe account ID
      const { data: affiliate } = await this.supabase
        .from('affiliates')
        .select('id')
        .eq('stripe_account_id', accountId)
        .single();

      if (!affiliate) return;

      // Update account status
      const status = account.charges_enabled && account.payouts_enabled ? 'active' :
                    account.details_submitted ? 'pending' : 'incomplete';

      await this.supabase
        .from('affiliates')
        .update({
          stripe_account_status: status,
          stripe_account_data: account,
          updated_at: new Date().toISOString()
        })
        .eq('id', affiliate.id);

      console.log(`Updated Stripe account status for affiliate ${affiliate.id}: ${status}`);

    } catch (error) {
      console.error('Error handling account update:', error);
    }
  }
}