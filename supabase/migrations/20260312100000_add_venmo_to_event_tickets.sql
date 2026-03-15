-- Add venmo to event_tickets payment_method for door Venmo payments
ALTER TABLE public.event_tickets
DROP CONSTRAINT IF EXISTS event_tickets_payment_method_check;

ALTER TABLE public.event_tickets
ADD CONSTRAINT event_tickets_payment_method_check
CHECK (payment_method IN ('stripe', 'cash', 'card_at_door', 'venmo'));
