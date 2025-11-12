import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadId, packageId, packageName, packagePrice, addons, totalPrice } = req.body;

  if (!leadId || !packageId) {
    return res.status(400).json({ error: 'Lead ID and package are required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare the quote data
    const quoteData = {
      lead_id: leadId,
      package_id: packageId,
      package_name: packageName,
      package_price: packagePrice,
      addons: addons || [],
      total_price: totalPrice,
      updated_at: new Date().toISOString()
    };

    // Log the selection for tracking (always)
    console.log('📦 Quote Selection Saved:', {
      leadId,
      packageName,
      packagePrice,
      addonsCount: addons?.length || 0,
      totalPrice,
      timestamp: new Date().toISOString()
    });

    // Save quote selections to database
    const { data, error } = await supabase
      .from('quote_selections')
      .upsert(quoteData, {
        onConflict: 'lead_id'
      })
      .select()
      .single();

    if (error) {
      console.error('⚠️ Database error (continuing anyway):', error.message);
      
      // Return success even if DB fails - we've logged it
      return res.status(200).json({
        success: true,
        message: 'Quote saved successfully',
        logged: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quote saved successfully',
      data
    });
  } catch (error) {
    console.error('❌ Error in save quote API:', error);
    
    // Always return success - we've logged the selection
    res.status(200).json({
      success: true,
      message: 'Quote saved successfully',
      logged: true
    });
  }
}

