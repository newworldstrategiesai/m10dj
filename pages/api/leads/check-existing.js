// API endpoint to check if a contact already exists
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = [
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
  'djbenmurray@gmail.com',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userEmail = session.user.email || '';
    const isAdminByEmail = ADMIN_EMAILS.includes(userEmail);

    if (!isAdminByEmail) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { phone, email } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ error: 'Phone or email required' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let contact = null;

    if (email) {
      const { data } = await adminClient
        .from('contacts')
        .select('id, first_name, last_name, phone, email_address')
        .eq('email_address', email)
        .is('deleted_at', null)
        .maybeSingle();
      
      contact = data;
    }

    if (!contact && phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      const { data } = await adminClient
        .from('contacts')
        .select('id, first_name, last_name, phone, email_address')
        .ilike('phone', `%${phoneDigits}%`)
        .is('deleted_at', null)
        .maybeSingle();
      
      contact = data;
    }

    return res.status(200).json({ contact });
  } catch (error) {
    console.error('Error checking existing contact:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

