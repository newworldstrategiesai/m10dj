/**
 * Helper functions for managing Stripe Customers for contacts/leads
 * This allows saving payment methods for future payments
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Create or retrieve a Stripe Customer for a contact/lead
 * @param {string} contactId - The contact/lead ID
 * @param {string} email - Customer email address
 * @param {string} name - Customer name (optional)
 * @returns {Promise<string>} Stripe Customer ID
 */
async function createOrRetrieveStripeCustomer(contactId, email, name = null) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if contact already has a Stripe customer ID
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('stripe_customer_id, email_address, first_name, last_name')
      .eq('id', contactId)
      .single();

    if (contactError && contactError.code !== 'PGRST116') {
      console.error('Error fetching contact:', contactError);
    }

    // If contact has a Stripe customer ID, verify it exists in Stripe
    if (contact?.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(contact.stripe_customer_id);
        if (customer && !customer.deleted) {
          // Update customer email/name if changed
          if (email && customer.email !== email) {
            await stripe.customers.update(contact.stripe_customer_id, {
              email: email,
              name: name || customer.name
            });
          }
          return contact.stripe_customer_id;
        }
      } catch (stripeError) {
        // Customer doesn't exist in Stripe, create a new one
        console.log('Stripe customer not found, creating new one:', stripeError.message);
      }
    }

    // Search for existing Stripe customer by email
    if (email) {
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        const existingCustomer = existingCustomers.data[0];
        // Save the Stripe customer ID to the contact
        await supabase
          .from('contacts')
          .update({ stripe_customer_id: existingCustomer.id })
          .eq('id', contactId);
        return existingCustomer.id;
      }
    }

    // Create new Stripe customer
    const customerData = {
      email: email || undefined,
      name: name || undefined,
      metadata: {
        contact_id: contactId
      }
    };

    const customer = await stripe.customers.create(customerData);

    // Save the Stripe customer ID to the contact
    await supabase
      .from('contacts')
      .update({ stripe_customer_id: customer.id })
      .eq('id', contactId);

    console.log(`✅ Created Stripe customer ${customer.id} for contact ${contactId}`);
    return customer.id;
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    throw error;
  }
}

/**
 * Get saved payment methods for a Stripe customer
 * @param {string} stripeCustomerId - Stripe Customer ID
 * @returns {Promise<Array>} Array of payment methods
 */
async function getSavedPaymentMethods(stripeCustomerId) {
  if (!stripe || !stripeCustomerId) {
    return [];
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card'
    });
    return paymentMethods.data;
  } catch (error) {
    console.error('Error fetching saved payment methods:', error);
    return [];
  }
}

module.exports = {
  createOrRetrieveStripeCustomer,
  getSavedPaymentMethods
};

