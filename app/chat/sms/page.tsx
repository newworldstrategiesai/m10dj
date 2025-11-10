import { requireAdmin } from '@/utils/auth-helpers/admin';
import ChatPageClient from '../ChatPageClient';

export default async function SmsChatPage() {
  await requireAdmin();
  return <ChatPageClient />;
}

