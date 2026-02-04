import { ImageResponse } from 'next/server';

export const alt = 'Video Meeting';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = { params: { username: string } };

export default async function MeetOpengraphImage({ params }: Props) {
  const username = (params?.username ?? '').replace(/^@/, '').trim().substring(0, 30) || 'Meeting';
  const isM10 = process.env.NEXT_PUBLIC_SITE_URL?.includes('m10djcompany') ?? false;
  const brand = isM10 ? 'M10 DJ Company' : 'TipJar Live';
  const accent = isM10 ? '#fcba00' : '#10b981';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: 24,
            background: accent,
            marginBottom: 32,
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4" />
          </svg>
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, color: 'white', marginBottom: 12 }}>
          Video Meeting
        </div>
        <div style={{ fontSize: 28, color: '#94a3b8', marginBottom: 40 }}>
          Join @{username}
        </div>
        <div style={{ fontSize: 22, color: '#64748b' }}>
          {brand}
        </div>
      </div>
    ),
    { ...size }
  );
}
