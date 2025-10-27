/**
 * Generate Projects from Payments/Invoices
 * 
 * Creates event/project records for all contacts with payments but no project.
 * Intelligently infers project details from contact info and payment data.
 * 
 * Usage: node scripts/generate-projects-from-payments.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

function generateProjectName(contact, payments) {
  const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
  const eventType = contact.event_type ? 
    contact.event_type.charAt(0).toUpperCase() + contact.event_type.slice(1).replace('_', ' ') : 
    'Event';
  
  const eventDate = contact.event_date ? 
    new Date(contact.event_date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) : '';
  
  const venue = contact.venue_name ? ` - ${contact.venue_name}` : '';
  
  return `${clientName} - ${eventType}${eventDate ? ` - ${eventDate}` : ''}${venue}`;
}

function determineProjectStatus(payments, eventDate) {
  const now = new Date();
  const totalAmount = payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => 
    sum + (p.payment_status === 'Paid' ? (p.total_amount || 0) : 0), 0
  );
  
  // If event is in the past, mark as completed
  if (eventDate && new Date(eventDate) < now) {
    return 'completed';
  }
  
  // If fully paid or mostly paid (>80%), mark as confirmed
  if (totalPaid >= totalAmount * 0.8) {
    return 'confirmed';
  }
  
  // If partially paid, mark as pending
  if (totalPaid > 0) {
    return 'pending';
  }
  
  // If no payment yet but event is soon (<30 days), urgent
  if (eventDate && new Date(eventDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
    return 'pending';
  }
  
  return 'pending';
}

function estimateEventDuration(totalAmount, eventType) {
  // Estimate hours based on package price
  const baseAmount = totalAmount / 1.0875; // Remove tax
  
  if (baseAmount < 950) return 3; // Basic package
  if (baseAmount < 1200) return 4; // Standard package
  if (baseAmount < 1500) return 4; // Premium package
  if (baseAmount < 2000) return 5; // Extended
  if (baseAmount < 3000) return 6; // Large event
  return 8; // Premium large event
}

async function generateProjects() {
  console.log('📋 Starting Project Generation from Payments\n');
  
  try {
    // Get all contacts with payments
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .not('email_address', 'is', null)
      .order('created_at', { ascending: true });
    
    if (contactsError) throw contactsError;
    
    console.log(`📊 Found ${contacts.length} contacts to process\n`);
    
    let projectsCreated = 0;
    let projectsSkipped = 0;
    let projectsUpdated = 0;
    let errors = 0;
    
    for (const contact of contacts) {
      try {
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
        
        // Skip if no payments
        if (!payments || payments.length === 0) {
          continue;
        }
        
        // Check if a project already exists for this contact
        const { data: existingProjects, error: projectCheckError } = await supabase
          .from('events')
          .select('id')
          .eq('client_email', contact.email_address);
        
        if (projectCheckError) {
          console.error(`❌ Error checking projects for ${contact.email_address}:`, projectCheckError.message);
          errors++;
          continue;
        }
        
        // Skip if project already exists
        if (existingProjects && existingProjects.length > 0) {
          projectsSkipped++;
          continue;
        }
        
        // Calculate totals
        const totalAmount = payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
        const totalPaid = payments.reduce((sum, p) => 
          sum + (p.payment_status === 'Paid' ? (p.total_amount || 0) : 0), 0
        );
        
        // Generate project data
        const projectName = generateProjectName(contact, payments);
        const projectStatus = determineProjectStatus(payments, contact.event_date);
        const estimatedDuration = estimateEventDuration(totalAmount, contact.event_type);
        
        // Get first and last payment dates
        const firstPaymentDate = payments.find(p => p.transaction_date)?.transaction_date;
        const lastPaymentDate = payments.filter(p => p.transaction_date)
          .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0]?.transaction_date;
        
        // Infer event time if not present (typical start times by event type)
        let startTime = contact.event_time;
        if (!startTime && contact.event_type) {
          switch (contact.event_type.toLowerCase()) {
            case 'wedding':
              startTime = '17:00:00'; // 5 PM typical wedding
              break;
            case 'corporate':
              startTime = '18:00:00'; // 6 PM typical corporate event
              break;
            case 'school_dance':
              startTime = '19:00:00'; // 7 PM typical school dance
              break;
            case 'private_party':
              startTime = '19:00:00'; // 7 PM typical party
              break;
            default:
              startTime = '18:00:00'; // 6 PM default
          }
        }
        
        // Build notes
        const notes = [];
        notes.push(`Auto-generated project from ${payments.length} payment(s)`);
        notes.push(`Total paid: $${totalPaid.toFixed(2)} of $${totalAmount.toFixed(2)}`);
        if (firstPaymentDate) {
          notes.push(`First payment: ${new Date(firstPaymentDate).toLocaleDateString()}`);
        }
        if (payments.length > 1 && lastPaymentDate) {
          notes.push(`Last payment: ${new Date(lastPaymentDate).toLocaleDateString()}`);
        }
        if (contact.special_requests) {
          notes.push(`Special requests: ${contact.special_requests}`);
        }
        
        // Create the project
        const projectData = {
          submission_id: contact.id, // Link to contact
          event_name: projectName,
          client_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client',
          client_email: contact.email_address,
          client_phone: contact.phone,
          event_type: contact.event_type || 'other',
          event_date: contact.event_date || firstPaymentDate || new Date().toISOString().split('T')[0],
          start_time: startTime,
          venue_name: contact.venue_name,
          venue_address: contact.venue_address,
          number_of_guests: contact.guest_count,
          event_duration: estimatedDuration,
          special_requests: contact.special_requests,
          status: projectStatus,
          notes: notes.join('\n'),
          created_at: firstPaymentDate || contact.created_at
        };
        
        const { data: project, error: projectError } = await supabase
          .from('events')
          .insert(projectData)
          .select()
          .single();
        
        if (projectError) {
          console.error(`❌ Error creating project for ${contact.email_address}:`, projectError.message);
          errors++;
          continue;
        }
        
        // Update contact with project reference if not already set
        if (!contact.project_id) {
          await supabase
            .from('contacts')
            .update({ 
              project_id: project.id,
              lead_status: projectStatus === 'confirmed' ? 'Booked' : contact.lead_status || 'Qualified'
            })
            .eq('id', contact.id);
        }
        
        // Update all payments with project_id
        for (const payment of payments) {
          await supabase
            .from('payments')
            .update({ project_id: project.id })
            .eq('id', payment.id);
        }
        
        // Update invoices with project_id if they exist
        await supabase
          .from('invoices')
          .update({ project_id: project.id })
          .eq('contact_id', contact.id)
          .is('project_id', null);
        
        console.log(`✅ Created project for ${contact.first_name} ${contact.last_name} - ${projectStatus} - ${payments.length} payment(s)`);
        projectsCreated++;
        
      } catch (error) {
        console.error(`❌ Error processing contact ${contact.email_address}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n============================================================');
    console.log('✅ Project Generation Complete!');
    console.log('============================================================');
    console.log(`✅ Projects Created: ${projectsCreated}`);
    console.log(`⏭️  Projects Skipped: ${projectsSkipped} (already exist)`);
    console.log(`🔄 Projects Updated: ${projectsUpdated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('============================================================\n');
    
    if (projectsCreated > 0) {
      console.log('🎉 All done! Projects have been created and linked to:');
      console.log('   ✓ Contacts');
      console.log('   ✓ Payments');
      console.log('   ✓ Invoices');
      console.log('\n📊 View projects at: /admin/projects');
      console.log('📊 View contacts at: /admin/contacts');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
generateProjects();

