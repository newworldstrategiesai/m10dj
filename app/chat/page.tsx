import { redirect } from 'next/navigation';

// This page redirects to the admin chat page
export default function Page() {
  redirect('/admin/chat');
}

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic';