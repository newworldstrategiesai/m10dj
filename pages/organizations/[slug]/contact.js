/**
 * Organization Contact Page
 * 
 * Contact page for a specific organization
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import ContactForm from '../../../components/company/ContactForm';
import SEO from '../../../components/SEO';

export default function OrganizationContactPage() {
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

  return (
    <>
      <Head>
        <title>Contact {organization.name} - Get a Quote</title>
        <meta name="description" content={`Contact ${organization.name} for professional DJ services.`} />
        <SEO />
      </Head>

      <Header />

      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-4">Contact {organization.name}</h1>
          <p className="text-xl text-gray-600 text-center mb-12">
            Get in touch to discuss your event and get a custom quote
          </p>
          <ContactForm organizationId={organization.id} />
        </div>
      </section>

      <Footer />
    </>
  );
}

