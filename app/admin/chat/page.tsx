import { requireAdmin } from '@/utils/auth-helpers/admin';
import AdminChatPageClient from './AdminChatPageClient';

export default async function AdminChatPage() {
  await requireAdmin();
  return <AdminChatPageClient />;
}

