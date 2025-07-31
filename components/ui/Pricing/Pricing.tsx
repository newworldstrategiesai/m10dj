'use client';

import Button from '@/components/ui/Button';
import type { Tables } from '@/types_db';
import { User } from '@supabase/supabase-js';

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

export default function Pricing({ user, products, subscription }: Props) {
  const packages = [
    {
      id: 1,
      name: "PACKAGE 1",
      subtitle: "RECEPTION ONLY",
      price: "$1,245",
      includes: [
        "4 hours of DJ and MC services",
        "Dance floor lighting and speaker"
      ],
      addOn: "Add the Ceremony Audio Package for $295"
    },
    {
      id: 2, 
      name: "PACKAGE 2",
      subtitle: "RECEPTION ONLY", 
      price: "$1,395",
      includes: [
        "4 hours of DJ and MC services",
        "Dance floor lighting and speaker",
        "Plus one of the following:"
      ],
      options: [
        "Uplighting (16 lights)",
        "Additional hour of time"
      ],
      addOn: "Add the Ceremony Audio Package for $295"
    },
    {
      id: 3,
      name: "PACKAGE 3", 
      subtitle: "RECEPTION ONLY",
      price: "$1,500",
      includes: [
        "4 hours of DJ and MC services", 
        "Dance floor lighting and speaker",
        "Plus two of the following:"
      ],
      options: [
        "Ceremony audio package (+1 hour)",
        "Additional hour of time", 
        "Additional speaker"
      ],
      addOn: "Add the Ceremony Audio Package for $295"
    }
  ];

  const ceremonyAudio = {
    name: "CEREMONY AUDIO",
    subtitle: "A LA CARTE",
    price: "$395",
    features: [
      "Smaller, less obstructive system",
      "Prelude music starts up to 15 mins before time", 
      "Music & microphones included",
      "Lapel mic for officiant + handheld mics as needed",
      "Microphones & speaker only (no music) - $245"
    ]
  };

  const additionalServices = [
    { service: "4 hours of DJ and MC services", price: "$1,145" },
    { service: "3 hours of DJ/MC services", price: "$945" },
    { service: "Additional speaker", price: "$150" },
    { service: "Dance floor lighting", price: "$250" },
    { service: "Uplighting (16 lights)", price: "$300" },
    { service: "Photo booth rental", price: "$450" },
    { service: "Monogram projection", price: "$300" },
    { service: "65\" flat screen tv with stand", price: "$400" },
    { service: "Travel outside of Greater Memphis area", price: "$45 each way" }
  ];

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
        </div>

        {/* Main Packages */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">{pkg.name}</h2>
                <p className="text-zinc-400 text-sm uppercase tracking-wide">{pkg.subtitle}</p>
                <p className="text-4xl font-extrabold text-[#fcba00] mt-4">{pkg.price}</p>
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
                className="w-full mt-6 bg-[#fcba00] hover:bg-[#e6a800] text-black font-semibold"
              >
                Get Quote
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
              <p className="text-4xl font-extrabold text-[#fcba00] mt-4">{ceremonyAudio.price}</p>
            </div>
            
            <div className="space-y-3 text-zinc-300">
              {ceremonyAudio.features.map((feature, index) => (
                <p key={index} className={feature.includes("$245") ? "text-blue-300" : ""}>
                  {feature}
                </p>
              ))}
            </div>
            
            <Button
              variant="slim"
              className="w-full mt-6 bg-[#fcba00] hover:bg-[#e6a800] text-black font-semibold"
            >
              Get Quote
            </Button>
          </div>
        </div>

        {/* Additional Services */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            ADDITIONAL SERVICES & A LA CARTE PRICING
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {additionalServices.map((item, index) => (
              <div key={index} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 text-sm">{item.service}</span>
                  <span className="text-[#fcba00] font-semibold">{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Button
            variant="slim"
            className="bg-[#fcba00] hover:bg-[#e6a800] text-black font-semibold px-8 py-3 text-lg"
          >
            Contact Us for Custom Quote
          </Button>
        </div>

      </div>
    </section>
  );
}