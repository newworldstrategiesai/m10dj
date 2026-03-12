import { Metadata } from 'next';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getURL } from '@/utils/helpers';

interface MeetLayoutProps {
  params: { username: string };
  children: React.ReactNode;
}

function getBaseUrlFromHeaders(host: string | null): string {
  if (!host) return getURL();
  const hostLower = host.toLowerCase();
  if (hostLower.includes('tipjar.live')) return 'https://www.tipjar.live';
  if (hostLower.includes('djdash.net')) return 'https://www.djdash.net';
  if (hostLower.includes('m10djcompany')) return 'https://www.m10djcompany.com';
  return getURL();
}

export async function generateMetadata({ params }: MeetLayoutProps): Promise<Metadata> {
  const username = (params?.username ?? '').replace(/^@/, '').trim().substring(0, 50);
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const baseUrl = getBaseUrlFromHeaders(host).replace(/\/+$/, '');
  const meetUrl = `${baseUrl}/meet/${username}`;
  const ogImageUrl = `${baseUrl}/meet/${username}/opengraph-image`;
  const siteName = baseUrl.includes('m10djcompany') ? 'M10 DJ Company' : 'TipJar Live';

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
      title = siteName === 'M10 DJ Company'
        ? `Meet with @${username}`
        : `Join @${username}'s Video Meeting`;
      description = siteName === 'M10 DJ Company'
        ? `Schedule or join a video call with @${username} at ${siteName}.`
        : `Join the video meeting with @${username}.`;
    }
  } catch {
    // use defaults
  }

  const ogTitle = siteName === 'M10 DJ Company' ? `${title} | ${siteName}` : title;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: meetUrl,
      siteName,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Meet with @${username} – ${siteName}`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [ogImageUrl],
    },
    robots: { index: false, follow: true },
  };
}

export default function MeetLayout({ children }: MeetLayoutProps) {
  return <>{children}</>;
}
