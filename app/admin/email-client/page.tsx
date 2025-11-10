import { requireAdmin } from '@/utils/auth-helpers/admin';
import EmailClient from '@/components/email-client';

export default async function AdminEmailPage() {
  await requireAdmin();
  return <EmailClient />;
}
