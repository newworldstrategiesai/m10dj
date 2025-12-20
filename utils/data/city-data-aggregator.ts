/**
 * City Data Aggregator
 * Pulls real statistics from DJ Dash database for data-driven content
 * Ensures pages are NOT thin content by using actual marketplace data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface CityDataSnapshot {
  // DJ Statistics
  totalDJs: number;
  availableDJs: number;
  verifiedDJs: number;
  
  // Pricing Data
  averagePrice: number | null;
  medianPrice: number | null;
  priceRange: { min: number; max: number } | null;
  
  // Booking Data
  totalInquiries: number;
  totalBookings: number;
  averageBookingLeadTime: number | null; // Days between inquiry and event
  peakBookingMonths: string[]; // Top 3 months
  
  // Response Data
  averageResponseTime: number | null; // Hours
  medianResponseTime: number | null;
  
  // Event Data
  averageEventLength: number | null; // Hours
  mostRequestedGenres: string[];
  mostRequestedEventTypes: string[];
  
  // Review Data
  totalReviews: number;
  verifiedReviews: number;
  averageRating: number | null;
  
  // Venue Data
  popularVenues: Array<{ name: string; inquiryCount: number }>;
  
  // Meets minimum requirements
  meetsMinimumRequirements: boolean;
  dataQuality: 'high' | 'medium' | 'low';
}

export interface CityEventDataSnapshot extends CityDataSnapshot {
  eventType: string;
  eventTypeInquiries: number;
  eventTypeBookings: number;
  eventTypeAveragePrice: number | null;
  eventTypePeakMonths: string[];
}

/**
 * Check if city meets minimum data requirements for publishing
 */
export async function checkCityDataRequirements(
  cityName: string,
  stateAbbr?: string
): Promise<{
  meetsRequirements: boolean;
  djCount: number;
  inquiryCount: number;
  reviewCount: number;
  bookingCount: number;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get DJ Dash organization IDs
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('product_context', 'djdash');
  
  const orgIds = orgs?.map(o => o.id) || [];
  
  // Count published DJs in city
  const { count: djCount } = await supabase
    .from('dj_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .in('organization_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000'])
    .or(`city.ilike.%${cityName}%,primary_city.ilike.%${cityName}%`);
  
  // Count historical inquiries
  const { count: inquiryCount } = await supabase
    .from('dj_inquiries')
    .select('*', { count: 'exact', head: true })
    .or(`city.ilike.%${cityName}%,venue_address.ilike.%${cityName}%`);
  
  // Count verified reviews
  const { count: reviewCount } = await supabase
    .from('dj_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true)
    .eq('is_approved', true)
    .or(`dj_profiles.city.ilike.%${cityName}%,dj_profiles.primary_city.ilike.%${cityName}%`);
  
  // Count completed bookings
  const { count: bookingCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .or(`venue_address.ilike.%${cityName}%`);
  
  const meetsRequirements = 
    (djCount || 0) >= 5 &&
    (inquiryCount || 0) >= 10 &&
    ((reviewCount || 0) >= 3 || (bookingCount || 0) >= 1);
  
  return {
    meetsRequirements,
    djCount: djCount || 0,
    inquiryCount: inquiryCount || 0,
    reviewCount: reviewCount || 0,
    bookingCount: bookingCount || 0,
  };
}

/**
 * Aggregate comprehensive city statistics
 */
export async function aggregateCityData(
  cityName: string,
  stateAbbr?: string
): Promise<CityDataSnapshot> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get DJ statistics - filter by organization product_context
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('product_context', 'djdash');
  
  const orgIds = orgs?.map(o => o.id) || [];
  
  const { data: djs, count: totalDJs } = await supabase
    .from('dj_profiles')
    .select('id, starting_price_range, price_range_min, price_range_max, availability_status, organization_id')
    .eq('is_published', true)
    .in('organization_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000']) // Empty array if no orgs
    .or(`city.ilike.%${cityName}%,primary_city.ilike.%${cityName}%`);
  
  const availableDJs = djs?.filter(dj => dj.availability_status === 'available').length || 0;
  const verifiedDJs = totalDJs || 0; // All published DJs are considered verified
  
  // Calculate pricing statistics
  const prices = djs
    ?.map(dj => {
      if (dj.price_range_min) return dj.price_range_min;
      if (dj.starting_price_range) {
        const match = dj.starting_price_range.match(/\$?(\d+)/);
        return match ? parseInt(match[1]) : null;
      }
      return null;
    })
    .filter((p): p is number => p !== null) || [];
  
  const averagePrice = prices.length > 0 
    ? prices.reduce((sum, p) => sum + p, 0) / prices.length 
    : null;
  
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const medianPrice = sortedPrices.length > 0
    ? sortedPrices[Math.floor(sortedPrices.length / 2)]
    : null;
  
  const priceRange = prices.length > 0
    ? { min: Math.min(...prices), max: Math.max(...prices) }
    : null;
  
  // Get inquiry statistics
  const { data: inquiries } = await supabase
    .from('dj_inquiries')
    .select('created_at, event_date, event_type, budget, city, venue_name')
    .or(`city.ilike.%${cityName}%,venue_address.ilike.%${cityName}%`)
    .order('created_at', { ascending: false })
    .limit(1000);
  
  const totalInquiries = inquiries?.length || 0;
  
  // Calculate booking lead time (days between inquiry and event)
  const leadTimes = inquiries
    ?.filter(inq => inq.event_date && inq.created_at)
    .map(inq => {
      const inquiryDate = new Date(inq.created_at);
      const eventDate = new Date(inq.event_date);
      return Math.floor((eventDate.getTime() - inquiryDate.getTime()) / (1000 * 60 * 60 * 24));
    })
    .filter(lt => lt > 0 && lt < 365) || []; // Filter out invalid dates
  
  const averageBookingLeadTime = leadTimes.length > 0
    ? Math.round(leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length)
    : null;
  
  // Calculate peak booking months
  const monthCounts: Record<string, number> = {};
  inquiries?.forEach(inq => {
    if (inq.event_date) {
      const month = new Date(inq.event_date).toLocaleString('en-US', { month: 'long' });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    }
  });
  const peakBookingMonths = Object.entries(monthCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([month]) => month);
  
  // Get response time statistics (from inquiry creation to DJ response)
  // Note: This would require tracking response times in dj_inquiries or a separate table
  // For now, we'll use a default or calculate from available data
  const averageResponseTime = null; // TODO: Implement response time tracking
  const medianResponseTime = null;
  
  // Get event statistics
  const { data: events } = await supabase
    .from('events')
    .select('event_duration, event_type, music_preferences, venue_name')
    .eq('status', 'completed')
    .or(`venue_address.ilike.%${cityName}%`);
  
  const totalBookings = events?.length || 0;
  
  const eventLengths = events
    ?.map(e => e.event_duration)
    .filter((d): d is number => d !== null && d > 0) || [];
  
  const averageEventLength = eventLengths.length > 0
    ? eventLengths.reduce((sum, len) => sum + len, 0) / eventLengths.length
    : null;
  
  // Get most requested genres (from music_preferences or event data)
  const genreCounts: Record<string, number> = {};
  events?.forEach(event => {
    if (event.music_preferences) {
      const genres = event.music_preferences.toLowerCase().split(/[,\s]+/);
      genres.forEach((genre: string) => {
        if (genre.length > 2) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      });
    }
  });
  const mostRequestedGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);
  
  // Get most requested event types
  const eventTypeCounts: Record<string, number> = {};
  inquiries?.forEach(inq => {
    if (inq.event_type) {
      eventTypeCounts[inq.event_type] = (eventTypeCounts[inq.event_type] || 0) + 1;
    }
  });
  const mostRequestedEventTypes = Object.entries(eventTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type]) => type);
  
  // Get review statistics
  const { data: reviews } = await supabase
    .from('dj_reviews')
    .select('rating, is_verified, dj_profiles!inner(city, primary_city, organization_id)')
    .eq('is_approved', true)
    .in('dj_profiles.organization_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000'])
    .or(`dj_profiles.city.ilike.%${cityName}%,dj_profiles.primary_city.ilike.%${cityName}%`);
  
  const totalReviews = reviews?.length || 0;
  const verifiedReviews = reviews?.filter(r => r.is_verified).length || 0;
  
  const ratings = reviews?.map(r => r.rating).filter((r): r is number => r > 0) || [];
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : null;
  
  // Get popular venues
  const venueCounts: Record<string, number> = {};
  inquiries?.forEach(inq => {
    if (inq.venue_name) {
      venueCounts[inq.venue_name] = (venueCounts[inq.venue_name] || 0) + 1;
    }
  });
  const popularVenues = Object.entries(venueCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, inquiryCount: count }));
  
  // Check data requirements
  const requirements = await checkCityDataRequirements(cityName, stateAbbr);
  
  // Determine data quality
  const totalDJsCount = totalDJs || 0;
  let dataQuality: 'high' | 'medium' | 'low' = 'low';
  if (totalDJsCount >= 10 && totalInquiries >= 50 && totalReviews >= 10) {
    dataQuality = 'high';
  } else if (totalDJsCount >= 5 && totalInquiries >= 20 && totalReviews >= 3) {
    dataQuality = 'medium';
  }
  
  return {
    totalDJs: totalDJsCount,
    availableDJs,
    verifiedDJs,
    averagePrice,
    medianPrice,
    priceRange,
    totalInquiries,
    totalBookings,
    averageBookingLeadTime,
    peakBookingMonths,
    averageResponseTime,
    medianResponseTime,
    averageEventLength,
    mostRequestedGenres: mostRequestedGenres.length > 0 ? mostRequestedGenres : ['Various'],
    mostRequestedEventTypes: mostRequestedEventTypes.length > 0 ? mostRequestedEventTypes : ['wedding', 'corporate', 'private_party'],
    totalReviews,
    verifiedReviews,
    averageRating,
    popularVenues,
    meetsMinimumRequirements: requirements.meetsRequirements,
    dataQuality,
  };
}

/**
 * Aggregate city + event type specific statistics
 */
export async function aggregateCityEventData(
  cityName: string,
  eventType: string,
  stateAbbr?: string
): Promise<CityEventDataSnapshot> {
  const baseData = await aggregateCityData(cityName, stateAbbr);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get event-type specific inquiries
  const { data: eventInquiries } = await supabase
    .from('dj_inquiries')
    .select('created_at, event_date, budget')
    .eq('event_type', eventType)
    .or(`city.ilike.%${cityName}%,venue_address.ilike.%${cityName}%`)
    .order('created_at', { ascending: false })
    .limit(500);
  
  const eventTypeInquiries = eventInquiries?.length || 0;
  
  // Get event-type specific bookings
  const { count: eventTypeBookings } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', eventType)
    .eq('status', 'completed')
    .or(`venue_address.ilike.%${cityName}%`);
  
  // Calculate event-type specific pricing
  const eventBudgets = eventInquiries
    ?.map(inq => inq.budget)
    .filter((b): b is number => b !== null && b > 0) || [];
  
  const eventTypeAveragePrice = eventBudgets.length > 0
    ? eventBudgets.reduce((sum, b) => sum + b, 0) / eventBudgets.length
    : null;
  
  // Calculate event-type peak months
  const eventMonthCounts: Record<string, number> = {};
  eventInquiries?.forEach(inq => {
    if (inq.event_date) {
      const month = new Date(inq.event_date).toLocaleString('en-US', { month: 'long' });
      eventMonthCounts[month] = (eventMonthCounts[month] || 0) + 1;
    }
  });
  const eventTypePeakMonths = Object.entries(eventMonthCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([month]) => month);
  
  return {
    ...baseData,
    eventType,
    eventTypeInquiries,
    eventTypeBookings: eventTypeBookings || 0,
    eventTypeAveragePrice,
    eventTypePeakMonths: eventTypePeakMonths.length > 0 ? eventTypePeakMonths : baseData.peakBookingMonths,
  };
}

