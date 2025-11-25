-- Add deposit_due_date and remaining_balance_due_date columns to quote_selections table
ALTER TABLE public.quote_selections 
ADD COLUMN IF NOT EXISTS deposit_due_date DATE,
ADD COLUMN IF NOT EXISTS remaining_balance_due_date DATE;

COMMENT ON COLUMN public.quote_selections.deposit_due_date IS 'Custom due date for the deposit payment';
COMMENT ON COLUMN public.quote_selections.remaining_balance_due_date IS 'Custom due date for the remaining balance payment';

