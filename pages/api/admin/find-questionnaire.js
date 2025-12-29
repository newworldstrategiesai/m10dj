/**
 * Admin API endpoint to find a contact's questionnaire by name, email, or phone
 * Usage: GET /api/admin/find-questionnaire?search=veronica%20gomez
 */

import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Require admin authentication to search questionnaires
  try {
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({ error: 'Search parameter is required' });
    }

    const searchTerm = search.toLowerCase().trim();
    console.log(`🔍 Searching for: "${searchTerm}"`);

    // Search contacts by name, email, or phone
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email_address.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (contactsError) {
      console.error('Error searching contacts:', contactsError);
      return res.status(500).json({ error: 'Failed to search contacts', details: contactsError.message });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(200).json({
        found: false,
        message: 'No contacts found matching your search',
        contacts: [],
        questionnaires: []
      });
    }

    // For each contact, get their questionnaire
    const results = await Promise.all(
      contacts.map(async (contact) => {
        const { data: questionnaire, error: qError } = await supabase
          .from('music_questionnaires')
          .select('*')
          .eq('lead_id', contact.id)
          .single();

        return {
          contact: {
            id: contact.id,
            name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
            firstName: contact.first_name,
            lastName: contact.last_name,
            email: contact.email_address,
            phone: contact.phone,
            eventType: contact.event_type,
            eventDate: contact.event_date,
            createdAt: contact.created_at
          },
          questionnaire: questionnaire ? {
            id: questionnaire.id,
            startedAt: questionnaire.started_at,
            updatedAt: questionnaire.updated_at,
            reviewedAt: questionnaire.reviewed_at,
            completedAt: questionnaire.completed_at,
            isComplete: !!questionnaire.completed_at,
            hasData: !!(
              questionnaire.big_no_songs ||
              (questionnaire.special_dances && questionnaire.special_dances.length > 0) ||
              (questionnaire.special_dance_songs && Object.keys(questionnaire.special_dance_songs).length > 0) ||
              (questionnaire.playlist_links && Object.values(questionnaire.playlist_links).some(link => link)) ||
              questionnaire.ceremony_music_type ||
              (questionnaire.ceremony_music && Object.keys(questionnaire.ceremony_music).length > 0) ||
              questionnaire.mc_introduction !== null
            ),
            data: {
              bigNoSongs: questionnaire.big_no_songs || '',
              specialDances: questionnaire.special_dances || [],
              specialDanceSongs: questionnaire.special_dance_songs || {},
              playlistLinks: questionnaire.playlist_links || {},
              ceremonyMusicType: questionnaire.ceremony_music_type || '',
              ceremonyMusic: questionnaire.ceremony_music || {},
              mcIntroduction: questionnaire.mc_introduction
            },
            questionnaireUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/quote/${contact.id}/questionnaire`
          } : null,
          questionnaireError: qError && qError.code !== 'PGRST116' ? qError.message : null
        };
      })
    );

    // Filter to only show contacts with questionnaires
    const withQuestionnaires = results.filter(r => r.questionnaire !== null);
    const completedQuestionnaires = withQuestionnaires.filter(r => r.questionnaire?.isComplete);

    return res.status(200).json({
      found: true,
      searchTerm,
      totalContacts: contacts.length,
      contactsWithQuestionnaires: withQuestionnaires.length,
      completedQuestionnaires: completedQuestionnaires.length,
      results: results.map(r => ({
        contact: r.contact,
        hasQuestionnaire: r.questionnaire !== null,
        questionnaireStatus: r.questionnaire ? (r.questionnaire.isComplete ? 'completed' : 'in_progress') : 'not_started',
        questionnaireUrl: r.questionnaire?.questionnaireUrl,
        questionnaire: r.questionnaire
      }))
    });

  } catch (error) {
    console.error('Error in find-questionnaire API:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

