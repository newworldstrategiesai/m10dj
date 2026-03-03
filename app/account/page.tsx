import CustomerPortalForm from '@/components/ui/AccountForms/CustomerPortalForm';
import EmailForm from '@/components/ui/AccountForms/EmailForm';
import NameForm from '@/components/ui/AccountForms/NameForm';
import AdminPhoneForm from '@/components/ui/AccountForms/AdminPhoneForm';
import AvatarForm from '@/components/ui/AccountForms/AvatarForm';
import Card from '@/components/ui/Card/Card';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import {
  getUserDetails,
  getSubscription,
  getUser,
  getAdminPhoneNumber
} from '@/utils/supabase/queries';

export default async function Account() {
  const supabase = createClient() as any;
  const [user, userDetails, subscription, adminPhoneNumber] = await Promise.all([
    getUser(supabase),
    getUserDetails(supabase),
    getSubscription(supabase),
    getAdminPhoneNumber(supabase)
  ]);

  if (!user) {
    return redirect('/signin');
  }

  return (
    <section className="mb-32 bg-black">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <div className="sm:align-center sm:flex sm:flex-col">
          <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            Account
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
            We partnered with Stripe for a simplified billing.
          </p>
        </div>
      </div>
      <div className="p-4">
        <AvatarForm
          avatarUrl={userDetails?.avatar_url ?? user?.user_metadata?.avatar_url ?? null}
          userName={userDetails?.full_name ?? user?.user_metadata?.full_name ?? ''}
        />
        <CustomerPortalForm subscription={subscription} />
        <NameForm userName={userDetails?.full_name ?? ''} />
        <EmailForm userEmail={user.email} />
        <AdminPhoneForm adminPhoneNumber={adminPhoneNumber} />
        <Card
          title="Request Page Settings"
          description="Customize your public request page, cover photo, branding, payments, and more."
          footer={
            <Link
              href="/admin/requests-page"
              className="text-zinc-300 dark:text-zinc-400 hover:text-white dark:hover:text-white underline underline-offset-2 transition-colors"
            >
              Go to Request Page Settings →
            </Link>
          }
        >
          <p className="mt-4 mb-4 text-sm text-zinc-400 dark:text-zinc-500">
            Configure how your request page appears to guests—cover photo, social links, tip options, and more.
          </p>
        </Card>
      </div>
    </section>
  );
}
