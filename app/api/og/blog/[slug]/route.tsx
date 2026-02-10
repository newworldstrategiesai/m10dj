import { ImageResponse } from 'next/server';
import { db } from '../../../../../utils/company_lib/supabase';

export const runtime = 'edge';

const W = 1200;
const H = 630;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';

type Props = { params: { slug: string } };

export async function GET(request: Request, { params }: Props) {
  const slug = params?.slug ?? '';
  const post = slug ? await db.getBlogPostBySlug(slug) : null;
  const title = post?.title ?? 'M10 DJ Company Blog';
  const backgroundUrl =
    post?.featured_image_url && post.featured_image_url.startsWith('http')
      ? post.featured_image_url
      : `${BASE}/logo-static.jpg`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background image (img tag for Satori compatibility) */}
        {backgroundUrl && (
          <img
            src={backgroundUrl}
            alt=""
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: W,
              height: H,
              objectFit: 'cover',
            }}
          />
        )}
        {/* Dark gradient overlay so text stands out */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 70%, transparent 100%)',
          }}
        />
        {/* Title + subtitle */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            width: '100%',
            padding: '48px 56px 56px',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.15,
              maxWidth: '100%',
              display: 'flex',
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6)',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#fbbf24',
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            }}
          >
            M10 DJ Company · Blog
          </div>
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
