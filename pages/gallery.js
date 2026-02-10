import Head from 'next/head';
import Header from '../components/company/Header';
import PhotoGallery from '../components/company/PhotoGallery';
import { Music } from 'lucide-react';

// Fallback when API returns empty or before migration (admin-managed photos in DB)
const FALLBACK_PHOTOS = [
  { id: 'alfreds-beale-stax', src: '/assets/photos/DJ-Ben-Murray-at-Alfreds-on-Beale-with-Stax.jpg', alt: 'DJ Ben Murray at Alfred\'s on Beale with Stax', caption: "Alfred's on Beale with Stax" },
  { id: 'hu-hotel-rooftop-1', src: '/assets/photos/DJ-Ben-Murray-at-Hu-Hotel-Rooftop.JPG', alt: 'DJ Ben Murray at Hu Hotel Rooftop', caption: 'Hu Hotel Rooftop' },
  { id: 'hu-hotel-rooftop-2', src: '/assets/photos/DJ-Ben-Murray-at-Hu-Hotel-Rooftop-2.JPG', alt: 'DJ Ben Murray at Hu Hotel Rooftop', caption: 'Hu Hotel Rooftop' },
  { id: 'mempho-music-fest-1', src: '/assets/photos/DJ-Ben-Murray-at-Mempho-Music-Fest.PNG', alt: 'DJ Ben Murray at Mempho Music Fest', caption: 'Mempho Music Fest' },
  { id: 'mempho-music-fest-2', src: '/assets/photos/DJ-Ben-Murray-at-Mempho-Music-Fest-2.JPG', alt: 'DJ Ben Murray at Mempho Music Fest', caption: 'Mempho Music Fest' },
  { id: 'mollie-fontaine-lounge', src: '/assets/photos/DJ-Ben-Murray-at-Mollie-Fontaine-Lounge.JPG', alt: 'DJ Ben Murray at Mollie Fontaine Lounge', caption: 'Mollie Fontaine Lounge' },
  { id: 'renasant-convention-1', src: '/assets/photos/DJ-Ben-Murray-at-Renasant-Convention-Center.JPG', alt: 'DJ Ben Murray at Renasant Convention Center', caption: 'Renasant Convention Center' },
  { id: 'renasant-convention-2', src: '/assets/photos/DJ-Ben-Murray-at-Renasant-Convention-Center-2.JPG', alt: 'DJ Ben Murray at Renasant Convention Center', caption: 'Renasant Convention Center' },
  { id: 'the-bluff-1', src: '/assets/photos/DJ-Ben-Murray-at-the-Bluff.jpg', alt: 'DJ Ben Murray at The Bluff', caption: 'The Bluff' },
  { id: 'the-bluff-2', src: '/assets/photos/DJ-Ben-Murray-at-the-Bluff-2.jpg', alt: 'DJ Ben Murray at The Bluff', caption: 'The Bluff' },
  { id: 'the-bluff-3', src: '/assets/photos/DJ-Ben-Murray-at-the-Bluff-3.jpg', alt: 'DJ Ben Murray at The Bluff', caption: 'The Bluff' },
  { id: 'the-bluff-4', src: '/assets/photos/DJ-Ben-Murray-at-the-Bluff-4.JPG', alt: 'DJ Ben Murray at The Bluff', caption: 'The Bluff' },
  { id: 'fraternity-party-uofm', src: '/assets/photos/DJ-Ben-Murray-Fraternity-Party-University-of-Memphis.JPG', alt: 'DJ Ben Murray — Fraternity Party at University of Memphis', caption: 'Fraternity Party, University of Memphis' },
  { id: 'nashville-broadway-1', src: '/assets/photos/DJ-Ben-Murray-in-Nashville-on-Broadway.JPG', alt: 'DJ Ben Murray in Nashville on Broadway', caption: 'Nashville on Broadway' },
  { id: 'nashville-broadway-2', src: '/assets/photos/DJ-Ben-Murray-in-Nashville-on-Broadway-2.JPG', alt: 'DJ Ben Murray in Nashville on Broadway', caption: 'Nashville on Broadway' },
  { id: 'logan-garrett-bluff', src: '/assets/photos/DJ-Ben-Murray-Logan-Garrett-at-the-Bluff.JPG', alt: 'DJ Ben Murray and Logan Garrett at The Bluff', caption: 'Logan Garrett at The Bluff' },
  { id: 'ole-miss-fraternity', src: '/assets/photos/DJ-Ben-Murray-Ole-Miss-Fraternity-with-Vault-Entertainment.JPG', alt: 'DJ Ben Murray — Ole Miss Fraternity with Vault Entertainment', caption: 'Ole Miss Fraternity with Vault Entertainment' },
  { id: 'school-dance-mus', src: '/assets/photos/DJ-Ben-Murray-School-Dance-at-MUS-Memphis-University-School.jpeg', alt: 'DJ Ben Murray — School Dance at Memphis University School', caption: 'School Dance at Memphis University School' },
  { id: 'jerry-lee-lewis-ryan-peel', src: '/assets/photos/DJ-Ben-Murray-with-drummer-Ryan-Peel-at-Jerry-Lee-Lewis.JPG', alt: 'DJ Ben Murray with drummer Ryan Peel at Jerry Lee Lewis', caption: 'With drummer Ryan Peel at Jerry Lee Lewis' },
  { id: 'with-microphone', src: '/assets/photos/DJ-Ben-Murray-with-microphone.JPG', alt: 'DJ Ben Murray with microphone', caption: 'DJ Ben Murray' },
  { id: 'pioneer-ddjsz', src: '/assets/photos/M10-DJ-Company-Pioneer-DDJSZ.JPG', alt: 'M10 DJ Company — Pioneer DDJ-SZ', caption: 'Pioneer DDJ-SZ' },
  { id: 'cutout-alpha', src: '/assets/photos/DJ%20Ben%20Murray%20Cut%20out%20w%3A%20Alpha.PNG', alt: 'DJ Ben Murray', caption: 'DJ Ben Murray' },
];

const CANONICAL = 'https://m10djcompany.com/gallery';
const OG_IMAGE = 'https://m10djcompany.com/assets/DJ-Ben-Murray-NYE-Beale-St-2026-1.jpg';

export async function getServerSideProps() {
  let photos = [];
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${base}/api/gallery-photos`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) photos = data;
    }
  } catch (_) {}
  if (photos.length === 0) photos = FALLBACK_PHOTOS;
  return { props: { photos } };
}

export default function GalleryPage({ photos }) {
  const galleryPhotos = photos && photos.length > 0 ? photos : FALLBACK_PHOTOS;
  return (
    <>
      <Head>
        <title>Photo Gallery | M10 DJ Company — Memphis Event DJs</title>
        <meta
          name="description"
          content="Photos from M10 DJ Company events: weddings, corporate events, New Year's Eve on Beale Street, and more. Memphis's premier DJ entertainment."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="Photo Gallery | M10 DJ Company" />
        <meta property="og:description" content="Photos from M10 DJ Company events — weddings, corporate, NYE on Beale Street, and more." />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:alt" content="M10 DJ Company event photo gallery" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Photo Gallery | M10 DJ Company" />
        <meta name="twitter:description" content="Photos from M10 DJ Company events — Memphis's premier DJ entertainment." />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Head>

      <Header />

      <main className="min-h-screen bg-white dark:bg-zinc-950">
        {/* Hero */}
        <section className="section-container py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-400 text-black rounded-lg flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white font-sans">
                Photo Gallery
              </h1>
              <p className="text-amber-500 dark:text-amber-400 font-semibold font-inter">
                M10 DJ Company
              </p>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl text-base md:text-lg">
            Moments from weddings, corporate events, New Year&apos;s Eve on Beale Street, and more.
            Click any photo to view full size and browse.
          </p>
        </section>

        {/* Gallery grid + modal (admin-managed via /admin/gallery or fallback) */}
        <section className="section-container pb-16 md:pb-24">
          <PhotoGallery photos={galleryPhotos} />
        </section>
      </main>
    </>
  );
}
