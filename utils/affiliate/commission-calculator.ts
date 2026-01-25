import { createClient } from '@/utils/supabase/server';
import { AffiliateService } from './affiliate-service';

export interface CommissionCalculation {
  affiliateId: string;
  referralId: string;
  amount: number;
  commissionType: 'subscription_monthly' | 'subscription_setup' | 'platform_fee' | 'upgrade_bonus' | 'referral_bonus';
  sourceTable: string;
  sourceTransactionId: string;
  sourceAmount: number;
  commissionRate: number;
}

export class CommissionCalculator {
  private supabase: any;
  private affiliateService: AffiliateService;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
    this.affiliateService = new AffiliateService(this.supabase);
  }

  /**
   * Get subscription amount based on tier (for TipJar)
   * Note: This maps subscription_tier to monthly price
   */
  private getSubscriptionAmountByTier(tier: string): number {
    // TipJar subscription pricing
    const tierPricing: Record<string, number> = {
      'free': 0,
      'starter': 0, // Free tier
      'professional': 9.99, // Pro tier
      'enterprise': 29.99, // Embed Pro tier
      'white_label': 49.99 // Embed Pro tier (alternative name)
    };

    return tierPricing[tier?.toLowerCase()] || 0;
  }

  /**
   * Process commission for a new subscription
   * Note: Subscriptions are tracked in organizations table, not a separate subscriptions table
   */
  async processSubscriptionCommission(organizationId: string): Promise<void> {
    try {
      // Get organization with subscription details
      const { data: organization, error: orgError } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError || !organization) {
        console.error('Organization not found:', organizationId);
        return;
      }

      // Check if commission already processed
      if (organization.affiliate_commission_processed) {
        return;
      }

      // Only process active subscriptions (not trial or cancelled)
      if (organization.subscription_status !== 'active') {
        await this.markCommissionProcessed(organizationId, 'organizations');
        return;
      }

      // Check if organization was referred by affiliate
      const affiliateId = organization.referred_by_affiliate_id;
      if (!affiliateId) {
        await this.markCommissionProcessed(organizationId, 'organizations');
        return;
      }

      // Get affiliate details
      const { data: affiliate } = await this.supabase
        .from('affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single();

      if (!affiliate || affiliate.status !== 'active') {
        await this.markCommissionProcessed(organizationId, 'organizations');
        return;
      }

      // Find the referral record
      const referralId = organization.affiliate_attribution?.referral_id;
      if (!referralId) {
        await this.markCommissionProcessed(organizationId, 'organizations');
        return;
      }

      const { data: referral } = await this.supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('id', referralId)
        .single();

      if (!referral || !referral.commission_eligible) {
        await this.markCommissionProcessed(organizationId, 'organizations');
        return;
      }

      // Calculate commission based on subscription tier
      const subscriptionAmount = this.getSubscriptionAmountByTier(organization.subscription_tier);
      const commissionRate = affiliate.commission_rate / 100; // Convert percentage to decimal
      const commissionAmount = subscriptionAmount * commissionRate;

      if (commissionAmount <= 0) {
        await this.markCommissionProcessed(organizationId, 'organizations');
        return;
      }

      // Determine commission type (monthly recurring for active subscriptions)
      const commissionType = 'subscription_monthly';

      // Create commission record
      const commissionData = {
        affiliate_id: affiliateId,
        referral_id: referralId,
        amount: commissionAmount,
        commission_type: commissionType,
        source_table: 'organizations',
        source_transaction_id: organizationId,
        source_amount: subscriptionAmount,
        commission_rate: affiliate.commission_rate,
        status: 'approved' // Auto-approve subscription commissions
      };

      const { error: commissionError } = await this.supabase
        .from('affiliate_commissions')
        .insert(commissionData);

      if (commissionError) {
        console.error('Error creating commission record:', commissionError);
        return;
      }

      // Update referral conversion status if not already converted
      if (referral.conversion_status === 'signed_up') {
        await this.supabase
          .from('affiliate_referrals')
          .update({
            conversion_status: 'subscribed',
            converted_at: new Date().toISOString(),
            conversion_value: subscriptionAmount
          })
          .eq('id', referralId);

        // Update affiliate conversion stats
        await this.supabase
          .from('affiliates')
          .update({
            total_conversions: this.supabase.raw('total_conversions + 1'),
            lifetime_value: this.supabase.raw(`lifetime_value + ${subscriptionAmount}`)
          })
          .eq('id', affiliateId);
      }

      // Mark as processed
      await this.markCommissionProcessed(organizationId, 'organizations');

      console.log(`Processed ${commissionType} commission: $${commissionAmount.toFixed(2)} for affiliate ${affiliate.affiliate_code}`);

    } catch (error) {
      console.error('Error processing subscription commission:', error);
    }
  }

  /**
   * Process commission for platform fees (TipJar fees on payments)
   */
  async processPlatformFeeCommission(paymentId: string): Promise<void> {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select(`
          *,
          contacts (
            event_date,
            organizations (
              id,
              referred_by_affiliate_id,
              affiliate_attribution
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        console.error('Payment not found:', paymentId);
        return;
      }

      // Check if commission already processed
      if (payment.affiliate_commission_processed) {
        return;
      }

      // Only process successful payments
      if (payment.payment_status !== 'Paid') {
        await this.markCommissionProcessed(paymentId, 'payments');
        return;
      }

      // Check if organization was referred by affiliate
      const affiliateId = payment.contacts?.organizations?.referred_by_affiliate_id;
      if (!affiliateId) {
        await this.markCommissionProcessed(paymentId, 'payments');
        return;
      }

      // Get affiliate details
      const { data: affiliate } = await this.supabase
        .from('affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single();

      if (!affiliate || affiliate.status !== 'active') {
        await this.markCommissionProcessed(paymentId, 'payments');
        return;
      }

      // Find the referral record
      const referralId = payment.contacts?.organizations?.affiliate_attribution?.referral_id;
      if (!referralId) {
        await this.markCommissionProcessed(paymentId, 'payments');
        return;
      }

      const { data: referral } = await this.supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('id', referralId)
        .single();

      if (!referral || !referral.commission_eligible) {
        await this.markCommissionProcessed(paymentId, 'payments');
        return;
      }

      // Check if commission is still eligible (within expiration period)
      if (referral.commission_expires_at && new Date(referral.commission_expires_at) < new Date()) {
        await this.markCommissionProcessed(paymentId, 'payments');
        return;
      }

      // Calculate platform fee commission
      // TipJar takes 3.5% + $0.30, we give affiliates 10% of that
      const tipjarFee = (payment.total_amount * 0.035) + 0.30;
      const commissionRate = affiliate.platform_fee_rate / 100;
      const commissionAmount = tipjarFee * commissionRate;

      if (commissionAmount <= 0.01) { // Minimum $0.01 commission
        await this.markCommissionProcessed(paymentId, 'payments');
        return;
      }

      // Create commission record
      const commissionData = {
        affiliate_id: affiliateId,
        referral_id: referralId,
        amount: commissionAmount,
        commission_type: 'platform_fee',
        source_table: 'payments',
        source_transaction_id: paymentId,
        source_amount: payment.total_amount,
        commission_rate: affiliate.platform_fee_rate,
        status: 'approved' // Auto-approve platform fee commissions
      };

      const { error: commissionError } = await this.supabase
        .from('affiliate_commissions')
        .insert(commissionData);

      if (commissionError) {
        console.error('Error creating platform fee commission:', commissionError);
        return;
      }

      // Mark as processed
      await this.markCommissionProcessed(paymentId, 'payments');

      console.log(`Processed platform fee commission: $${commissionAmount.toFixed(2)} for affiliate ${affiliate.affiliate_code}`);

    } catch (error) {
      console.error('Error processing platform fee commission:', error);
    }
  }

  /**
   * Process referral bonus for successful conversions
   */
  async processReferralBonus(referralId: string): Promise<void> {
    try {
      // Get referral details
      const { data: referral } = await this.supabase
        .from('affiliate_referrals')
        .select(`
          *,
          affiliates (*)
        `)
        .eq('id', referralId)
        .single();

      if (!referral || !referral.commission_eligible) {
        return;
      }

      // Check if this is a qualifying conversion (first subscription or payment)
      if (referral.conversion_status !== 'subscribed' && referral.conversion_status !== 'first_payment') {
        return;
      }

      // Check if bonus already awarded
      const { data: existingBonus } = await this.supabase
        .from('affiliate_commissions')
        .select('id')
        .eq('referral_id', referralId)
        .eq('commission_type', 'referral_bonus')
        .single();

      if (existingBonus) {
        return; // Bonus already awarded
      }

      // Award referral bonus ($5 for first successful referral)
      const bonusAmount = 5.00;

      const commissionData = {
        affiliate_id: referral.affiliate_id,
        referral_id: referralId,
        amount: bonusAmount,
        commission_type: 'referral_bonus',
        source_table: 'affiliate_referrals',
        source_transaction_id: referralId,
        commission_rate: 100, // Flat bonus
        status: 'approved'
      };

      const { error: commissionError } = await this.supabase
        .from('affiliate_commissions')
        .insert(commissionData);

      if (commissionError) {
        console.error('Error creating referral bonus:', commissionError);
        return;
      }

      console.log(`Awarded referral bonus: $${bonusAmount} for affiliate ${referral.affiliates.affiliate_code}`);

    } catch (error) {
      console.error('Error processing referral bonus:', error);
    }
  }

  /**
   * Mark commission as processed for a transaction
   */
  private async markCommissionProcessed(transactionId: string, tableName: string): Promise<void> {
    try {
      // Handle different table update patterns
      const updateData: any = {
        affiliate_commission_processed: true
      };

      // Only add updated_at if the table has that column (organizations, payments, etc.)
      if (tableName === 'organizations' || tableName === 'payments') {
        updateData.updated_at = new Date().toISOString();
      }

      await this.supabase
        .from(tableName)
        .update(updateData)
        .eq('id', transactionId);
    } catch (error) {
      console.error(`Error marking commission processed for ${tableName}:${transactionId}`, error);
    }
  }

  /**
   * Calculate total pending commissions for an affiliate
   */
  async getPendingCommissions(affiliateId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('affiliate_commissions')
        .select('amount')
        .eq('affiliate_id', affiliateId)
        .eq('status', 'approved')
        .eq('payout_date', null);

      if (error) throw error;

      return data?.reduce((sum: number, commission: any) => sum + parseFloat(commission.amount), 0) || 0;
    } catch (error) {
      console.error('Error calculating pending commissions:', error);
      return 0;
    }
  }

  /**
   * Process monthly commission payouts
   */
  async processMonthlyPayouts(): Promise<void> {
    try {
      const currentDate = new Date();
      const payoutPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Get affiliates with pending payouts above threshold
      const { data: affiliates } = await this.supabase
        .from('affiliates')
        .select('*')
        .eq('status', 'active')
        .eq('auto_payout', true)
        .gt('pending_balance', this.supabase.raw('payout_threshold'));

      if (!affiliates || affiliates.length === 0) {
        console.log('No affiliates eligible for payout');
        return;
      }

      // Create payout batch
      const { data: batch, error: batchError } = await this.supabase
        .from('affiliate_payout_batches')
        .insert({
          period_start: payoutPeriod.toISOString().split('T')[0],
          period_end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0],
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) {
        console.error('Error creating payout batch:', batchError);
        return;
      }

      // Process each affiliate's commissions
      for (const affiliate of affiliates) {
        try {
          // Get approved commissions for this affiliate
          const { data: commissions } = await this.supabase
            .from('affiliate_commissions')
            .select('*')
            .eq('affiliate_id', affiliate.id)
            .eq('status', 'approved')
            .is('payout_date', null);

          if (!commissions || commissions.length === 0) continue;

          const totalPayout = commissions.reduce((sum: number, comm: any) => sum + parseFloat(comm.amount), 0);

          // Mark commissions as paid
          const commissionIds = commissions.map((c: any) => c.id);
          await this.supabase
            .from('affiliate_commissions')
            .update({
              status: 'paid',
              payout_batch_id: batch.id,
              payout_date: currentDate.toISOString().split('T')[0],
              paid_at: new Date().toISOString()
            })
            .in('id', commissionIds);

          // Update affiliate stats
          await this.supabase
            .from('affiliates')
            .update({
              total_paid: this.supabase.raw(`total_paid + ${totalPayout}`),
              pending_balance: this.supabase.raw(`pending_balance - ${totalPayout}`),
              updated_at: new Date().toISOString()
            })
            .eq('id', affiliate.id);

          console.log(`Processed payout of $${totalPayout.toFixed(2)} for affiliate ${affiliate.affiliate_code}`);

        } catch (error) {
          console.error(`Error processing payout for affiliate ${affiliate.id}:`, error);
        }
      }

      // Update batch status
      await this.supabase
        .from('affiliate_payout_batches')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', batch.id);

    } catch (error) {
      console.error('Error processing monthly payouts:', error);
    }
  }
}