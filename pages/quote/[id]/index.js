import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import { CheckCircle, Sparkles, Music, Calendar, MapPin, Users, Heart, Star, ArrowLeft, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function PersonalizedQuote() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState(null);

  const fetchLeadData = useCallback(async () => {
    // Validate ID before making request
    if (!id || id === 'null' || id === 'undefined' || id.trim() === '') {
      console.error('Invalid quote ID:', id);
      // Try to get form data from sessionStorage as fallback
      const savedFormData = sessionStorage.getItem('quote_form_data');
      if (savedFormData) {
        try {
          const formData = JSON.parse(savedFormData);
          console.log('✅ Using saved form data as fallback');
          setLeadData({
            id: 'fallback',
            name: formData.name || 'Valued Customer',
            email: formData.email,
            phone: formData.phone,
            eventType: formData.eventType,
            eventDate: formData.eventDate,
            location: formData.location
          });
          setError(null);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
      setError('Invalid quote link. Please contact us to get your personalized quote.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/leads/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setLeadData(data);
          setError(null);
        } else {
          console.error('Invalid data returned from API:', data);
          // Try fallback with saved form data
          const savedFormData = sessionStorage.getItem('quote_form_data');
          if (savedFormData) {
            try {
              const formData = JSON.parse(savedFormData);
              console.log('✅ Using saved form data as fallback');
              setLeadData({
                id: 'fallback',
                name: formData.name || 'Valued Customer',
                email: formData.email,
                phone: formData.phone,
                eventType: formData.eventType,
                eventDate: formData.eventDate,
                location: formData.location
              });
              setError(null);
              setLoading(false);
              return;
            } catch (e) {
              console.error('Failed to parse saved form data:', e);
            }
          }
          setError('Quote data is invalid. Please contact us for assistance.');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error:', response.status, errorData);
        
        // Try fallback with saved form data
        const savedFormData = sessionStorage.getItem('quote_form_data');
        if (savedFormData) {
          try {
            const formData = JSON.parse(savedFormData);
            console.log('✅ Using saved form data as fallback after API error');
            setLeadData({
              id: 'fallback',
              name: formData.name || 'Valued Customer',
              email: formData.email,
              phone: formData.phone,
              eventType: formData.eventType,
              eventDate: formData.eventDate,
              location: formData.location
            });
            setError(null);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Failed to parse saved form data:', e);
          }
        }
        
        setError(errorData.error || 'Quote not found. Please contact us to get your personalized quote.');
      }
    } catch (error) {
      console.error('Error fetching lead data:', error);
      
      // Try fallback with saved form data
      const savedFormData = sessionStorage.getItem('quote_form_data');
      if (savedFormData) {
        try {
          const formData = JSON.parse(savedFormData);
          console.log('✅ Using saved form data as fallback after network error');
          setLeadData({
            id: 'fallback',
            name: formData.name || 'Valued Customer',
            email: formData.email,
            phone: formData.phone,
            eventType: formData.eventType,
            eventDate: formData.eventDate,
            location: formData.location
          });
          setError(null);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
      
      setError('Failed to load quote. Please check your connection and try again, or contact us directly.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id, fetchLeadData]);

  // Auto-scroll to add-ons section when a package is selected
  useEffect(() => {
    if (selectedPackage) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const addonsSection = document.getElementById('addons-section');
        if (addonsSection) {
          addonsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  }, [selectedPackage]);

  const packages = [
    {
      id: 'test-package',
      name: 'Test Package',
      price: 1,
      aLaCartePrice: 1,
      description: 'Test Package - $1 Only',
      features: [
        'Test package for payment testing',
        'This is a temporary package for testing purposes'
      ],
      popular: false
    },
    {
      id: 'package1',
      name: 'Package 1',
      price: 2000,
      aLaCartePrice: 2400,
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
      aLaCartePrice: 3000,
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
      aLaCartePrice: 3500,
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
      id: 'extra-hours',
      name: 'Extra Hours',
      description: 'Additional DJ/MC services beyond the 4-hour package',
      price: 300,
      per: 'hour'
    },
    {
      id: 'photo-booth',
      name: 'Photo Booth',
      description: 'Professional photo booth with props and instant prints',
      price: 800
    },
    {
      id: 'karaoke',
      name: 'Karaoke Setup',
      description: 'Full karaoke system with microphones and song library',
      price: 400
    },
    {
      id: 'smoke-machine',
      name: 'Smoke Machine',
      description: 'Atmospheric smoke effects for special moments',
      price: 200
    }
  ];

  const getPackageBreakdown = (packageId) => {
    const breakdowns = {
      'test-package': [
        { item: 'Test Package', price: 1 }
      ],
      'package1': [
        { item: '4 Hours DJ/MC Services', price: 1500 },
        { item: 'Dance Floor Lighting', price: 350 },
        { item: 'Uplighting (16 fixtures)', price: 300 },
        { item: 'Additional Speaker', price: 250 }
      ],
      'package2': [
        { item: '4 Hours DJ/MC Services', price: 1500 },
        { item: 'Dance Floor Lighting', price: 350 },
        { item: 'Uplighting (16 fixtures)', price: 300 },
        { item: 'Ceremony Audio', price: 500 },
        { item: 'Monogram Projection', price: 350 }
      ],
      'package3': [
        { item: '4 Hours DJ/MC Services', price: 1500 },
        { item: 'Dance Floor Lighting', price: 350 },
        { item: 'Uplighting (16 fixtures)', price: 300 },
        { item: 'Ceremony Audio', price: 500 },
        { item: 'Monogram Projection', price: 350 },
        { item: 'Dancing on the Clouds', price: 500 }
      ]
    };
    return breakdowns[packageId] || [];
  };

  const calculateTotal = () => {
    let total = 0;
    if (selectedPackage && selectedPackage.price != null) {
      total += Number(selectedPackage.price) || 0;
    }
    selectedAddons.forEach(addon => {
      if (addon && addon.price != null) {
        total += Number(addon.price) || 0;
      }
    });
    return total;
  };

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleSaveQuote = async () => {
    if (!selectedPackage) {
      alert('Please select a package first');
      return;
    }

    setSaving(true);
    try {
      // If using fallback data (id === 'fallback'), we can't save to database
      // But we can still show success and store locally
      if (id === 'fallback' || !id || id === 'null' || id === 'undefined') {
        // Store selections in localStorage as backup
        const quoteData = {
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
          total: calculateTotal(),
          leadData: leadData,
          timestamp: new Date().toISOString()
        };
        
        try {
          localStorage.setItem('pending_quote', JSON.stringify(quoteData));
          console.log('✅ Saved quote selections to localStorage');
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
        
        // Show success message and redirect to contact page
        alert('Your selections have been saved! We\'ll contact you within 24 hours to finalize your quote. Thank you!');
        router.push('/#contact');
        return;
      }

      // Ensure we have valid price values
      const packagePrice = selectedPackage?.price ?? 0;
      const totalPrice = calculateTotal();
      
      console.log('💾 Saving quote:', {
        leadId: id,
        packageId: selectedPackage?.id,
        packageName: selectedPackage?.name,
        packagePrice: packagePrice,
        totalPrice: totalPrice,
        selectedPackage: selectedPackage
      });

      const response = await fetch('/api/quote/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: id,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          packagePrice: packagePrice,
          addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
          totalPrice: totalPrice
        })
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/quote/${id}/confirmation`);
      } else {
        // If save fails, still store locally as backup
        const quoteData = {
          leadId: id,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
          total: calculateTotal(),
          leadData: leadData,
          timestamp: new Date().toISOString()
        };
        
        try {
          localStorage.setItem('pending_quote', JSON.stringify(quoteData));
          console.log('✅ Saved quote selections to localStorage as backup');
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
        
        throw new Error('Failed to save quote');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      // Even if save fails, we've stored locally, so show a helpful message
      alert('Your selections have been saved locally. We\'ll contact you within 24 hours to finalize your quote. Thank you!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Your Quote | M10 DJ Company</title>
        </Head>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-brand mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your personalized quote...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !leadData) {
    return (
      <>
        <Head>
          <title>Quote Not Found | M10 DJ Company</title>
        </Head>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quote Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Quote not found'}</p>
            <div className="flex gap-4 justify-center">
              <Link href="/#contact" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Get a New Quote
              </Link>
              <Link href="/" className="btn-secondary">
                Go to Homepage
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
              Need help? Call us at <a href="tel:+19014102020" className="text-brand hover:underline">(901) 410-2020</a>
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Your Personalized Quote | M10 DJ Company</title>
        <meta name="description" content={`Personalized wedding DJ quote for ${leadData.name}`} />
      </Head>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-brand hover:text-brand-dark mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Your Personalized Quote
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{leadData.name}</span>
              </div>
              {leadData.eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(leadData.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              {leadData.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{leadData.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Savings Explanation */}
          <div className="bg-gradient-to-r from-brand/10 to-brand/5 dark:from-brand/20 dark:to-brand/10 rounded-xl p-6 mb-8 border border-brand/20">
            <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our packages bundle services at a discounted rate. Compare the package price to a la carte pricing and see your savings! 🎉
            </p>
          </div>

          {/* Packages Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-4">
              <Music className="inline w-8 h-8 text-brand mr-2" />
              Choose Your Package
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl p-6 border-2 cursor-pointer transition-all hover:shadow-xl ${
                    selectedPackage?.id === pkg.id
                      ? 'border-brand shadow-lg scale-105'
                      : 'border-gray-200 dark:border-gray-700 hover:border-brand/50'
                  } ${pkg.popular ? 'ring-2 ring-brand/30' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-brand text-black px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{pkg.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-4xl font-bold text-brand">${pkg.price.toLocaleString()}</span>
                      <span className="text-lg text-gray-400 dark:text-gray-500 line-through">${pkg.aLaCartePrice.toLocaleString()}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Save ${(pkg.aLaCartePrice - pkg.price).toLocaleString()}
                    </div>
                    
                    {/* A La Carte Breakdown Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedBreakdown(expandedBreakdown === pkg.id ? null : pkg.id);
                      }}
                      className="mt-3 text-sm text-brand hover:text-brand-dark flex items-center gap-1 transition-colors"
                    >
                      {expandedBreakdown === pkg.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide breakdown
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          See a la carte breakdown
                        </>
                      )}
                    </button>
                    
                    {/* A La Carte Price Breakdown */}
                    {expandedBreakdown === pkg.id && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">If purchased separately:</p>
                        <ul className="space-y-1 mb-2">
                          {getPackageBreakdown(pkg.id).map((item, idx) => (
                            <li key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">{item.item}</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">${item.price}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-gray-300 dark:border-gray-600 flex justify-between text-sm font-bold">
                          <span>A La Carte Total:</span>
                          <span className="text-gray-500 dark:text-gray-400 line-through">${pkg.aLaCartePrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-brand mt-1">
                          <span>Package Price:</span>
                          <span>${pkg.price.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-4">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {selectedPackage?.id === pkg.id && (
                    <div className="mt-4 p-3 bg-brand/10 dark:bg-brand/20 rounded-lg text-center">
                      <CheckCircle className="w-6 h-6 text-brand mx-auto mb-2" />
                      <span className="text-sm font-semibold text-brand">Selected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Add-ons Section */}
          <section id="addons-section" className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-4">
              <Sparkles className="inline w-8 h-8 text-brand mr-2" />
              Enhance Your Experience
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Add extra services to your package. These are optional upgrades that can be added to personalize your celebration even more! 
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {addons.map((addon) => {
                const isSelected = selectedAddons.find(a => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand bg-brand/5 dark:bg-brand/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{addon.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{addon.description}</p>
                        <div className="text-lg font-bold text-brand">
                          ${addon.price.toLocaleString()}
                          {addon.per && <span className="text-sm font-normal text-gray-500"> / {addon.per}</span>}
                        </div>
                      </div>
                      <div className={`ml-4 w-6 h-6 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-brand border-brand'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Total and CTA */}
          <section className="bg-gradient-to-r from-brand/10 to-brand/5 dark:from-brand/20 dark:to-brand/10 rounded-xl p-8 border border-brand/20">
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">Total:</span>
                <span className="text-4xl font-bold text-brand">${calculateTotal().toLocaleString()}</span>
              </div>
              
              {!selectedPackage && (
                <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                  Please select a package to see your total
                </p>
              )}

              <button
                onClick={handleSaveQuote}
                disabled={!selectedPackage || saving}
                className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5" />
                    Save My Selections
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-4">
                Ben will review your selections and prepare a detailed proposal within 24 hours
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

