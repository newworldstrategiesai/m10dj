import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { quoteSelectionId } = req.body;

  if (!quoteSelectionId) {
    return res.status(400).json({ error: 'Quote selection ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete the quote selection
    const { error } = await supabase
      .from('quote_selections')
      .delete()
      .eq('id', quoteSelectionId);

    if (error) {
      console.error('Error deleting quote selection:', error);
      return res.status(500).json({ error: 'Failed to delete quote selection', details: error.message });
    }

    console.log('✅ Quote selection deleted successfully:', quoteSelectionId);

    return res.status(200).json({ 
      success: true,
      message: 'Quote selection deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error in delete quote API:', error);
    return res.status(500).json({ 
      error: 'Failed to delete quote selection',
      details: error.message 
    });
  }
}

