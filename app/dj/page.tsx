import { redirect } from 'next/navigation';
import { getUserRole } from '@/utils/auth-helpers/role-redirect';
import { createClient } from '@/utils/supabase/server';
import DJDashboardClient from './DJDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DJDashboardPage() {
  // Check if user is authenticated and is an admin
  const userRole = await getUserRole();
  
  if (!userRole) {
    redirect('/signin');
  }
  
  if (!userRole.isAdmin) {
    // Non-admins cannot access this page
    redirect('/client/dashboard');
  }

  // Get user details for the client component
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  return <DJDashboardClient userId={user.id} userEmail={user.email || ''} />;
}

