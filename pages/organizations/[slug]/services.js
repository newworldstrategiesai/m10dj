/**
 * Organization Services Page
 * 
 * Services page for a specific organization
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Music, Users, Calendar, Award, Star } from 'lucide-react';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import SEO from '../../../components/SEO';
import Link from 'next/link';

export default function OrganizationServicesPage() {
  const router = useRouter();
  const { slug } = router.query;
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrganization() {
      if (!slug) return;

      try {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!error && org) {
          setOrganization(org);
        }
      } catch (err) {
        console.error('Error loading organization:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [slug, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
        </div>
      </div>
    );
  }

  const services = [
    {
      icon: Music,
      title: 'Wedding DJ Services',
      description: 'Complete wedding entertainment packages including ceremony music, cocktail hour, and reception DJ services.',
      features: ['Ceremony music', 'Cocktail hour', 'Reception DJ', 'MC services', 'Lighting packages']
    },
    {
      icon: Users,
      title: 'Corporate Events',
      description: 'Professional DJ services for corporate gatherings, company parties, and business events.',
      features: ['Corporate galas', 'Company parties', 'Product launches', 'Team building events']
    },
    {
      icon: Calendar,
      title: 'Private Parties',
      description: 'Make your special celebration unforgettable with our private party DJ services.',
      features: ['Birthday parties', 'Anniversaries', 'Graduations', 'Holiday parties']
    },
    {
      icon: Award,
      title: 'Event Planning',
      description: 'Full-service event planning and coordination to ensure your event runs smoothly.',
      features: ['Timeline planning', 'Vendor coordination', 'Day-of coordination', 'Setup & breakdown']
    }
  ];

  return (
    <>
      <Head>
        <title>Services - {organization.name}</title>
        <meta name="description" content={`Professional DJ services from ${organization.name}.`} />
        <SEO />
      </Head>

      <Header />

      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-4">Our Services</h1>
          <p className="text-xl text-gray-600 text-center mb-12">
            Professional DJ services for every occasion
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
                  <Icon className="w-12 h-12 text-brand-gold mb-4" />
                  <h2 className="text-2xl font-bold mb-3">{service.title}</h2>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <Star className="w-4 h-4 text-brand-gold mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/contact"
              className="inline-block bg-brand-gold text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-500 transition-colors"
            >
              Get a Custom Quote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

