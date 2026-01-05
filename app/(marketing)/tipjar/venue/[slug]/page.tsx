import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { Button } from '@/components/ui/button';
import { Music, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VenuePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: VenuePageProps): Promise<Metadata> {
  const { data: venueOrg } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', params.slug)
    .eq('organization_type', 'venue')
    .single();

  if (!venueOrg) {
    return {
      title: 'Venue Not Found | TipJar.Live',
    };
  }

  return {
    title: `${venueOrg.name} | TipJar.Live`,
    description: `View all performers at ${venueOrg.name} on TipJar.Live`,
  };
}

export default async function VenuePage({ params }: VenuePageProps) {
  // Get venue organization
  const { data: venueOrg, error: venueError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', params.slug)
    .eq('organization_type', 'venue')
    .single();

  if (venueError || !venueOrg) {
    notFound();
  }

  // Get all active performers for this venue
  const { data: performers, error: performersError } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      performer_slug,
      slug,
      is_active,
      created_at,
      artist_page_profile_image_url,
      artist_page_headline
    `)
    .eq('parent_organization_id', venueOrg.id)
    .eq('organization_type', 'performer')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  const activePerformers = performers || [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {venueOrg.name}
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8">
              Our Performers
            </p>
            <div className="flex items-center justify-center gap-2 text-white/90">
              <Users className="w-5 h-5" />
              <span>{activePerformers.length} {activePerformers.length === 1 ? 'Performer' : 'Performers'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Performers Roster */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          {activePerformers.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                Meet Our Performers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activePerformers.map((performer: any) => (
                  <Link
                    key={performer.id}
                    href={`/${params.slug}/${performer.performer_slug}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
                      {/* Performer Image */}
                      <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400">
                        {performer.artist_page_profile_image_url ? (
                          <Image
                            src={performer.artist_page_profile_image_url}
                            alt={performer.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Music className="w-16 h-16 text-white/50" />
                          </div>
                        )}
                      </div>
                      
                      {/* Performer Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {performer.name}
                        </h3>
                        {performer.artist_page_headline && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {performer.artist_page_headline}
                          </p>
                        )}
                        <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium text-sm">
                          <span>Visit Tip Page</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center py-16">
              <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Performers Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon to see our roster of performers!
              </p>
            </div>
          )}
        </div>
      </section>

      <TipJarFooter />
    </div>
  );
}

