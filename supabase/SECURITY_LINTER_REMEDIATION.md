# Supabase Security Linter Remediation Guide

This document outlines exact migration steps to resolve Supabase Security Advisor warnings and errors. Execute in the order presented.

---

## Part 1: Dashboard Configuration (No Migration)

These are configured in the Supabase Dashboard, not via SQL migrations.

### 1.1 Auth OTP Long Expiry

**Location:** Supabase Dashboard → Authentication → Providers → Email

**Action:** Set OTP expiry to 3600 seconds (1 hour) or less.

**Path:** Auth → Providers → Email → OTP Expiry (seconds)

---

### 1.2 Leaked Password Protection

**Location:** Supabase Dashboard → Authentication → Policies

**Action:** Enable "Leaked password protection" (HaveIBeenPwned check).

**Docs:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

### 1.3 Postgres Version Upgrade

**Location:** Supabase Dashboard → Project Settings → Infrastructure

**Action:** Upgrade Postgres to the latest available version when convenient.

**Docs:** https://supabase.com/docs/guides/platform/upgrading

---

## Part 2: High-Risk RLS Policy Fixes

Create a migration to fix policies that may allow overly broad access.

### Migration: `20260210XXXXXX_fix_high_risk_rls_policies.sql`

```sql
-- Fix overly permissive RLS policies that may grant unintended access
-- Affected: contact_submissions.allow_admin_all, payments

BEGIN;

-- contact_submissions: allow_admin_all currently grants ALL to any authenticated user
-- Replace with is_platform_admin() so only platform admins get full access
DROP POLICY IF EXISTS "allow_admin_all" ON public.contact_submissions;

CREATE POLICY "Platform admins have full access to contact submissions"
  ON public.contact_submissions
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- payments: "Authenticated users can manage all payments" is too broad
-- Verify this table has org-scoped policies; if this policy exists alone, restrict it
-- Option A: If org-scoped policies already exist, DROP this permissive one
-- Option B: If this is the only policy, replace with org-scoped logic
DROP POLICY IF EXISTS "Authenticated users can manage all payments" ON public.payments;

-- Add org-scoped policy (payments typically has organization_id or links via invoice/contact)
CREATE POLICY "Users can manage their org payments"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true)
    OR is_platform_admin()
  )
  WITH CHECK (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true)
    OR is_platform_admin()
  );

COMMIT;
```

**Note:** Confirm `payments` has an `organization_id` column before running. If not, adjust the USING/WITH CHECK to match how payments are scoped (e.g., via invoice → contact → organization).

---

## Part 3: Function Search Path (function_search_path_mutable)

Add `SET search_path = public` to all affected functions. Each function must be recreated with:

```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
RETURNS ...
LANGUAGE plpgsql
SET search_path = public
...
```

### Approach

1. **Generate statements:** Query `pg_proc` and `pg_get_functiondef()` to list all functions missing `search_path`.
2. **Batch by migration:** Group functions by the migration file that created them.
3. **Apply:** Create migrations that add `SET search_path = public` to each function.

### Query to List Affected Functions

```sql
SELECT n.nspname as schema, p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_depend d
    JOIN pg_rewrite r ON d.objid = r.oid
    WHERE d.refobjid = p.oid
  )
ORDER BY p.proname;
```

### Example: Fixing a Single Function

```sql
-- Before (vulnerable):
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- After (fixed):
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

### Functions to Fix (from linter output)

Run `CREATE OR REPLACE` for each, adding `SET search_path = public` before `AS $$`:

- update_voice_conversations_updated_at
- update_contacts_updated_at
- update_event_tickets_updated_at
- update_success_page_views_updated_at
- update_contacts_search_vector
- update_live_events_updated_at
- update_received_emails_updated_at
- update_city_event_pages_updated_at
- generate_city_event_full_slug
- update_contract_participants_updated_at
- link_email_to_contact
- normalize_slug
- update_email_controls_updated_at
- get_recommended_templates
- update_request_tab_defaults_updated_at
- to_title_case
- get_or_create_visitor
- generate_selection_token
- cleanup_expired_tokens
- update_quote_selections_updated_at
- update_organizations_updated_at
- get_dj_virtual_number
- update_pricing_rules_normalized
- update_duplicate_rules_updated_at
- handle_new_user_organization
- update_live_stream_messages_updated_at
- calculate_late_fee
- is_discount_valid
- link_visitor_to_contact
- update_dj_network_profiles_updated_at
- update_contact_final_price
- mark_overdue_payments
- generate_contract_number
- set_contract_number
- update_songs_played_updated_at
- update_organizations_requests_cover_photo_updated_at
- auto_mark_crowd_request_played
- record_page_view
- update_call_stats
- cleanup_old_pending_responses
- update_pending_ai_responses_updated_at
- update_sms_conversations_updated_at
- generate_payment_code
- update_questionnaire_submission_log_updated_at
- update_bidding_rounds_updated_at
- get_active_bidding_round
- get_highest_bid
- get_customer_timeline
- get_available_time_slots
- update_invoices_updated_at
- generate_invoice_number
- normalize_price_to_4hour
- calculate_percentile
- get_customer_timeline_by_contact
- update_visitor_sessions_updated_at
- update_venue_invitations_updated_at
- expire_old_venue_invitations
- update_organizations_branding_updated_at
- update_crowd_requests_updated_at
- update_dj_profiles_updated_at
- generate_dj_slug
- update_dj_rating
- sync_quote_to_invoice
- set_organization_product_context
- extract_call_metadata
- update_music_library_normalized
- update_meet_rooms_updated_at
- update_pricing_config_updated_at
- update_live_streams_updated_at
- auto_extract_call_metadata
- update_blacklist_normalized
- get_organization_by_normalized_slug
- sync_quote_selection_to_invoice
- sync_all_quotes_to_invoices
- update_karaoke_settings_updated_at
- update_video_validation_status
- update_organization_members_updated_at
- update_meet_room_participants_updated_at
- update_multi_inquiries_updated_at
- generate_conversation_session
- get_or_create_conversation_session
- increment_contact_message_count
- update_contact_message_counts
- update_qr_scans_updated_at
- update_unclaimed_tip_balance_updated_at
- update_karaoke_signups_updated_at
- calculate_budget_midpoint
- calculate_event_urgency
- update_quiz_stats
- create_default_stream_alert_config
- update_updated_at_column
- get_or_create_unclaimed_tip_balance
- validate_karaoke_status_transition
- update_user_video_library_updated_at
- update_user_playlists_updated_at
- is_platform_admin (both overloads)
- get_admin_role
- sync_invoice_payment_to_quote
- sync_contract_signing_to_quote
- sync_quote_to_contract
- get_or_create_contract_for_quote
- sync_quote_selection_to_contract
- sync_all_quotes_to_contracts
- add_tip_to_unclaimed_balance
- prevent_concurrent_singing
- normalize_track_string
- trigger_normalize_crowd_request
- update_city_pages_updated_at
- generate_city_slug
- trigger_normalize_serato_play
- trigger_update_serato_connection_timestamp
- update_dj_calls_updated_at
- log_karaoke_action
- get_karaoke_lock_key
- generate_affiliate_code
- update_karaoke_song_videos_updated_at
- sync_contact_to_events
- sync_event_to_contact
- sync_contact_to_contracts
- sync_contract_status_to_contact
- update_affiliate_stats
- update_affiliate_updated_at
- sync_payments_to_invoice
- sync_invoice_to_contact
- sync_contact_pricing
- find_orphaned_contacts
- find_pricing_mismatches
- find_status_inconsistencies
- find_unlinked_events
- backfill_event_contact_links
- backfill_missing_records
- force_sync_all_contacts
- validate_youtube_video
- calculate_invoice_balance
- find_song_video
- normalize_song_key
- create_owner_membership

### Suggested Migration Strategy

Create migrations in batches of 20–30 functions to keep each migration manageable. Use `pg_get_functiondef(oid)` or your migration history to obtain the exact current definition, then add `SET search_path = public` and run `CREATE OR REPLACE`.

---

## Part 4: RLS Policy Always True (Intentional – No Change)

The following policies are intentionally permissive. Do not change them unless you are redesigning access control:

| Table | Policy | Reason |
|-------|--------|--------|
| contact_submissions | Anyone can create contact submissions | Public contact form |
| contact_submissions | allow_public_insert | Public form (if distinct from above) |
| crowd_requests | Anyone can create crowd requests | Public song request form |
| karaoke_signups | Anyone can insert karaoke signups | Public karaoke signup |
| contacts | Allow public contact form submissions | Public form |
| dj_inquiries | Anyone can create inquiries | Public inquiry form |
| meeting_bookings | Public can create bookings | Public scheduling |
| page_views | Anon can insert page_views | Analytics |
| questionnaire_submission_log | Anyone can insert... | Public form |
| service_selection_tokens | Anyone can insert... | Public form |
| service_selections | Anyone can insert / submit | Public form |
| visitor_sessions | Anon can insert visitor_sessions | Tracking |
| voice_conversations | Public can create voice conversations | Public feature |
| affiliate_commissions | System can create commissions | Backend/system |
| affiliate_referrals | Affiliates can create referrals | Referral links |
| dj_calls | System can insert/update calls | Telephony webhook |
| dj_virtual_numbers | System can manage | Telephony |
| followup_sent | Service role can manage | Backend |
| karaoke_audit_log | System can insert audit logs | Audit |
| live_stream_messages | Authenticated can send | Stream chat |
| livekit_agent_settings | Service role can manage | Backend |
| quote_analytics | Service role can manage | Backend |
| quote_page_views | Service role can manage | Backend |
| sms_conversations | System can manage | Backend |
| voice_calls | Service role can manage | Backend |

---

## Execution Checklist

- [ ] Part 1.1: Set OTP expiry in Dashboard
- [ ] Part 1.2: Enable leaked password protection in Dashboard
- [ ] Part 1.3: Plan Postgres upgrade in Dashboard
- [ ] Part 2: Create and run high-risk RLS policy migration (after verifying `payments` schema)
- [ ] Part 3: Create migrations to add `SET search_path = public` to functions (in batches)
- [ ] Part 4: Leave intentional permissive policies as-is

---

## References

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL search_path](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [RLS Policy Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
