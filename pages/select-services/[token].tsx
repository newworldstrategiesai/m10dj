import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  CheckCircle, 
  Sparkles, 
  Heart, 
  Music, 
  Plus,
  Minus,
  Send,
  Loader2
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Package {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  duration: string;
  included: string[];
  popular?: boolean;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

const packages: Package[] = [
  {
    id: 'package-1',
    name: 'Package 1',
    description: 'Reception Only',
    basePrice: 2000,
    duration: '4 hours',
    included: [
      'DJ / MC Services at Reception (up to 4 hours)',
      'Premium speakers & microphones',
      'Dance Floor Lighting - Multi-color LED fixtures',
      'Uplighting - Up to 16 multicolor LED fixtures',
      'Additional Speaker for cocktail hour'
    ]
  },
  {
    id: 'package-2',
    name: 'Package 2',
    description: 'Ceremony & Reception',
    basePrice: 2500,
    duration: '5 hours',
    included: [
      'DJ / MC Services at Reception (up to 4 hours)',
      'Premium speakers & microphones',
      'Dance Floor Lighting - Multi-color LED fixtures',
      'Uplighting - Up to 16 multicolor LED fixtures',
      'Ceremony Audio (additional hour + music programming)',
      'Monogram Projection - Custom graphic with your names/initials'
    ],
    popular: true
  },
  {
    id: 'package-3',
    name: 'Package 3',
    description: 'Premium Ceremony & Reception',
    basePrice: 3000,
    duration: '5 hours',
    included: [
      'DJ / MC Services at Reception (up to 4 hours)',
      'Premium speakers & microphones',
      'Dance Floor Lighting - Multi-color LED fixtures',
      'Uplighting - Up to 16 multicolor LED fixtures',
      'Ceremony Audio (additional hour + music programming)',
      'Monogram Projection - Custom graphic',
      'Dancing on the Clouds - Dry ice first dance effect'
    ]
  }
];

const addOns: AddOn[] = [
  {
    id: 'ceremony-audio',
    name: 'Ceremony Audio (a la carte)',
    description: 'Speakers, microphones, and music for ceremony only. Great if you already have reception entertainment.',
    price: 500,
    category: 'ceremony'
  },
  {
    id: 'additional-speaker',
    name: 'Additional Speaker',
    description: 'Powered speaker with mixer for separate areas like cocktail hour.',
    price: 250,
    category: 'equipment'
  },
  {
    id: 'monogram-projection',
    name: 'Monogram Projection',
    description: 'Custom graphic with your names or initials projected on floor or wall.',
    price: 350,
    category: 'visual'
  },
  {
    id: 'uplighting-addon',
    name: 'Uplighting Add-on',
    description: 'Up to 16 multi-color LED fixtures (only if purchasing Package 1, others include this).',
    price: 300,
    category: 'lighting'
  },
  {
    id: 'additional-hour',
    name: 'Additional Hour(s)',
    description: 'Extend your event beyond the package hours.',
    price: 150,
    category: 'time'
  },
  {
    id: 'dj-4hr-alacarte',
    name: '4 Hours DJ/MC Services (a la carte)',
    description: 'Live DJ and speakers for 4 hours. No lighting or uplighting.',
    price: 1500,
    category: 'alacarte'
  },
  {
    id: 'dj-3hr-alacarte',
    name: '3 Hours DJ/MC Services (a la carte)',
    description: 'Live DJ and speakers for 3 hours. No lighting or uplighting.',
    price: 1300,
    category: 'alacarte'
  },
  {
    id: 'dance-lighting-alacarte',
    name: 'Dance Floor Lighting (a la carte)',
    description: 'Multi-color LED fixtures. Only if not purchasing a package.',
    price: 350,
    category: 'alacarte'
  },
  {
    id: 'dancing-clouds',
    name: 'Dancing on the Clouds',
    description: 'Sophisticated dry ice system creating floor-hugging clouds for your first dance.',
    price: 500,
    category: 'effects'
  },
  {
    id: 'cold-spark',
    name: 'Cold Spark Fountain Effect',
    description: 'Indoor-safe spark effects for entrances, dances, or send-offs.',
    price: 600,
    category: 'effects'
  }
];

export default function ServiceSelection() {
  const router = useRouter();
  const { token } = router.query;
  const supabase = createClientComponentClient();
  
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<{[key: string]: number}>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (token) {
      loadContactByToken(token as string);
    }
  }, [token]);

  const loadContactByToken = async (tokenValue: string) => {
    try {
      // In production, you'd verify the token against a database
      // For now, we'll decode it (you should encrypt/sign tokens in production)
      const contactId = atob(tokenValue);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();
      
      if (error) throw error;
      
      setContact(data);
    } catch (error) {
      console.error('Error loading contact:', error);
      // Redirect to home if invalid token
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Add selected package
    if (selectedPackage) {
      const pkg = packages.find(p => p.id === selectedPackage);
      if (pkg) total += pkg.basePrice;
    }
    
    // Add selected add-ons
    Object.entries(selectedAddOns).forEach(([id, quantity]) => {
      const addOn = addOns.find(a => a.id === id);
      if (addOn) total += addOn.price * quantity;
    });
    
    return total;
  };

  const toggleAddOn = (addOnId: string, increment: boolean) => {
    setSelectedAddOns(prev => {
      const current = prev[addOnId] || 0;
      const newValue = increment ? current + 1 : Math.max(0, current - 1);
      
      if (newValue === 0) {
        const { [addOnId]: removed, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [addOnId]: newValue };
    });
  };

  const handleSubmit = async () => {
    if (!selectedPackage) {
      alert('Please select a package');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const selectedPkg = packages.find(p => p.id === selectedPackage);
      const selectedAddOnsList = Object.entries(selectedAddOns).map(([id, quantity]) => {
        const addOn = addOns.find(a => a.id === id);
        return addOn ? { ...addOn, quantity } : null;
      }).filter(Boolean);
      
      const selectionData = {
        package: selectedPkg,
        addOns: selectedAddOnsList,
        total: calculateTotal(),
        additionalNotes,
        submittedAt: new Date().toISOString()
      };
      
      // Save selection to contact's custom_fields
      const { error } = await supabase
        .from('contacts')
        .update({
          custom_fields: {
            ...contact.custom_fields,
            service_selection: selectionData
          },
          lead_status: 'Proposal Sent',
          notes: `${contact.notes || ''}\n\n--- Service Selection ---\nPackage: ${selectedPkg?.name} ($${selectedPkg?.basePrice})\nAdd-ons: ${selectedAddOnsList.length}\nTotal: $${calculateTotal()}\nNotes: ${additionalNotes}`
        })
        .eq('id', contact.id);
      
      if (error) throw error;
      
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting selection:', error);
      alert('There was an error submitting your selection. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your personalized quote...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Thank You, {contact?.first_name}!
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            We've received your service selections and will prepare your custom proposal.
          </p>
          <div className="bg-purple-50 rounded-xl p-6 mb-8">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Your Investment: ${calculateTotal().toLocaleString()}
            </p>
            <p className="text-gray-600">
              We'll be in touch within 24 hours to finalize the details and answer any questions.
            </p>
          </div>
          <p className="text-gray-600">
            Questions? Call us at <a href="tel:9014102020" className="text-brand font-semibold">(901) 410-2020</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Select Your Wedding DJ Services | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Music className="w-12 h-12 text-brand mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                M10 DJ Company
              </h1>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
              Hi {contact?.first_name}! Select Your Perfect Package
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the package that fits your vision, then customize with add-ons. We'll prepare a detailed proposal based on your selections.
            </p>
          </div>

          {/* Packages */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Choose Your Package</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`relative cursor-pointer rounded-2xl p-6 transition-all ${
                    selectedPackage === pkg.id
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl transform scale-105'
                      : 'bg-white hover:shadow-xl'
                  } ${pkg.popular ? 'border-4 border-brand-gold' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-brand-gold text-black px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                        ⭐ MOST POPULAR ⭐
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <h4 className={`text-2xl font-bold mb-2 ${selectedPackage === pkg.id ? 'text-white' : 'text-gray-900'}`}>
                      {pkg.name}
                    </h4>
                    <p className={`text-sm mb-3 ${selectedPackage === pkg.id ? 'text-white/90' : 'text-gray-600'}`}>
                      {pkg.description}
                    </p>
                    <div className={`text-4xl font-bold ${selectedPackage === pkg.id ? 'text-brand-gold' : 'text-brand'}`}>
                      ${pkg.basePrice.toLocaleString()}
                    </div>
                    <p className={`text-sm ${selectedPackage === pkg.id ? 'text-white/70' : 'text-gray-500'}`}>
                      {pkg.duration}
                    </p>
                  </div>
                  
                  <ul className="space-y-2">
                    {pkg.included.map((item, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <CheckCircle className={`w-4 h-4 mr-2 flex-shrink-0 mt-0.5 ${
                          selectedPackage === pkg.id ? 'text-brand-gold' : 'text-green-500'
                        }`} />
                        <span className={selectedPackage === pkg.id ? 'text-white' : 'text-gray-700'}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {selectedPackage === pkg.id && (
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center text-white font-semibold">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add-Ons */}
          {selectedPackage && (
            <div className="mb-12 animate-fade-in">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Step 2: Add Enhancements (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addOns.map((addOn) => {
                  const quantity = selectedAddOns[addOn.id] || 0;
                  return (
                    <div key={addOn.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{addOn.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{addOn.description}</p>
                          <p className="text-brand font-bold text-lg">${addOn.price}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <button
                          onClick={() => toggleAddOn(addOn.id, false)}
                          disabled={quantity === 0}
                          className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        
                        <span className="text-xl font-bold text-gray-900 min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        
                        <button
                          onClick={() => toggleAddOn(addOn.id, true)}
                          className="w-10 h-10 rounded-full bg-brand hover:bg-brand/90 text-white flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {selectedPackage && (
            <div className="mb-12 animate-fade-in">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Step 3: Any Questions or Special Requests?</h3>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Tell us about any special songs, themes, or questions you have..."
                className="w-full h-32 p-4 border-2 border-gray-300 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all resize-none"
              />
            </div>
          )}

          {/* Summary & Submit */}
          {selectedPackage && (
            <div className="sticky bottom-0 bg-white rounded-2xl shadow-2xl p-6 md:p-8 border-t-4 border-brand animate-fade-in">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Your Total Investment</p>
                  <p className="text-4xl font-bold text-gray-900">
                    ${calculateTotal().toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {Object.keys(selectedAddOns).length > 0 
                      ? `Package + ${Object.values(selectedAddOns).reduce((a, b) => a + b, 0)} add-on${Object.values(selectedAddOns).reduce((a, b) => a + b, 0) > 1 ? 's' : ''}`
                      : 'Package only'}
                  </p>
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6 mr-2" />
                      Submit My Selections
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

