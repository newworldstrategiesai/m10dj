import { trackPricingViewWithoutSelection } from '../../../utils/followup-tracker';

/**
 * Track that a lead viewed pricing but hasn't made a selection
 * This will be used to trigger follow-up emails 2-3 days later
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, quoteId, metadata } = req.body;

  if (!contactId || !quoteId) {
    return res.status(400).json({ error: 'contactId and quoteId are required' });
  }

  try {
    const result = await trackPricingViewWithoutSelection(contactId, quoteId, metadata);
    
    if (result.tracked) {
      return res.status(200).json({ 
        success: true, 
        message: 'Pricing view tracked for follow-up',
        data: result.data
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        message: 'Not tracked (selection exists or already tracked)',
        reason: result.reason
      });
    }
  } catch (error) {
    console.error('Error tracking pricing view:', error);
    return res.status(500).json({ 
      error: 'Failed to track pricing view', 
      details: error.message 
    });
  }
}

