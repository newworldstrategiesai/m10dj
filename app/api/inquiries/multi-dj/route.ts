/**
 * Multi-DJ Inquiry API
 * Single form submission that fans out to multiple DJs
 */

import { NextRequest, NextResponse } from 'next/server';
import { processMultiDJInquiry, MultiDJInquiry } from '@/utils/multiDJBlast';

export async function POST(request: NextRequest) {
  try {
    const body: MultiDJInquiry = await request.json();
    
    // Validate required fields
    if (!body.planner_name || !body.planner_email || !body.event_type || 
        !body.event_date || !body.city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Process inquiry
    const result = await processMultiDJInquiry(body);
    
    return NextResponse.json({
      success: true,
      lead_id: result.lead_id,
      message: 'Your inquiry has been sent to multiple DJs. You will receive responses soon.',
      estimated_response_time: '15-30 minutes'
    });
  } catch (error: any) {
    console.error('Error processing multi-DJ inquiry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process inquiry' },
      { status: 500 }
    );
  }
}

