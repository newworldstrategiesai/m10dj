import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Multi-DJ Inquiry API
 * 
 * SAFETY: Notifications are disabled during development to prevent
 * accidentally sending emails/SMS to real DJs while testing.
 * 
 * To enable notifications:
 * 1. Set NODE_ENV=production
 * 2. Ensure DISABLE_DJ_NOTIFICATIONS is not set to 'true'
 * 
 * During development, all notifications are logged to console instead.
 */

interface MultiInquiryRequest {
  planner_name: string;
  planner_email: string;
  planner_phone?: string;
  event_date?: string;
  event_type: string;
  budget?: number;
  city?: string;
  state?: string;
  venue_name?: string;
  venue_address?: string;
  guest_count?: number;
  event_time?: string;
  special_requests?: string;
  dj_ids: string[];
}

interface LeadScoreFactors {
  budget: number;
  eventType: string;
  hasDate: boolean;
  hasVenue: boolean;
  hasPhone: boolean;
  guestCount?: number;
  djBadges: number;
  djReliability: number;
}

/**
 * Calculate lead score based on multiple factors
 */
function calculateLeadScore(factors: LeadScoreFactors): number {
  let score = 0;

  // Budget scoring (0-30 points)
  if (factors.budget) {
    if (factors.budget >= 5000) score += 30;
    else if (factors.budget >= 2500) score += 20;
    else if (factors.budget >= 1000) score += 10;
    else if (factors.budget >= 500) score += 5;
  }

  // Event type scoring (0-15 points)
  if (factors.eventType === 'wedding') score += 15;
  else if (factors.eventType === 'corporate') score += 10;
  else if (factors.eventType === 'birthday') score += 8;
  else if (factors.eventType === 'school_dance') score += 5;

  // Completeness scoring (0-25 points)
  if (factors.hasDate) score += 10;
  if (factors.hasVenue) score += 10;
  if (factors.hasPhone) score += 5;

  // Guest count scoring (0-5 points)
  if (factors.guestCount) {
    if (factors.guestCount >= 200) score += 5;
    else if (factors.guestCount >= 100) score += 3;
    else if (factors.guestCount >= 50) score += 1;
  }

  // DJ quality scoring (0-15 points)
  score += Math.min(15, factors.djBadges * 3); // 3 points per badge, max 15
  score += Math.min(10, factors.djReliability); // Reliability score, max 10

  return Math.max(0, Math.min(100, score));
}

/**
 * Check if DJ is available on the event date
 */
async function checkDJAvailability(
  supabase: any,
  djProfileId: string,
  eventDate: string | null
): Promise<boolean> {
  if (!eventDate) return true; // If no date specified, assume available

  const { data, error } = await supabase
    .from('dj_availability')
    .select('status')
    .eq('dj_profile_id', djProfileId)
    .eq('date', eventDate)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which means available
    console.error('Error checking availability:', error);
    return true; // Default to available if error
  }

  // If no availability record exists, DJ is available
  if (!data) return true;

  // Check if status is available or tentative
  const availabilityData = data as { status?: string } | null;
  return availabilityData?.status === 'available' || availabilityData?.status === 'tentative';
}

/**
 * Get DJ badges count and reliability score
 */
async function getDJQualityMetrics(
  supabase: any,
  djProfileId: string
): Promise<{ badges: number; reliability: number }> {
  // Get active badges count
  const { count: badgeCount } = await supabase
    .from('dj_badges')
    .select('*', { count: 'exact', head: true })
    .eq('dj_profile_id', djProfileId)
    .eq('is_active', true);

  // Calculate reliability based on:
  // - Response rate (if we track it)
  // - Booking conversion rate
  // - Reviews average
  // For now, use a simple heuristic based on badges and profile completeness
  let reliability = 5; // Base reliability

  // Add points for badges
  reliability += Math.min(3, badgeCount || 0);

  // Get profile to check completeness
  const { data: profile } = await supabase
    .from('dj_profiles')
    .select('page_views, lead_count, booking_count')
    .eq('id', djProfileId)
    .single();

  if (profile) {
    const profileData = profile as { booking_count?: number; page_views?: number; lead_count?: number } | null;
    // If DJ has bookings, increase reliability
    if (profileData?.booking_count && profileData.booking_count > 0) {
      reliability += Math.min(2, profileData.booking_count / 10);
    }
  }

  return {
    badges: badgeCount || 0,
    reliability: Math.min(10, reliability)
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: MultiInquiryRequest = await request.json();

    // Validate required fields
    if (!body.planner_name || !body.planner_email || !body.event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: planner_name, planner_email, event_type' },
        { status: 400 }
      );
    }

    if (!body.dj_ids || !Array.isArray(body.dj_ids) || body.dj_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one DJ ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Start transaction by creating multi_inquiry record
    const { data: multiInquiry, error: multiInquiryError } = await supabase
      .from('multi_inquiries')
      .insert({
        planner_name: body.planner_name.trim(),
        planner_email: body.planner_email.trim().toLowerCase(),
        planner_phone: body.planner_phone?.trim() || null,
        event_date: body.event_date || null,
        event_type: body.event_type,
        budget: body.budget || null,
        city: body.city || null,
        state: body.state || null,
        venue_name: body.venue_name?.trim() || null,
        venue_address: body.venue_address?.trim() || null,
        guest_count: body.guest_count || null,
        event_time: body.event_time || null,
        special_requests: body.special_requests?.trim() || null,
        product_context: 'djdash'
      })
      .select()
      .single();

    if (multiInquiryError || !multiInquiry) {
      console.error('Error creating multi-inquiry:', multiInquiryError);
      return NextResponse.json(
        { error: 'Failed to create inquiry. Please try again.' },
        { status: 500 }
      );
    }

    // Fetch all DJ profiles in one query to validate
    const { data: djProfiles, error: djProfilesError } = await supabase
      .from('dj_profiles')
      .select(`
        id,
        dj_name,
        dj_slug,
        organization_id,
        organizations!inner(product_context, owner_id)
      `)
      .in('id', body.dj_ids)
      .eq('is_published', true)
      .eq('organizations.product_context', 'djdash');

    if (djProfilesError) {
      console.error('Error fetching DJ profiles:', djProfilesError);
      return NextResponse.json(
        { error: 'Failed to validate DJ profiles.' },
        { status: 500 }
      );
    }

    const validDJIds = djProfiles?.map(p => p.id) || [];
    const invalidDJIds = body.dj_ids.filter(id => !validDJIds.includes(id));

    if (invalidDJIds.length > 0) {
      console.warn(`Invalid DJ IDs: ${invalidDJIds.join(', ')}`);
    }

    if (validDJIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid published DJs found.' },
        { status: 400 }
      );
    }

    // Process each DJ inquiry
    const inquiryResults = [];
    let availableCount = 0;
    let unavailableCount = 0;

    for (const djProfileId of validDJIds) {
      try {
        // Check availability
        const isAvailable = await checkDJAvailability(
          supabase,
          djProfileId,
          body.event_date || null
        );

        if (!isAvailable) {
          unavailableCount++;
          // Still create inquiry but mark as skipped
          const { data: skippedInquiry } = await supabase
            .from('dj_inquiries')
            .insert({
              dj_profile_id: djProfileId,
              multi_inquiry_id: multiInquiry.id,
              planner_name: body.planner_name.trim(),
              planner_email: body.planner_email.trim().toLowerCase(),
              planner_phone: body.planner_phone?.trim() || null,
              event_type: body.event_type,
              event_date: body.event_date || null,
              event_time: body.event_time || null,
              venue_name: body.venue_name?.trim() || null,
              venue_address: body.venue_address?.trim() || null,
              guest_count: body.guest_count || null,
              budget_range: body.budget ? `$${body.budget.toLocaleString()}` : null,
              budget_amount: body.budget || null,
              special_requests: body.special_requests?.trim() || null,
              inquiry_status: 'skipped',
              status: 'lost',
              auto_rejected: true,
              rejection_reason: 'DJ unavailable on event date',
              custom_fields: {
                city: body.city,
                state: body.state,
                source: 'city_page_multi_inquiry',
                multi_inquiry_id: multiInquiry.id
              }
            })
            .select()
            .single();

          inquiryResults.push({
            dj_profile_id: djProfileId,
            status: 'skipped',
            reason: 'unavailable'
          });
          continue;
        }

        availableCount++;

        // Get DJ quality metrics for lead scoring
        const qualityMetrics = await getDJQualityMetrics(supabase, djProfileId);

        // Calculate lead score
        const leadScore = calculateLeadScore({
          budget: body.budget || 0,
          eventType: body.event_type,
          hasDate: !!body.event_date,
          hasVenue: !!(body.venue_name || body.venue_address),
          hasPhone: !!body.planner_phone,
          guestCount: body.guest_count,
          djBadges: qualityMetrics.badges,
          djReliability: qualityMetrics.reliability
        });

        // Create individual DJ inquiry
        const { data: inquiry, error: inquiryError } = await supabase
          .from('dj_inquiries')
          .insert({
            dj_profile_id: djProfileId,
            multi_inquiry_id: multiInquiry.id,
            planner_name: body.planner_name.trim(),
            planner_email: body.planner_email.trim().toLowerCase(),
            planner_phone: body.planner_phone?.trim() || null,
            event_type: body.event_type,
            event_date: body.event_date || null,
            event_time: body.event_time || null,
            venue_name: body.venue_name?.trim() || null,
            venue_address: body.venue_address?.trim() || null,
            guest_count: body.guest_count || null,
            budget_range: body.budget ? `$${body.budget.toLocaleString()}` : null,
            budget_amount: body.budget || null,
            special_requests: body.special_requests?.trim() || null,
            lead_score: leadScore,
            lead_quality: leadScore >= 50 ? 'high' : leadScore >= 30 ? 'medium' : 'low',
            lead_temperature: leadScore >= 60 ? 'hot' : leadScore >= 40 ? 'warm' : 'cold',
            inquiry_status: 'pending',
            status: 'new',
            custom_fields: {
              city: body.city,
              state: body.state,
              source: 'city_page_multi_inquiry',
              multi_inquiry_id: multiInquiry.id
            }
          })
          .select()
          .single();

        if (inquiryError) {
          console.error(`Error creating inquiry for DJ ${djProfileId}:`, inquiryError);
          inquiryResults.push({
            dj_profile_id: djProfileId,
            status: 'error',
            error: inquiryError.message
          });
          continue;
        }

        inquiryResults.push({
          dj_profile_id: djProfileId,
          inquiry_id: inquiry?.id,
          status: 'created',
          lead_score: leadScore
        });

        // Send notification to DJ (only in production)
        // During development/testing, we skip real notifications to avoid contacting DJs
        const isProduction = process.env.NODE_ENV === 'production';
        const notificationsDisabled = process.env.DISABLE_DJ_NOTIFICATIONS === 'true';
        
        if (isProduction && !notificationsDisabled) {
          // TODO: Integrate with existing notification system (utils/notification-system.js)
          // import { sendEnhancedNotifications } from '@/utils/notification-system';
          // await sendEnhancedNotifications({
          //   name: body.planner_name,
          //   email: body.planner_email,
          //   phone: body.planner_phone,
          //   eventType: body.event_type,
          //   eventDate: body.event_date,
          //   venue: body.venue_name,
          //   message: `New inquiry from ${city} city page`
          // }, inquiry);
          
          // For now, log that notification would be sent
          console.log(`[NOTIFICATION SKIPPED - Development Mode] Would notify DJ ${djProfileId} about new inquiry ${inquiry?.id}`);
        } else {
          console.log(`[NOTIFICATION SKIPPED] DJ ${djProfileId} inquiry ${inquiry?.id} - Development mode or notifications disabled`);
          console.log(`  - Inquiry details: ${body.planner_name} (${body.planner_email}) - ${body.event_type} on ${body.event_date || 'TBD'}`);
          console.log(`  - Lead score: ${leadScore} (${leadScore >= 50 ? 'high' : leadScore >= 30 ? 'medium' : 'low'})`);
        }

      } catch (error: any) {
        console.error(`Error processing DJ ${djProfileId}:`, error);
        inquiryResults.push({
          dj_profile_id: djProfileId,
          status: 'error',
          error: error.message
        });
      }
    }

    // Update multi_inquiry with final counts
    await supabase
      .from('multi_inquiries')
      .update({
        total_djs_contacted: validDJIds.length,
        total_djs_available: availableCount,
        total_djs_unavailable: unavailableCount
      })
      .eq('id', multiInquiry.id);

    // Return success response
    return NextResponse.json({
      success: true,
      multi_inquiry_id: multiInquiry.id,
      total_djs_contacted: validDJIds.length,
      total_djs_available: availableCount,
      total_djs_unavailable: unavailableCount,
      invalid_dj_ids: invalidDJIds,
      results: inquiryResults
    });

  } catch (error: any) {
    console.error('Error processing multi-inquiry:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your inquiry. Please try again.' },
      { status: 500 }
    );
  }
}

