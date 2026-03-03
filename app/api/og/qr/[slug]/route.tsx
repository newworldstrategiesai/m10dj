import { ImageResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const W = 1200;
const H = 630;

// TipJar QR page OG - dark theme, "Scan to Request Songs", org name
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params?.slug ?? '';
  const host = request.headers.get('host') || '';
  const isTipJar = host.includes('tipjar.live') || host.includes('tipjar.com');
  const isDJDash = host.includes('djdash.net') || host.includes('djdash.com');

  let orgName = 'Request Songs';
  if (slug) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: org } = await supabase
        .from('organizations')
        .select('requests_header_artist_name, name')
        .eq('slug', slug)
        .single();
      if (org?.requests_header_artist_name) {
        orgName = org.requests_header_artist_name;
      } else if (org?.name) {
        orgName = org.name;
      }
    } catch {
      // use default
    }
  }

  const siteName = isTipJar ? 'TipJar Live' : isDJDash ? 'DJ Dash' : 'M10 DJ Company';
  const accentColor = isTipJar ? '#FFFFFF' : isDJDash ? '#667eea' : '#fcba00';

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
          background: isTipJar
            ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative QR-style grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 80,
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            Scan to Request Songs
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: accentColor,
              textAlign: 'center',
            }}
          >
            {orgName}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
            }}
          >
            {siteName} · QR Display
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        'Cache-Control':
          'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
