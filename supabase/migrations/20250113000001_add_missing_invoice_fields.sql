-- Add missing invoice fields to support all invoice features
-- This migration adds fields that are used in the invoice creation form

-- Add tax_rate if it doesn't exist (for storing tax rate percentage)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN tax_rate NUMERIC(5, 2);
    
    COMMENT ON COLUMN public.invoices.tax_rate IS 'Tax rate as a percentage (e.g., 8.75 for 8.75%)';
  END IF;
END $$;

-- Add late_fee_percentage if it doesn't exist (for storing the percentage, late_fee_amount is calculated)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'late_fee_percentage'
  ) THEN
    ALTER TABLE public.invoices
    ADD COLUMN late_fee_percentage NUMERIC(5, 2);
    
    COMMENT ON COLUMN public.invoices.late_fee_percentage IS 'Late fee percentage applied to overdue balance (e.g., 5.00 for 5%)';
  END IF;
END $$;
