/**
 * Generate Invoices from HoneyBook Payments
 * 
 * Creates invoices for all payment transactions, intelligently inferring:
 * - Line items based on payment amounts and service types
 * - Invoice dates and terms
 * - Tax calculations
 * - Multi-payment projects
 * 
 * Usage: node scripts/generate-invoices-from-payments.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Standard service packages and pricing
const SERVICE_PACKAGES = {
  basic: {
    name: 'Just the Basics Package',
    basePrice: 850,
    description: 'Essential DJ services for smaller events',
    items: [
      { description: 'Professional DJ/MC Services (3 hours)', quantity: 1, rate: 600, type: 'service' },
      { description: 'Premium Sound System', quantity: 1, rate: 150, type: 'equipment' },
      { description: 'Professional Setup & Coordination', quantity: 1, rate: 100, type: 'service' }
    ]
  },
  standard: {
    name: 'Package #1 - Most Popular',
    basePrice: 1095,
    description: 'Complete entertainment for most events',
    items: [
      { description: 'Professional DJ/MC Services (4 hours)', quantity: 1, rate: 700, type: 'service' },
      { description: 'Premium Sound System & Microphones', quantity: 1, rate: 200, type: 'equipment' },
      { description: 'Multi-Color LED Dance Floor Lighting', quantity: 1, rate: 150, type: 'equipment' },
      { description: 'Professional Setup & Coordination', quantity: 1, rate: 45, type: 'service' }
    ]
  },
  premium: {
    name: 'Package #2 - Premium Experience',
    basePrice: 1345,
    description: 'Premium event experience with enhanced lighting',
    items: [
      { description: 'Professional DJ/MC Services (4 hours)', quantity: 1, rate: 700, type: 'service' },
      { description: 'Premium Sound System & Microphones', quantity: 1, rate: 200, type: 'equipment' },
      { description: 'Multi-Color LED Dance Floor Lighting', quantity: 1, rate: 150, type: 'equipment' },
      { description: 'Up to 16 Elegant Uplighting Fixtures', quantity: 1, rate: 250, type: 'equipment' },
      { description: 'Professional Setup & Coordination', quantity: 1, rate: 45, type: 'service' }
    ]
  },
  custom: {
    name: 'Custom Package',
    basePrice: 0,
    description: 'Customized services for your event',
    items: [] // Will be populated dynamically
  }
};

// Common add-ons
const ADD_ONS = {
  additionalHour: { description: 'Additional Hour of Service', rate: 150, type: 'service' },
  monogram: { description: 'Monogram/Logo Projection', rate: 300, type: 'equipment' },
  tv: { description: 'Flat Screen TV w/ Stand (65")', rate: 300, type: 'equipment' },
  speaker: { description: 'Additional Speaker', rate: 150, type: 'equipment' },
  sparkFountain: { description: 'Cold Spark Fountain Effect', rate: 500, type: 'effect' },
  ceremonyAudio: { description: 'Ceremony Audio Setup', rate: 200, type: 'service' }
};

function inferServicePackage(totalAmount, eventType) {
  // Remove tax to get base amount (assuming 8.75% tax rate)
  const baseAmount = totalAmount / 1.0875;
  
  // Match to closest package
  if (baseAmount < 950) return 'basic';
  if (baseAmount < 1200) return 'standard';
  if (baseAmount < 1500) return 'premium';
  return 'custom';
}

function generateLineItems(totalAmount, eventType, contactInfo, gratuity = 0) {
  const taxRate = 0.0875; // 8.75%
  const amountBeforeTax = totalAmount / (1 + taxRate);
  const taxAmount = totalAmount - amountBeforeTax;
  const amountBeforeGratuity = amountBeforeTax - gratuity;
  
  // Infer package
  const packageType = inferServicePackage(amountBeforeTax, eventType);
  const basePackage = SERVICE_PACKAGES[packageType];
  
  let lineItems = [];
  
  if (packageType === 'custom') {
    // For custom packages, create line items based on amount
    const eventTypeLabel = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : 'Event';
    
    if (amountBeforeGratuity < 600) {
      // Small event
      lineItems.push({
        description: `Professional DJ Services - ${eventTypeLabel}`,
        quantity: 1,
        rate: amountBeforeGratuity,
        amount: amountBeforeGratuity,
        type: 'service'
      });
    } else if (amountBeforeGratuity < 1000) {
      // Medium event
      const djRate = amountBeforeGratuity * 0.7;
      const equipmentRate = amountBeforeGratuity * 0.3;
      lineItems.push({
        description: `Professional DJ/MC Services - ${eventTypeLabel}`,
        quantity: 1,
        rate: djRate,
        amount: djRate,
        type: 'service'
      });
      lineItems.push({
        description: 'Premium Sound System & Equipment',
        quantity: 1,
        rate: equipmentRate,
        amount: equipmentRate,
        type: 'equipment'
      });
    } else if (amountBeforeGratuity < 2000) {
      // Large event
      const djRate = amountBeforeGratuity * 0.6;
      const lightingRate = amountBeforeGratuity * 0.25;
      const equipmentRate = amountBeforeGratuity * 0.15;
      lineItems.push({
        description: `Professional DJ/MC Services - ${eventTypeLabel}`,
        quantity: 1,
        rate: djRate,
        amount: djRate,
        type: 'service'
      });
      lineItems.push({
        description: 'Premium Lighting Package',
        quantity: 1,
        rate: lightingRate,
        amount: lightingRate,
        type: 'equipment'
      });
      lineItems.push({
        description: 'Complete Sound System Setup',
        quantity: 1,
        rate: equipmentRate,
        amount: equipmentRate,
        type: 'equipment'
      });
    } else {
      // Premium/Large event
      const djRate = amountBeforeGratuity * 0.5;
      const lightingRate = amountBeforeGratuity * 0.3;
      const equipmentRate = amountBeforeGratuity * 0.15;
      const setupRate = amountBeforeGratuity * 0.05;
      lineItems.push({
        description: `Professional DJ/MC Services (6-8 hours) - ${eventTypeLabel}`,
        quantity: 1,
        rate: djRate,
        amount: djRate,
        type: 'service'
      });
      lineItems.push({
        description: 'Premium Uplighting & Dance Floor Lighting',
        quantity: 1,
        rate: lightingRate,
        amount: lightingRate,
        type: 'equipment'
      });
      lineItems.push({
        description: 'Complete Sound System & Microphones',
        quantity: 1,
        rate: equipmentRate,
        amount: equipmentRate,
        type: 'equipment'
      });
      lineItems.push({
        description: 'Professional Setup, Coordination & Backup Equipment',
        quantity: 1,
        rate: setupRate,
        amount: setupRate,
        type: 'service'
      });
    }
  } else {
    // Use standard package items
    lineItems = basePackage.items.map(item => ({
      ...item,
      amount: item.rate * item.quantity
    }));
    
    // Adjust if needed to match total
    const packageTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const difference = amountBeforeGratuity - packageTotal;
    
    if (Math.abs(difference) > 50) {
      // Add additional items or hours to account for difference
      if (difference > 0) {
        const additionalHours = Math.floor(difference / 150);
        if (additionalHours > 0) {
          lineItems.push({
            description: `Additional Hours (${additionalHours} hours)`,
            quantity: additionalHours,
            rate: 150,
            amount: additionalHours * 150,
            type: 'service'
          });
        }
        const remaining = difference - (additionalHours * 150);
        if (remaining > 50) {
          lineItems.push({
            description: 'Custom Add-ons & Enhancements',
            quantity: 1,
            rate: remaining,
            amount: remaining,
            type: 'service'
          });
        }
      }
    }
  }
  
  // Add gratuity if present
  if (gratuity > 0) {
    lineItems.push({
      description: 'Gratuity',
      quantity: 1,
      rate: gratuity,
      amount: gratuity,
      type: 'gratuity'
    });
  }
  
  // Round all amounts to 2 decimals
  lineItems = lineItems.map(item => ({
    ...item,
    rate: Math.round(item.rate * 100) / 100,
    amount: Math.round(item.amount * 100) / 100
  }));
  
  return {
    lineItems,
    subtotal: Math.round(amountBeforeTax * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    taxRate: taxRate * 100,
    total: Math.round(totalAmount * 100) / 100
  };
}

function parsePaymentName(paymentName) {
  // Extract payment plan info: "1 of 2 payments / Retainer" -> { current: 1, total: 2, isRetainer: true }
  const match = paymentName.match(/(\d+)\s+of\s+(\d+)\s+payment/i);
  const isRetainer = /retainer/i.test(paymentName);
  
  if (match) {
    return {
      current: parseInt(match[1]),
      total: parseInt(match[2]),
      isRetainer,
      isFinal: parseInt(match[1]) === parseInt(match[2])
    };
  }
  
  return {
    current: 1,
    total: 1,
    isRetainer,
    isFinal: true
  };
}

async function generateInvoices() {
  console.log('🧾 Starting Invoice Generation from HoneyBook Payments\n');
  
  try {
    // Get all contacts with payments
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .not('email_address', 'is', null)
      .order('created_at', { ascending: true });
    
    if (contactsError) throw contactsError;
    
    console.log(`📊 Found ${contacts.length} contacts to process\n`);
    
    let invoicesCreated = 0;
    let invoicesSkipped = 0;
    let errors = 0;
    
    for (const contact of contacts) {
      // Get all payments for this contact
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('contact_id', contact.id)
        .order('transaction_date', { ascending: true });
      
      if (paymentsError) {
        console.error(`❌ Error fetching payments for ${contact.email_address}:`, paymentsError.message);
        errors++;
        continue;
      }
      
      if (!payments || payments.length === 0) {
        continue;
      }
      
      // Group payments by project (if they're part of a payment plan)
      const paymentGroups = new Map();
      
      for (const payment of payments) {
        const planInfo = parsePaymentName(payment.payment_name);
        const groupKey = `${contact.email_address}-${payment.due_date || payment.transaction_date}`.substring(0, 50);
        
        if (!paymentGroups.has(groupKey)) {
          paymentGroups.set(groupKey, []);
        }
        paymentGroups.get(groupKey).push({ ...payment, planInfo });
      }
      
      // Create invoices for each payment group
      for (const [groupKey, groupPayments] of paymentGroups.entries()) {
        try {
          // Calculate total invoice amount (sum of all payments in group)
          const totalAmount = groupPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
          const totalPaid = groupPayments.reduce((sum, p) => 
            sum + (p.payment_status === 'Paid' ? (p.total_amount || 0) : 0), 0
          );
          const totalGratuity = groupPayments.reduce((sum, p) => sum + (p.gratuity || 0), 0);
          
          // Use first payment for dates
          const firstPayment = groupPayments[0];
          const lastPayment = groupPayments[groupPayments.length - 1];
          
          // Generate line items
          const invoiceData = generateLineItems(
            totalAmount,
            contact.event_type,
            contact,
            totalGratuity
          );
          
          // Generate invoice number
          const { data: invoiceNumber, error: invoiceNumberError } = await supabase
            .rpc('generate_invoice_number');
          
          if (invoiceNumberError) {
            console.error(`❌ Error generating invoice number:`, invoiceNumberError.message);
            errors++;
            continue;
          }
          
          // Determine invoice status
          let invoiceStatus = 'Sent';
          if (totalPaid >= totalAmount) {
            invoiceStatus = 'Paid';
          } else if (totalPaid > 0) {
            invoiceStatus = 'Partial';
          } else if (firstPayment.due_date && new Date(firstPayment.due_date) < new Date()) {
            invoiceStatus = 'Overdue';
          }
          
          // Create invoice title
          const eventType = contact.event_type ? 
            contact.event_type.charAt(0).toUpperCase() + contact.event_type.slice(1) : 
            'Event';
          const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
          const invoiceTitle = `${eventType} DJ Services - ${clientName}`;
          
          // Create the invoice
          const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              contact_id: contact.id,
              project_id: contact.project_id || null,
              invoice_number: invoiceNumber,
              invoice_status: invoiceStatus,
              invoice_title: invoiceTitle,
              invoice_description: `Professional DJ services for ${clientName}'s ${eventType.toLowerCase()}`,
              invoice_date: firstPayment.transaction_date || firstPayment.due_date || new Date().toISOString().split('T')[0],
              due_date: firstPayment.due_date || firstPayment.transaction_date || new Date().toISOString().split('T')[0],
              sent_date: firstPayment.transaction_date ? new Date(firstPayment.transaction_date).toISOString() : null,
              paid_date: invoiceStatus === 'Paid' && lastPayment.transaction_date ? 
                new Date(lastPayment.transaction_date).toISOString() : null,
              subtotal: invoiceData.subtotal,
              tax_amount: invoiceData.taxAmount,
              tax_rate: invoiceData.taxRate,
              total_amount: totalAmount,
              amount_paid: totalPaid,
              balance_due: totalAmount - totalPaid,
              line_items: invoiceData.lineItems,
              payment_terms: groupPayments.length > 1 ? 
                `Payment plan: ${groupPayments.length} payments` : 
                'Payment due upon receipt',
              notes: contact.event_date ? 
                `Event Date: ${new Date(contact.event_date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}` : null,
              internal_notes: `Auto-generated from HoneyBook payments. ${groupPayments.length} payment(s) linked.`,
              honeybook_invoice_id: firstPayment.honeybook_payment_id
            })
            .select()
            .single();
          
          if (invoiceError) {
            console.error(`❌ Error creating invoice for ${contact.email_address}:`, invoiceError.message);
            errors++;
            continue;
          }
          
          // Link payments to invoice
          for (const payment of groupPayments) {
            await supabase
              .from('payments')
              .update({ invoice_id: invoice.id })
              .eq('id', payment.id);
          }
          
          console.log(`✅ Created invoice ${invoice.invoice_number} for ${clientName} - ${invoiceStatus} - $${totalAmount.toFixed(2)}`);
          invoicesCreated++;
          
        } catch (error) {
          console.error(`❌ Error processing payment group:`, error.message);
          errors++;
        }
      }
    }
    
    console.log('\n============================================================');
    console.log('✅ Invoice Generation Complete!');
    console.log('============================================================');
    console.log(`✅ Invoices Created: ${invoicesCreated}`);
    console.log(`⏭️  Invoices Skipped: ${invoicesSkipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('============================================================\n');
    
    console.log('🎉 All done! Check your admin panel for invoices.');
    console.log('📊 View invoices at: /admin/financial or /admin/contacts/[id]');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
generateInvoices();

