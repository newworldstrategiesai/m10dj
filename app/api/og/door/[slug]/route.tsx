import { ImageResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const W = 1200;
const H = 630;

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params?.slug ?? '';
  const host = request.headers.get('host') || '';
  const isTipJar = host.includes('tipjar.live') || host.includes('tipjar.com');

  let orgName = 'Door Tickets';
  let venueDisplay = '';
  if (slug) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      let { data: org } = await supabase
        .from('organizations')
        .select('name, door_settings')
        .eq('slug', slug)
        .single();
      if (!org) {
        const { data: norm } = await supabase.rpc('get_organization_by_normalized_slug', { input_slug: slug });
        if (norm?.[0]?.slug) {
          const { data: full } = await supabase
            .from('organizations')
            .select('name, door_settings')
            .eq('slug', norm[0].slug)
            .single();
          org = full;
        }
      }
      if (org) {
        orgName = org.name || orgName;
        const ds = (org.door_settings as Record<string, unknown>) || {};
        venueDisplay = (ds.venue_display as string) || '';
      }
    } catch {
      // use defaults
    }
  }

  const siteName = isTipJar ? 'TipJar Live' : 'M10 DJ Company';
  const accentColor = isTipJar ? '#10b981' : '#fcba00';

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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='white' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 12 }}>
          Door Tickets
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, color: accentColor, textAlign: 'center', marginBottom: venueDisplay ? 12 : 0 }}>
          {orgName}
        </div>
        {venueDisplay && (
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24 }}>
            {venueDisplay}
          </div>
        )}
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          {siteName}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
