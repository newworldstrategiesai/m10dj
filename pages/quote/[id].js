import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import { CheckCircle, Sparkles, Music, Calendar, MapPin, Users, Heart, Star, ArrowLeft, Loader2 } from 'lucide-react';

export default function PersonalizedQuote() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchLeadData = useCallback(async () => {
    try {
      const response = await fetch(`/api/leads/${id}`);
      if (response.ok) {
        const data = await response.json();
        setLeadData(data);
        setError(null);
      } else {
        setError('Quote not found');
      }
    } catch (error) {
      console.error('Error fetching lead data:', error);
      setError('Failed to load quote');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id, fetchLeadData]);

  const packages = [
    {
      id: 'package1',
      name: 'Package 1',
      price: 2000,
      description: 'Reception Only',
      features: [
        'Up to 4 hours of DJ/MC services at reception',
        'Speakers & microphones included',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for dance floor',
        'Uplighting (16 multicolor LED fixtures)',
        'Additional Speaker',
        'Perfect for cocktail hours separate from reception'
      ],
      popular: false
    },
    {
      id: 'package2',
      name: 'Package 2',
      price: 2500,
      description: 'Reception Only - Most Popular',
      features: [
        'Up to 4 hours of DJ/MC services at reception',
        'Speakers & microphones included',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for dance floor',
        'Uplighting (16 multicolor LED fixtures)',
        'Ceremony Audio (additional hour + ceremony music)',
        'Monogram Projection',
        'Custom graphic with your names or initials'
      ],
      popular: true
    },
    {
      id: 'package3',
      name: 'Package 3',
      price: 3000,
      description: 'Ceremony & Reception - Premium Experience',
      features: [
        'Up to 4 hours of DJ/MC services at reception',
        'Speakers & microphones included',
        'Ceremony Audio (additional hour + ceremony music)',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for dance floor',
        'Uplighting (16 multicolor LED fixtures)',
        'Dancing on the Clouds',
        'Sophisticated dry ice effect for first dance',
        'Monogram Projection',
        'Custom graphic with your names or initials'
      ],
      popular: false
    }
  ];

  const addons = [
    {
      id: 'ceremony',
      name: 'Ceremony Audio (a la carte with music)',
      price: 500,
      description: 'Speakers, microphones, and music before, during, and after ceremony',
      popular: true
    },
    {
      id: 'speaker',
      name: 'Additional Speaker',
      price: 250,
      description: 'Powered speaker with built-in mixer. Perfect for cocktail hours separate from reception'
    },
    {
      id: 'monogram',
      name: 'Monogram Projection',
      price: 350,
      description: 'Custom graphic with your names or initials, fully customizable'
    },
    {
      id: 'uplighting',
      name: 'Uplighting Add-on',
      price: 300,
      description: 'Up to 16 multi-color LED fixtures (only for Package 1 - others include this)'
    },
    {
      id: 'overtime',
      name: 'Additional Hour(s)',
      price: 300,
      description: 'Extend your wedding beyond the included time'
    },
    {
      id: 'dj4hours',
      name: '4 Hours DJ/MC Services (a la carte)',
      price: 1500,
      description: 'Live DJ and speakers for up to 4 hours. No dance floor lighting or uplighting'
    },
    {
      id: 'dj3hours',
      name: '3 Hours DJ/MC Services',
      price: 1300,
      description: 'Live DJ and speakers for up to 3 hours at reception. No lighting'
    },
    {
      id: 'dancelighting',
      name: 'Dance Floor Lighting (a la carte)',
      price: 350,
      description: 'Multi-color LED fixtures for dance floor (included in all packages)'
    },
    {
      id: 'clouds',
      name: 'Dancing on the Clouds',
      price: 500,
      description: 'Sophisticated dry ice system for enchanting first dance photos',
      popular: true
    },
    {
      id: 'coldspark',
      name: 'Cold Spark Fountain Effect',
      price: 600,
      description: 'Stunning spark effect for entrances, dances, or send-offs. Safe for indoors'
    }
  ];

  const calculateTotal = () => {
    const packagePrice = selectedPackage ? packages.find(p => p.id === selectedPackage)?.price || 0 : 0;
    const addonsPrice = selectedAddons.reduce((total, addonId) => {
      const addon = addons.find(a => a.id === addonId);
      return total + (addon?.price || 0);
    }, 0);
    return packagePrice + addonsPrice;
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleContinue = async () => {
    if (!selectedPackage) {
      alert('Please select a package to continue');
      return;
    }

    setSaving(true);
    
    try {
      const selectedPkg = packages.find(p => p.id === selectedPackage);
      const selectedAddonDetails = selectedAddons.map(addonId => 
        addons.find(a => a.id === addonId)
      ).filter(Boolean);

      const selections = {
        leadId: id,
        packageId: selectedPackage,
        packageName: selectedPkg?.name,
        packagePrice: selectedPkg?.price,
        addons: selectedAddonDetails.map(a => ({
          id: a.id,
          name: a.name,
          price: a.price
        })),
        totalPrice: calculateTotal()
      };
      
      // Save selections to database
      const response = await fetch('/api/quote/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selections)
      });

      if (!response.ok) {
        throw new Error('Failed to save selections');
      }

      // Show success message and redirect to confirmation
      alert('Your selections have been saved! Our team will contact you soon with the next steps.');
      
      // Redirect back to homepage or contact page
      router.push('/');
    } catch (error) {
      console.error('Error saving selections:', error);
      alert('There was an error saving your selections. Please try again or contact us directly at (901) 410-2020.');
    } finally {
      setSaving(false);
    }
  };

  // Better first name extraction
  const extractFirstName = (fullName) => {
    if (!fullName) return 'there';
    
    // Remove common titles
    const cleanName = fullName.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Miss)\s+/i, '').trim();
    
    // Get first word (first name)
    const firstName = cleanName.split(/\s+/)[0];
    
    // Capitalize first letter
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Your Quote | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading your personalized quote...</p>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  if (error || !leadData) {
    return (
      <>
        <Head>
          <title>Quote Not Found | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4">
            <div className="max-w-md text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-3xl font-bold mb-4">Quote Not Found</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {error || "We couldn't find the quote you're looking for. It may have been moved or deleted."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/#contact" className="btn-primary inline-flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Get a New Quote
                </Link>
                <Link href="/" className="btn-outline inline-flex items-center gap-2">
                  Go to Homepage
                </Link>
              </div>
              <p className="mt-8 text-sm text-gray-500">
                Need help? Call us at <a href="tel:+19014102020" className="text-brand hover:underline">(901) 410-2020</a>
              </p>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  const firstName = extractFirstName(leadData?.name);

  return (
    <>
      <Head>
        <title>Your Personal Wedding Package | M10 DJ Company</title>
        <meta name="description" content="Build your perfect wedding entertainment package" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

        <main className="section-container py-12 md:py-20">
          {/* Personalized Header */}
          <div className="text-center mb-12 md:mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full mb-4">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-semibold">Created Just For You</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Welcome, {firstName}! 💍
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Based on your {leadData?.eventType || 'wedding'} details, we&apos;ve prepared these personalized packages for you.
            </p>
            
            {leadData?.eventDate && (
              <div className="flex items-center justify-center gap-6 mt-6 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{leadData.eventDate}</span>
                </div>
                {leadData?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{leadData.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Package Selection */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              Choose Your Perfect Package
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-300 ${
                    selectedPackage === pkg.id
                      ? 'ring-4 ring-brand shadow-2xl scale-105'
                      : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-2 hover:ring-brand/50 shadow-lg'
                  } ${
                    pkg.popular ? 'bg-gradient-to-br from-brand/5 to-white dark:from-brand/10 dark:to-gray-800' : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  {/* Selected Indicator */}
                  {selectedPackage === pkg.id && (
                    <div className="absolute top-4 left-4 bg-brand text-white rounded-full p-2 shadow-lg animate-bounce">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  )}
                  
                  {/* Popular Badge */}
                  {pkg.popular && (
                    <div className={`absolute top-4 ${selectedPackage === pkg.id ? 'right-4' : 'right-4'} bg-brand text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}>
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{pkg.description}</p>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-brand">${pkg.price.toLocaleString()}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons Selection */}
          {selectedPackage && (
            <div className="mb-16 animate-fade-in">
              <h2 className="text-3xl font-bold text-center mb-8">
                <Sparkles className="inline w-8 h-8 text-brand mr-2" />
                Enhance Your Experience
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addons.map((addon) => (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`cursor-pointer rounded-xl p-4 transition-all duration-300 ${
                      selectedAddons.includes(addon.id)
                        ? 'ring-2 ring-brand bg-brand/5 dark:bg-brand/10'
                        : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-brand/50 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold">{addon.name}</h3>
                      <span className="text-brand font-bold">${addon.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{addon.description}</p>
                    {selectedAddons.includes(addon.id) && (
                      <div className="mt-2 text-brand text-sm font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Added
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total & Continue */}
          {selectedPackage && (
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl shadow-2xl animate-fade-in">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Total Investment</p>
                  <p className="text-3xl font-bold text-brand">${calculateTotal().toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedAddons.length > 0 
                      ? `Package + ${selectedAddons.length} add-on${selectedAddons.length > 1 ? 's' : ''}`
                      : 'Package only'}
                  </p>
                </div>
                <button
                  onClick={handleContinue}
                  disabled={saving}
                  className={`btn-primary text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center gap-2 ${
                    saving ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue to Next Step →
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}

