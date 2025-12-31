import { redirect } from 'next/navigation';
import { getUserRole } from '@/utils/auth-helpers/role-redirect';
import { createClient } from '@/utils/supabase/server';
import DialerClient from './DialerClient';

export const dynamic = 'force-dynamic';

export default async function DialerPage() {
  // Check if user is authenticated
  const userRole = await getUserRole();
  
  if (!userRole) {
    redirect('/signin');
  }

  // Get user details for the client component
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  return <DialerClient userId={user.id} userEmail={user.email || ''} />;
}

