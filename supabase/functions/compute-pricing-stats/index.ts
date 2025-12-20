/**
 * Supabase Edge Function: Compute Pricing Stats
 * 
 * This function should be called daily via cron job to recompute
 * city pricing statistics from recent bookings and inquiries.
 * 
 * Setup cron job in Supabase:
 * SELECT cron.schedule(
 *   'compute-pricing-stats',
 *   '0 2 * * *', -- Run daily at 2 AM
 *   $$
 *   SELECT net.http_post(
 *     url := 'https://your-project.supabase.co/functions/v1/compute-pricing-stats',
 *     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
 *     body := '{}'::jsonb
 *   ) AS request_id;
 *   $$
 * );
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PricingStatsRequest {
  city?: string;
  eventType?: string;
  state?: string;
  daysBack?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PricingStatsRequest = await req.json().catch(() => ({}));
    
    // Get all cities with published DJ profiles
    const { data: cities } = await supabase
      .from('dj_profiles')
      .select('city, state')
      .eq('is_published', true)
      .not('city', 'is', null)
      .limit(1000);

    if (!cities || cities.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No cities found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique city/state combinations
    const uniqueCities = Array.from(
      new Set(cities.map(c => `${c.city}|${c.state || ''}`))
    ).map(key => {
      const [city, state] = key.split('|');
      return { city, state: state || undefined };
    });

    // Event types to compute
    const eventTypes = body.eventType 
      ? [body.eventType]
      : ['wedding', 'corporate', 'private_party', 'school_dance', 'holiday_party'];

    const results = [];
    const daysBack = body.daysBack || 90;

    // Compute stats for each city/event type combination
    for (const { city, state } of uniqueCities.slice(0, 50)) { // Limit to 50 cities per run
      for (const eventType of eventTypes) {
        try {
          // Call the compute function (this would need to be implemented as a database function or API)
          // For now, we'll use a simplified approach
          const periodEnd = new Date();
          const periodStart = new Date();
          periodStart.setDate(periodStart.getDate() - daysBack);

          // Collect pricing data
          let query = supabase
            .from('dj_inquiries')
            .select('budget_amount, budget_range, created_at')
            .eq('event_type', eventType)
            .gte('created_at', periodStart.toISOString())
            .lte('created_at', periodEnd.toISOString())
            .not('budget_amount', 'is', null)
            .limit(1000);

          const { data: inquiries } = await query;

          if (!inquiries || inquiries.length < 10) {
            continue; // Skip if insufficient data
          }

          const prices = inquiries
            .map(i => i.budget_amount)
            .filter((p): p is number => p !== null && p > 0)
            .sort((a, b) => a - b);

          if (prices.length < 10) {
            continue;
          }

          // Calculate percentiles
          const q1Index = Math.floor(prices.length * 0.25);
          const medianIndex = Math.floor(prices.length * 0.5);
          const q3Index = Math.floor(prices.length * 0.75);

          const priceLow = prices[q1Index];
          const priceMedian = prices[medianIndex];
          const priceHigh = prices[q3Index];
          const priceAverage = prices.reduce((a, b) => a + b, 0) / prices.length;

          // Determine data quality
          const dataQuality = prices.length >= 30 ? 'high' : prices.length >= 10 ? 'medium' : 'low';

          // Save to database
          const { error: upsertError } = await supabase
            .from('city_pricing_stats')
            .upsert({
              city,
              state: state || null,
              event_type: eventType,
              price_low: priceLow,
              price_median: priceMedian,
              price_high: priceHigh,
              price_average: priceAverage,
              sample_size: prices.length,
              data_quality: dataQuality,
              min_sample_size: 10,
              trend_direction: 'stable', // Would calculate from history
              period_start: periodStart.toISOString().split('T')[0],
              period_end: periodEnd.toISOString().split('T')[0],
              data_sources: { inquiries: prices.length },
              outlier_count: 0,
              product_context: 'djdash'
            }, {
              onConflict: 'city,state,event_type,period_start,period_end,product_context'
            });

          if (!upsertError) {
            results.push({
              city,
              state,
              eventType,
              sampleSize: prices.length,
              priceMedian: priceMedian
            });
          }
        } catch (error) {
          console.error(`Error computing stats for ${city}, ${eventType}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        computed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

