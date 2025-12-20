import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeCityPricingStats } from '@/utils/pricingEngine';

/**
 * POST /api/cron/update-pricing-stats
 * 
 * Weekly cron job to update pricing statistics
 * Should be called weekly via external cron service (cron-job.org, etc.)
 * 
 * Security: Requires CRON_SECRET header
 * 
 * Process:
 * 1. Get all active cities and event types from DJ Dash
 * 2. Compute pricing stats for each city/event_type combination
 * 3. Update city_pricing_stats table
 * 4. Generate DJ pricing insights for all DJs
 */
export async function POST(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const supabase = createClient();
    
    console.log('🔄 Starting weekly pricing stats update...');
    
    // Get all unique city/event_type combinations from active DJ profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('dj_profiles')
      .select('city, state, event_types')
      .not('city', 'is', null)
      .not('event_types', 'is', null);
    
    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }
    
    // Collect unique city/event_type combinations
    const combinations = new Set<string>();
    
    if (profiles) {
      for (const profile of profiles as any[]) {
        if (profile.city && profile.event_types && Array.isArray(profile.event_types)) {
          for (const eventType of profile.event_types) {
            const key = `${profile.city.toLowerCase()}|${profile.state?.toLowerCase() || ''}|${eventType.toLowerCase()}`;
            combinations.add(key);
          }
        }
      }
    }
    
    // Also get combinations from recent inquiries/bookings
    const { data: inquiries } = await supabase
      .from('dj_inquiries')
      .select('city, state, event_type')
      .not('city', 'is', null)
      .not('event_type', 'is', null)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);
    
    if (inquiries) {
      for (const inquiry of inquiries as any[]) {
        if (inquiry.city && inquiry.event_type) {
          const key = `${inquiry.city.toLowerCase()}|${inquiry.state?.toLowerCase() || ''}|${inquiry.event_type.toLowerCase()}`;
          combinations.add(key);
        }
      }
    }
    
    console.log(`📊 Found ${combinations.size} city/event_type combinations to process`);
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    // Process each combination
    for (const combination of Array.from(combinations)) {
      const [city, state, eventType] = combination.split('|');
      
      if (!city || !eventType) continue;
      
      try {
        console.log(`Processing: ${city}, ${state || 'N/A'}, ${eventType}`);
        
        const stats = await computeCityPricingStats(
          city,
          eventType,
          state || undefined,
          90 // Last 90 days
        );
        
        if (stats) {
          results.succeeded++;
          console.log(`✅ Successfully computed stats for ${city}/${eventType}`);
        } else {
          results.failed++;
          console.log(`⚠️  Insufficient data for ${city}/${eventType}`);
        }
        
        results.processed++;
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${city}/${eventType}: ${error.message}`);
        console.error(`❌ Error processing ${city}/${eventType}:`, error);
      }
    }
    
    // Update DJ pricing insights for all DJs
    console.log('🔄 Updating DJ pricing insights...');
    
    let insightsUpdated = 0;
    
    const { data: allProfiles } = await supabase
      .from('dj_profiles')
      .select('id, city, state, event_types, price_range_min, price_range_max');
    
    if (allProfiles) {
      for (const profile of allProfiles as any[]) {
        const typedProfile = profile as any;
        if (!typedProfile.city || !typedProfile.event_types || !typedProfile.price_range_min) continue;
        
        const djCurrentPrice = typedProfile.price_range_min + 
          ((typedProfile.price_range_max || typedProfile.price_range_min) - typedProfile.price_range_min) / 2;
        
        for (const eventType of typedProfile.event_types) {
          try {
            const { getDJPricingInsight } = await import('@/utils/pricingEngine');
            await getDJPricingInsight(
              typedProfile.id,
              typedProfile.city,
              eventType,
              typedProfile.state || undefined
            );
            insightsUpdated++;
          } catch (error) {
            console.error(`Error updating insight for ${profile.id}/${eventType}:`, error);
          }
        }
      }
      
      console.log(`✅ Updated ${insightsUpdated} DJ pricing insights`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Pricing stats update completed',
      timestamp: new Date().toISOString(),
      results: {
        ...results,
        insights_updated: insightsUpdated || 0
      }
    });
    
  } catch (error: any) {
    console.error('❌ Pricing stats update failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Pricing stats update failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support GET for easier cron setup
export async function GET(request: NextRequest) {
  return POST(request);
}

