-- Fix RLS policies for contract_templates to allow authenticated users

-- Drop existing policy if needed
DROP POLICY IF EXISTS "auth_manage_contract_templates" ON public.contract_templates;

-- Allow authenticated users to manage contract templates
CREATE POLICY "auth_manage_contract_templates" 
ON public.contract_templates 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

