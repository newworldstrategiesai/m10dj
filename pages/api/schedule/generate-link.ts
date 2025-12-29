import type { NextApiRequest, NextApiResponse } from 'next';
import { generateScheduleLink, generateScheduleLinkFromSubmission, generateScheduleLinkFromContact } from '../../../utils/schedule-link-generator';

/**
 * API endpoint to generate customized schedule links
 * Usage: POST /api/schedule/generate-link
 * 
 * Body can be either:
 * 1. Direct parameters (ScheduleLinkParams)
 * 2. contact_submission object (with field mapping)
 * 3. contact object (with field mapping)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data, baseUrl } = req.body;

    let scheduleLink: string;

    if (type === 'submission' && data) {
      // Generate from contact_submissions table data
      scheduleLink = generateScheduleLinkFromSubmission(data, baseUrl);
    } else if (type === 'contact' && data) {
      // Generate from contacts table data
      scheduleLink = generateScheduleLinkFromContact(data, baseUrl);
    } else if (data) {
      // Direct parameters
      scheduleLink = generateScheduleLink({ ...data, baseUrl });
    } else {
      return res.status(400).json({ 
        error: 'Invalid request. Provide either type and data, or direct parameters.' 
      });
    }

    return res.status(200).json({ 
      scheduleLink,
      message: 'Schedule link generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating schedule link:', error);
    return res.status(500).json({ 
      error: 'Failed to generate schedule link',
      details: error.message 
    });
  }
}

