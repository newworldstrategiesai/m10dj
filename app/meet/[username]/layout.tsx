import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { getURL } from '@/utils/helpers';

interface MeetLayoutProps {
  params: { username: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: MeetLayoutProps): Promise<Metadata> {
  const username = (params?.username ?? '').replace(/^@/, '').trim().substring(0, 50);
  const baseUrl = getURL();
  const meetUrl = `${baseUrl.replace(/\/+$/, '')}/meet/${username}`;

  let title = 'Video Meeting';
  let description = 'Join this video meeting.';

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('meet_rooms')
      .select('title, username')
      .eq('username', username)
      .maybeSingle();

    const room = data as { title: string | null; username: string } | null;
    if (room?.title) {
      title = room.title;
      description = `Join "${room.title}" – video meeting with @${room.username || username}.`;
    } else if (username) {
      title = `Join @${username}'s Video Meeting`;
      description = `Join the video meeting with @${username}.`;
    }
  } catch {
    // use defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: meetUrl,
      siteName: baseUrl.includes('m10djcompany') ? 'M10 DJ Company' : 'TipJar Live',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: false, follow: true },
  };
}

export default function MeetLayout({ children }: MeetLayoutProps) {
  return <>{children}</>;
}
