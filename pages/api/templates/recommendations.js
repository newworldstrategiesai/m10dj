import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { TemplateRecommendationEngine } from '../../../../lib/email/template-recommendation-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Get recommended email templates for a contact
 * Based on customer journey stage and context
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const engine = new TemplateRecommendationEngine(supabaseAdmin);

    const recommendations = await engine.getRecommendedTemplates(contactId);

    // Track recommendation
    await supabaseAdmin
      .from('email_template_history')
      .insert(
        recommendations.map(rec => ({
          contact_id: contactId,
          template_key: rec.template_key,
          status: 'recommended',
          recommendation_score: rec.recommendation_score,
          context_data: {
            urgency_level: rec.urgency_level,
            context_summary: rec.context_summary
          }
        }))
      );

    res.status(200).json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Error getting template recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
}
