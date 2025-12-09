/**
 * Organization Homepage
 * 
 * Serves as the public-facing homepage for an organization
 * Accessible via: /organizations/[slug] or [slug].yourdomain.com
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Music, MapPin, Phone, Mail, Star, Calendar, Users, Award } from 'lucide-react';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import ContactForm from '../../../components/company/ContactForm';
import SEO from '../../../components/SEO';

export default function OrganizationHomepage() {
  const router = useRouter();
  const { slug } = router.query;
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrganization() {
      if (!slug) return;

      try {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (orgError || !org) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        setOrganization(org);
      } catch (err) {
        console.error('Error loading organization:', err);
        setError('Failed to load organization');
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

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
          <p className="text-gray-600">{error || 'The organization you\'re looking for doesn\'t exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{organization.name} - Professional DJ Services</title>
        <meta name="description" content={`${organization.name} - Professional DJ services for weddings, corporate events, and private parties.`} />
        <SEO />
      </Head>

      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to {organization.name}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Professional DJ services for weddings, corporate events, and private parties
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contact"
              className="bg-brand-gold text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-500 transition-colors"
            >
              Get a Quote
            </a>
            <a
              href="/requests"
              className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Request a Song
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <Music className="w-12 h-12 text-brand-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Wedding DJ</h3>
              <p className="text-gray-600">Make your special day unforgettable with our professional wedding DJ services.</p>
            </div>
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <Users className="w-12 h-12 text-brand-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Corporate Events</h3>
              <p className="text-gray-600">Professional entertainment for corporate gatherings, galas, and company parties.</p>
            </div>
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <Calendar className="w-12 h-12 text-brand-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Private Parties</h3>
              <p className="text-gray-600">Birthday parties, anniversaries, and special celebrations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Get In Touch</h2>
          <div className="max-w-2xl mx-auto">
            <ContactForm organizationId={organization.id} />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

