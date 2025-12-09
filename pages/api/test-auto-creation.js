/**
 * Test Endpoint for Auto-Creation of Quote, Invoice, and Contract
 * 
 * This endpoint tests the auto-creation functionality by:
 * 1. Creating a test contact
 * 2. Verifying quote, invoice, and contract were created
 * 3. Checking that all records are properly linked
 * 
 * Usage: POST /api/test-auto-creation
 * Blocked in production for security
 */

import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { logger } from '@/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { autoCreateQuoteInvoiceContract } from '../../utils/auto-create-quote-invoice-contract';

export default async function handler(req, res) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here
    
    // Log warning for test endpoint
    logger.warn('Test endpoint called - ensure this is only used in development', {
      user: user.email
    });

    const env = getEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    logger.info('Starting auto-creation test');

    // Step 1: Create a test contact
    logger.info('Step 1: Creating test contact');
    const testContactData = {
      first_name: 'Test',
      last_name: `User-${Date.now()}`,
      email_address: `test-${Date.now()}@example.com`,
      phone: '+19015551234',
      event_type: 'wedding',
      event_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      venue_name: 'Test Venue',
      venue_address: '123 Test St, Memphis, TN',
      guest_count: 100,
      lead_status: 'New',
      lead_source: 'Test',
      lead_stage: 'Initial Inquiry'
    };

    const { data: testContact, error: contactError } = await supabase
      .from('contacts')
      .insert([testContactData])
      .select()
      .single();

    if (contactError || !testContact) {
      logger.error('Failed to create test contact', contactError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create test contact',
        details: contactError?.message
      });
    }

    logger.info('Test contact created', {
      contactId: testContact.id,
      name: `${testContact.first_name} ${testContact.last_name}`,
      email: testContact.email_address
    });

    // Step 2: Call auto-creation function
    logger.info('Step 2: Calling auto-creation function');
    const creationResults = await autoCreateQuoteInvoiceContract(testContact, supabase);

    // Step 3: Verify all records were created
    logger.info('Step 3: Verifying created records');
    
    const verification = {
      contact: { exists: true, id: testContact.id },
      quote: { exists: false, id: null, linked: false },
      invoice: { exists: false, id: null, linked: false },
      contract: { exists: false, id: null, linked: false }
    };

    // Verify Quote
    if (creationResults.quote.success && creationResults.quote.id) {
      const { data: quote, error: quoteError } = await supabase
        .from('quote_selections')
        .select('*')
        .eq('id', creationResults.quote.id)
        .single();

      if (quote && !quoteError) {
        verification.quote = {
          exists: true,
          id: quote.id,
          lead_id: quote.lead_id,
          status: quote.status,
          linked: quote.invoice_id !== null && quote.contract_id !== null
        };
        logger.info('Quote verified', {
          quoteId: quote.id,
          status: quote.status,
          hasInvoice: !!quote.invoice_id,
          hasContract: !!quote.contract_id
        });
      }
    }

    // Verify Invoice
    if (creationResults.invoice.success && creationResults.invoice.id) {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', creationResults.invoice.id)
        .single();

      if (invoice && !invoiceError) {
        verification.invoice = {
          exists: true,
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          contact_id: invoice.contact_id,
          status: invoice.invoice_status,
          total_amount: invoice.total_amount
        };
        logger.info('Invoice verified', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          status: invoice.invoice_status,
          totalAmount: invoice.total_amount
        });
      }
    }

    // Verify Contract
    if (creationResults.contract.success && creationResults.contract.id) {
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', creationResults.contract.id)
        .single();

      if (contract && !contractError) {
        verification.contract = {
          exists: true,
          id: contract.id,
          contract_number: contract.contract_number,
          contact_id: contract.contact_id,
          invoice_id: contract.invoice_id,
          status: contract.status
        };
        logger.info('Contract verified', {
          contractId: contract.id,
          contractNumber: contract.contract_number,
          status: contract.status,
          hasInvoice: !!contract.invoice_id
        });
      }
    }

    // Step 4: Check cross-references
    logger.info('Step 4: Verifying cross-references');
    let crossRefValid = true;
    const issues = [];

    if (verification.quote.exists && verification.invoice.exists) {
      const { data: quote } = await supabase
        .from('quote_selections')
        .select('invoice_id, contract_id')
        .eq('id', verification.quote.id)
        .single();

      if (quote) {
        if (quote.invoice_id !== verification.invoice.id) {
          crossRefValid = false;
          issues.push('Quote invoice_id does not match created invoice');
        }
        if (verification.contract.exists && quote.contract_id !== verification.contract.id) {
          crossRefValid = false;
          issues.push('Quote contract_id does not match created contract');
        }
      }
    }

    if (verification.contract.exists && verification.invoice.exists) {
      const { data: contract } = await supabase
        .from('contracts')
        .select('invoice_id')
        .eq('id', verification.contract.id)
        .single();

      if (contract && contract.invoice_id !== verification.invoice.id) {
        crossRefValid = false;
        issues.push('Contract invoice_id does not match created invoice');
      }
    }

    // Step 5: Summary
    logger.info('Test Summary', { verification, allLinked });
    
    const allCreated = verification.quote.exists && verification.invoice.exists && verification.contract.exists;
    const allLinked = verification.quote.linked && crossRefValid;

    if (issues.length > 0) {
      logger.warn('Issues found during test', { issues });
    }

    // Cleanup: Optionally delete test contact (uncomment to enable)
    // console.log('\n🧹 Cleaning up test contact...');
    // await supabase.from('contacts').delete().eq('id', testContact.id);
    // console.log('✅ Test contact deleted');

    // Return results
    return res.status(200).json({
      success: allCreated && allLinked,
      test: {
        contact: verification.contact,
        quote: verification.quote,
        invoice: verification.invoice,
        contract: verification.contract,
        allCreated,
        allLinked,
        crossReferencesValid: crossRefValid
      },
      creationResults: {
        quote: creationResults.quote,
        invoice: creationResults.invoice,
        contract: creationResults.contract
      },
      issues: issues.length > 0 ? issues : null,
      message: allCreated && allLinked 
        ? '✅ All records created and linked successfully!'
        : '⚠️ Some records failed to create or link properly'
    });

  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Test failed with error', error);
    return res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

