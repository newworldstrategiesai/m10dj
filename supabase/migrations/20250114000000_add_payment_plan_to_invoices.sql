-- Add payment_plan JSONB field to invoices table
-- This allows admins to specify custom payment plans that will be reflected in contracts

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_plan JSONB;

COMMENT ON COLUMN public.invoices.payment_plan IS 'Payment plan configuration: {type: "custom"|"default", installments: [{name, amount, percentage, due_date, days_before_event, description}]}';
