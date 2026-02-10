-- Fix Supabase Security Advisor errors
-- Addresses: auth_users_exposed, policy_exists_rls_disabled, security_definer_view,
--            rls_disabled_in_public, rls_references_user_metadata
--
-- Affected products: DJDash, M10DJCompany, TipJar (shared infrastructure)

BEGIN;

-- ============================================================================
-- 1. AUTH_USERS_EXPOSED: venue_roster view exposes auth.users to anon
-- ============================================================================
-- The view joins auth.users (for performer email/name). Revoke anon access
-- and set security_invoker so view runs with caller's permissions.
REVOKE SELECT ON public.venue_roster FROM anon;
GRANT SELECT ON public.venue_roster TO authenticated;
ALTER VIEW public.venue_roster SET (security_invoker = on);

-- ============================================================================
-- 2. POLICY_EXISTS_RLS_DISABLED + RLS_DISABLED_IN_PUBLIC
-- ============================================================================
-- Enable RLS on tables that have policies but RLS was disabled
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tables that need it (no policies yet - add them below)
ALTER TABLE public.email_template_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karaoke_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karaoke_signups ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for tables that didn't have them
-- email_template_rules: system-level, platform admins only
DROP POLICY IF EXISTS "Platform admins can manage email template rules" ON public.email_template_rules;
DROP POLICY IF EXISTS "Service role full access email_template_rules" ON public.email_template_rules;
CREATE POLICY "Platform admins can manage email template rules"
  ON public.email_template_rules FOR ALL TO authenticated
  USING (is_platform_admin());
CREATE POLICY "Service role full access email_template_rules"
  ON public.email_template_rules FOR ALL TO service_role USING (true);

-- email_template_history: org-scoped via contacts
DROP POLICY IF EXISTS "Users can view their org email template history" ON public.email_template_history;
DROP POLICY IF EXISTS "Users can insert their org email template history" ON public.email_template_history;
DROP POLICY IF EXISTS "Users can update their org email template history" ON public.email_template_history;
DROP POLICY IF EXISTS "Service role full access email_template_history" ON public.email_template_history;
CREATE POLICY "Users can view their org email template history"
  ON public.email_template_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE c.id = email_template_history.contact_id
      AND (o.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = o.id AND user_id = auth.uid() AND is_active = true
      ))
    )
    OR is_platform_admin()
  );
CREATE POLICY "Users can insert their org email template history"
  ON public.email_template_history FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE c.id = email_template_history.contact_id
      AND (o.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = o.id AND user_id = auth.uid() AND is_active = true
      ))
    )
    OR is_platform_admin()
  );
CREATE POLICY "Users can update their org email template history"
  ON public.email_template_history FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE c.id = email_template_history.contact_id
      AND (o.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = o.id AND user_id = auth.uid() AND is_active = true
      ))
    )
    OR is_platform_admin()
  );
CREATE POLICY "Service role full access email_template_history"
  ON public.email_template_history FOR ALL TO service_role USING (true);

-- case_studies: public read for published, admins for all
DROP POLICY IF EXISTS "Anyone can view published case studies" ON public.case_studies;
DROP POLICY IF EXISTS "Platform admins can manage case studies" ON public.case_studies;
DROP POLICY IF EXISTS "Service role full access case_studies" ON public.case_studies;
CREATE POLICY "Anyone can view published case studies"
  ON public.case_studies FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY "Platform admins can manage case studies"
  ON public.case_studies FOR ALL TO authenticated
  USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY "Service role full access case_studies"
  ON public.case_studies FOR ALL TO service_role USING (true);

-- karaoke_settings: org-scoped
DROP POLICY IF EXISTS "Users can view their org karaoke settings" ON public.karaoke_settings;
DROP POLICY IF EXISTS "Users can manage their org karaoke settings" ON public.karaoke_settings;
DROP POLICY IF EXISTS "Service role full access karaoke_settings" ON public.karaoke_settings;
CREATE POLICY "Users can view their org karaoke settings"
  ON public.karaoke_settings FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true)
    OR is_platform_admin()
  );
CREATE POLICY "Users can manage their org karaoke settings"
  ON public.karaoke_settings FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner','admin') AND is_active = true)
    OR is_platform_admin()
  )
  WITH CHECK (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner','admin') AND is_active = true)
    OR is_platform_admin()
  );
CREATE POLICY "Service role full access karaoke_settings"
  ON public.karaoke_settings FOR ALL TO service_role USING (true);

-- karaoke_signups: org-scoped, anon can insert (for public signup forms)
DROP POLICY IF EXISTS "Users can view their org karaoke signups" ON public.karaoke_signups;
DROP POLICY IF EXISTS "Anyone can insert karaoke signups" ON public.karaoke_signups;
DROP POLICY IF EXISTS "Users can manage their org karaoke signups" ON public.karaoke_signups;
DROP POLICY IF EXISTS "Users can delete their org karaoke signups" ON public.karaoke_signups;
DROP POLICY IF EXISTS "Service role full access karaoke_signups" ON public.karaoke_signups;
CREATE POLICY "Users can view their org karaoke signups"
  ON public.karaoke_signups FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true)
    OR is_platform_admin()
  );
CREATE POLICY "Anyone can insert karaoke signups"
  ON public.karaoke_signups FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Users can manage their org karaoke signups"
  ON public.karaoke_signups FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true)
    OR is_platform_admin()
  );
CREATE POLICY "Users can delete their org karaoke signups"
  ON public.karaoke_signups FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true)
    OR is_platform_admin()
  );
CREATE POLICY "Service role full access karaoke_signups"
  ON public.karaoke_signups FOR ALL TO service_role USING (true);

-- ============================================================================
-- 3. SECURITY_DEFINER_VIEW: Change views to security_invoker
-- ============================================================================
-- Views execute with invoker's privileges instead of owner's (more secure)
ALTER VIEW IF EXISTS public.overdue_installments SET (security_invoker = on);
ALTER VIEW IF EXISTS public.hot_leads SET (security_invoker = on);
ALTER VIEW IF EXISTS public.monthly_revenue SET (security_invoker = on);
ALTER VIEW IF EXISTS public.upcoming_payments SET (security_invoker = on);
ALTER VIEW IF EXISTS public.contract_summary SET (security_invoker = on);
ALTER VIEW IF EXISTS public.client_payment_summary SET (security_invoker = on);
ALTER VIEW IF EXISTS public.outstanding_balances SET (security_invoker = on);
ALTER VIEW IF EXISTS public.customer_timeline SET (security_invoker = on);
ALTER VIEW IF EXISTS public.overdue_invoices SET (security_invoker = on);
ALTER VIEW IF EXISTS public.active_djs_by_city SET (security_invoker = on);
ALTER VIEW IF EXISTS public.invoice_summary SET (security_invoker = on);
ALTER VIEW IF EXISTS public.monthly_invoice_stats SET (security_invoker = on);
ALTER VIEW IF EXISTS public.conversation_summaries SET (security_invoker = on);
ALTER VIEW IF EXISTS public.karaoke_analytics SET (security_invoker = on);
ALTER VIEW IF EXISTS public.contacts_summary SET (security_invoker = on);
ALTER VIEW IF EXISTS public.recommended_templates_view SET (security_invoker = on);
ALTER VIEW IF EXISTS public.payment_method_stats SET (security_invoker = on);
-- venue_roster already set above

-- ============================================================================
-- 4. RLS_REFERENCES_USER_METADATA: received_emails admin policies
-- ============================================================================
-- user_metadata is editable by end users - never use for security decisions.
-- Replace with is_platform_admin() which uses admin_roles table (secure).
DROP POLICY IF EXISTS "Admin can view all emails" ON public.received_emails;
DROP POLICY IF EXISTS "Admin can update emails" ON public.received_emails;
DROP POLICY IF EXISTS "Admin can delete emails" ON public.received_emails;

CREATE POLICY "Admin can view all emails"
  ON public.received_emails FOR SELECT TO authenticated
  USING (is_platform_admin());

CREATE POLICY "Admin can update emails"
  ON public.received_emails FOR UPDATE TO authenticated
  USING (is_platform_admin());

CREATE POLICY "Admin can delete emails"
  ON public.received_emails FOR DELETE TO authenticated
  USING (is_platform_admin());

COMMIT;
