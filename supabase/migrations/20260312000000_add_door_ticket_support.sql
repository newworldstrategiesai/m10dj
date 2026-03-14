-- Door ticket sales: add door_settings to organizations, extend event_tickets for door sales
-- Door tickets can be sold with or without an event. Uses existing Stripe Connect payment flow.

-- 1. Add door_settings JSONB to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS door_settings JSONB DEFAULT NULL;

COMMENT ON COLUMN public.organizations.door_settings IS 'Door ticket settings: price_cents, venue_display, enabled, max_quantity_per_transaction. Example: {"price_cents": 1500, "venue_display": "Silky O''Sullivans", "enabled": true}';

-- 2. Add organization_id to event_tickets (for door sales attribution)
ALTER TABLE public.event_tickets
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_tickets_organization_id ON public.event_tickets(organization_id);

COMMENT ON COLUMN public.event_tickets.organization_id IS 'Organization for door sales. NULL for legacy/event-only tickets.';

-- 3. Make event_id nullable for non-event door sales
ALTER TABLE public.event_tickets
ALTER COLUMN event_id DROP NOT NULL;

COMMENT ON COLUMN public.event_tickets.event_id IS 'Event identifier. NULL for door-only sales (no specific event).';
