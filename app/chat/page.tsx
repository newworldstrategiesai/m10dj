import { redirect } from 'next/navigation';
import { requireAdmin } from '@/utils/auth-helpers/admin';
import ChatPageClient from './ChatPageClient';

export default async function Page() {
  // Check if user is authenticated admin - redirects if not
  await requireAdmin();
  
  return <ChatPageClient />;
} 