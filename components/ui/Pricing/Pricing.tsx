'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/types_db';
import { User } from '@supabase/supabase-js';
import { scrollToContact } from '@/utils/scroll-helpers';
import { Loader2, Lock } from 'lucide-react';

type Subscription = Tables<'subscriptions'>;
type Product = Tables<'products'>;
type Price = Tables<'prices'>;
interface ProductWithPrices extends Product {
  prices: Price[];
}
interface PriceWithProduct extends Price {
  products: Product | null;
}
interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

interface Props {
  user: User | null | undefined;
  products: ProductWithPrices[];
  subscription: SubscriptionWithProduct | null;
}

interface PackageBreakdown {
  item: string;
  description: string;
  price: number;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface PricingConfig {
  package1_price: number;
  package1_a_la_carte_price: number;
  package2_price: number;
  package2_a_la_carte_price: number;
  package3_price: number;
  package3_a_la_carte_price: number;
  package1_breakdown?: PackageBreakdown[];
  package2_breakdown?: PackageBreakdown[];
  package3_breakdown?: PackageBreakdown[];
  addons?: Addon[];
}

export default function Pricing({ user, products, subscription }: Props) {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/admin/pricing');
      if (response.ok) {
        const data = await response.json();
        setPricingConfig(data);
      } else {
        // Fallback to default pricing if API fails
        setPricingConfig({
          package1_price: 2000,
          package1_a_la_carte_price: 2600,
          package2_price: 2500,
          package2_a_la_carte_price: 3400,
          package3_price: 3000,
          package3_a_la_carte_price: 3900,
          package1_breakdown: [],
          package2_breakdown: [],
          package3_breakdown: [],
          addons: []
        });
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      // Fallback to default pricing
      setPricingConfig({
        package1_price: 2000,
        package1_a_la_carte_price: 2600,
        package2_price: 2500,
        package2_a_la_carte_price: 3400,
        package3_price: 3000,
        package3_a_la_carte_price: 3900,
        package1_breakdown: [],
        package2_breakdown: [],
        package3_breakdown: [],
        addons: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate price ranges based on actual pricing (show range without exact numbers)
  const getPriceRange = (basePrice: number) => {
    // Show a range that's approximately 15-20% below to 10-15% above the base price
    const lowerBound = Math.floor(basePrice * 0.80);
    const upperBound = Math.ceil(basePrice * 1.15);
    
    // Round to nearest 50 for cleaner display
    const roundedLower = Math.floor(lowerBound / 50) * 50;
    const roundedUpper = Math.ceil(upperBound / 50) * 50;
    
    return { min: roundedLower, max: roundedUpper, startingAt: roundedLower };
  };

  // Get package details based on actual pricing config
  const getPackages = () => {
    if (!pricingConfig) {
      return [];
    }

    const pkg1Range = getPriceRange(pricingConfig.package1_price);
    const pkg2Range = getPriceRange(pricingConfig.package2_price);
    const pkg3Range = getPriceRange(pricingConfig.package3_price);

    // Get breakdown items for each package (what's included)
    const getPackageIncludes = (breakdown: PackageBreakdown[] | undefined) => {
      if (!breakdown || breakdown.length === 0) {
        // Default includes if no breakdown
        return [
          "4 hours of DJ and MC services",
          "Dance floor lighting and speaker"
        ];
      }
      // Return the item names from breakdown
      return breakdown.map(item => item.item);
    };

    const getPackageOptions = (pkgNum: 1 | 2 | 3) => {
      // Package 2 and 3 have options based on their structure
      if (pkgNum === 2) {
        return ["Uplighting (16 lights)", "Additional hour of time"];
      }
      if (pkgNum === 3) {
        return ["Ceremony audio package (+1 hour)", "Additional hour of time", "Additional speaker"];
      }
      return undefined;
    };

    return [
      {
        id: 1,
        name: "PACKAGE 1",
        subtitle: "RECEPTION ONLY",
        priceRange: `Starting at $${pkg1Range.startingAt.toLocaleString()}`,
        priceDisplay: `$${pkg1Range.min.toLocaleString()} - $${pkg2Range.min.toLocaleString()}`,
        includes: getPackageIncludes(pricingConfig.package1_breakdown),
        options: undefined,
        addOn: "Add the Ceremony Audio Package"
      },
      {
        id: 2,
        name: "PACKAGE 2",
        subtitle: "RECEPTION ONLY",
        priceRange: `Starting at $${pkg2Range.startingAt.toLocaleString()}`,
        priceDisplay: `$${pkg2Range.min.toLocaleString()} - $${pkg3Range.min.toLocaleString()}`,
        includes: getPackageIncludes(pricingConfig.package2_breakdown),
        options: getPackageOptions(2),
        addOn: "Add the Ceremony Audio Package"
      },
      {
        id: 3,
        name: "PACKAGE 3",
        subtitle: "RECEPTION ONLY",
        priceRange: `Starting at $${pkg3Range.startingAt.toLocaleString()}`,
        priceDisplay: `$${pkg3Range.min.toLocaleString()}+`,
        includes: getPackageIncludes(pricingConfig.package3_breakdown),
        options: getPackageOptions(3),
        addOn: "Add the Ceremony Audio Package"
      }
    ];
  };

  const getCeremonyAudio = () => {
    // Find ceremony audio addon from pricing config
    const ceremonyAddon = pricingConfig?.addons?.find(addon => 
      addon.id === 'ceremony_audio' || 
      addon.name.toLowerCase().includes('ceremony')
    );

    if (ceremonyAddon) {
      const range = getPriceRange(ceremonyAddon.price);
      return {
        name: "CEREMONY AUDIO",
        subtitle: "A LA CARTE",
        priceRange: `Starting at $${range.startingAt.toLocaleString()}`,
        priceDisplay: `$${range.min.toLocaleString()} - $${range.max.toLocaleString()}`,
        features: [
          "Smaller, less obstructive system",
          "Prelude music starts up to 15 mins before time",
          "Music & microphones included",
          "Lapel mic for officiant + handheld mics as needed",
          "Microphones & speaker only (no music) - Contact for pricing"
        ]
      };
    }

    // Fallback if no ceremony addon found
    const range = getPriceRange(500); // Default ceremony audio price
    return {
      name: "CEREMONY AUDIO",
      subtitle: "A LA CARTE",
      priceRange: `Starting at $${range.startingAt.toLocaleString()}`,
      priceDisplay: `$${range.min.toLocaleString()} - $${range.max.toLocaleString()}`,
      features: [
        "Smaller, less obstructive system",
        "Prelude music starts up to 15 mins before time",
        "Music & microphones included",
        "Lapel mic for officiant + handheld mics as needed",
        "Microphones & speaker only (no music) - Contact for pricing"
      ]
    };
  };

  const getAdditionalServices = () => {
    if (!pricingConfig?.addons || pricingConfig.addons.length === 0) {
      // Fallback list if no addons
      return [
        { service: "4 hours of DJ and MC services", requiresInquiry: true },
        { service: "3 hours of DJ/MC services", requiresInquiry: true },
        { service: "Additional speaker", requiresInquiry: true },
        { service: "Dance floor lighting", requiresInquiry: true },
        { service: "Uplighting (16 lights)", requiresInquiry: true },
        { service: "Photo booth rental", requiresInquiry: true },
        { service: "Monogram projection", requiresInquiry: true },
        { service: "65\" flat screen tv with stand", requiresInquiry: true },
        { service: "Travel outside of Greater Memphis area", requiresInquiry: true }
      ];
    }

    // Use actual addons from pricing config
    return pricingConfig.addons.map(addon => ({
      service: addon.name,
      requiresInquiry: true
    }));
  };

  const packages = getPackages();
  const ceremonyAudio = getCeremonyAudio();
  const additionalServices = getAdditionalServices();

  const handleGetQuote = (packageName?: string) => {
    // Open contact modal with package context
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('openContactModal', { 
        detail: { 
          package: packageName,
          source: 'pricing-page'
        } 
      });
      window.dispatchEvent(event);
    }
    scrollToContact();
  };

  if (loading) {
    return (
      <section className="bg-black">
        <div className="max-w-7xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-[#fcba00] animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (!pricingConfig) {
    return (
      <section className="bg-black">
        <div className="max-w-7xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <p>Unable to load pricing information. Please contact us for a quote.</p>
            <Button
              onClick={() => handleGetQuote()}
              className="mt-4 bg-[#fcba00] hover:bg-[#e6a800] text-black font-semibold"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black">
      <div className="max-w-7xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            DJ Service Packages
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
            Professional DJ services for weddings and events in the Greater Memphis area
          </p>
          <p className="max-w-2xl m-auto mt-3 text-sm text-zinc-400 sm:text-center">
            Get a personalized quote based on your event details
          </p>
        </div>

        {/* Main Packages */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">{pkg.name}</h2>
                <p className="text-zinc-400 text-sm uppercase tracking-wide">{pkg.subtitle}</p>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-[#fcba00]">{pkg.priceRange}</p>
                  {'priceDisplay' in pkg && pkg.priceDisplay && (
                    <p className="text-sm text-zinc-400 mt-1">{pkg.priceDisplay}</p>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-zinc-500">
                  <Lock className="w-3 h-3" />
                  <span>Exact pricing after inquiry</span>
                </div>
              </div>
              
              <div className="space-y-3 text-zinc-300">
                {pkg.includes.map((item, index) => (
                  <p key={index} className={index === pkg.includes.length - 1 && pkg.options ? "font-semibold" : ""}>
                    {item}
                  </p>
                ))}
                
                {pkg.options && (
                  <ul className="ml-4 space-y-2">
                    {pkg.options.map((option, index) => (
                      <li key={index} className="text-blue-300">- {option}</li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-zinc-700">
                <p className="text-sm text-zinc-400">{pkg.addOn}</p>
              </div>
              
              <Button
                variant="slim"
                onClick={() => handleGetQuote(pkg.name)}
                className="w-full mt-6 bg-[#fcba00] hover:bg-[#e6a800] text-black font-semibold"
              >
                Get Custom Quote
              </Button>
            </div>
          ))}
        </div>

        {/* Ceremony Audio Section */}
        <div className="mt-16">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">{ceremonyAudio.name}</h2>
              <p className="text-zinc-400 text-sm uppercase tracking-wide">{ceremonyAudio.subtitle}</p>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-[#fcba00]">{ceremonyAudio.priceRange}</p>
                {'priceDisplay' in ceremonyAudio && ceremonyAudio.priceDisplay && (
                  <p className="text-sm text-zinc-400 mt-1">{ceremonyAudio.priceDisplay}</p>
                )}
              </div>
              <div className="mt-2 flex items-center justify-center gap-1 text-xs text-zinc-500">
                <Lock className="w-3 h-3" />
                <span>Exact pricing after inquiry</span>
              </div>
            </div>
            
            <div className="space-y-3 text-zinc-300">
              {ceremonyAudio.features.map((feature, index) => (
                <p key={index} className={feature.includes("Contact for pricing") ? "text-blue-300" : ""}>
                  {feature}
                </p>
              ))}
            </div>
            
            <Button
              variant="slim"
              onClick={() => handleGetQuote('Ceremony Audio')}
              className="w-full mt-6 bg-[#fcba00] hover:bg-[#e6a800] text-black font-semibold"
            >
              Get Custom Quote
            </Button>
          </div>
        </div>

        {/* Additional Services */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            ADDITIONAL SERVICES & A LA CARTE OPTIONS
          </h2>
          <p className="text-center text-zinc-400 mb-8 text-sm">
            Contact us for pricing on additional services and custom packages
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {additionalServices.map((item, index) => (
              <div key={index} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 text-sm flex-1">{item.service}</span>
                  <span className="text-[#fcba00] font-semibold text-sm ml-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Inquire</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-zinc-300 mb-6 max-w-2xl mx-auto">
            All pricing is customized based on your event details, date, location, and specific needs. 
            Get a personalized quote with exact pricing by contacting us.
          </p>
          <Button
            variant="slim"
            onClick={() => handleGetQuote()}
            className="bg-[#fcba00] hover:bg-[#e6a800] text-black font-semibold px-8 py-3 text-lg"
          >
            Get Your Custom Quote
          </Button>
        </div>

      </div>
    </section>
  );
}
