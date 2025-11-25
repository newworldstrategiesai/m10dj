-- Fix discount_type constraint to allow NULL values
ALTER TABLE public.quote_selections 
DROP CONSTRAINT IF EXISTS quote_selections_discount_type_check;

ALTER TABLE public.quote_selections 
ADD CONSTRAINT quote_selections_discount_type_check 
CHECK (discount_type IS NULL OR discount_type IN ('percentage', 'flat'));

