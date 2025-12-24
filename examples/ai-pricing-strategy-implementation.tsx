/**
 * AI-Shopable But Lead-Focused Pricing Implementation
 * 
 * This example shows how to:
 * 1. Hide exact pricing from humans (show vague ranges)
 * 2. Include exact pricing in structured data for AI
 * 3. Require contact for exact quotes (lead capture)
 * 4. Still be discoverable by ChatGPT and AI shopping features
 */

import React from 'react';
import Head from 'next/head';
import { Lock, Phone, Mail } from 'lucide-react';
import { weddingPackages, generateProductSchema, AIPackageDescription } from '../utils/aiFriendlyPackages';

export default function AIPricingStrategyPage() {
  const packages = weddingPackages;
  
  // Generate Product schema with EXACT pricing for AI (hidden from humans)
  const productSchemas = packages.map(pkg => generateProductSchema(pkg));
  
  // Combine all schemas into a @graph structure
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": productSchemas
  };

  return (
    <>
      <Head>
        <title>Memphis Wedding DJ Packages | Custom Pricing Available</title>
        <meta 
          name="description" 
          content="Professional Memphis wedding DJ packages with custom pricing. Get your personalized quote based on your event details, date, and specific needs."
        />
        
        {/* Product Schema with EXACT pricing - AI can read this, humans don't see it */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </Head>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section - Value-focused, not price-focused */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Memphis Wedding DJ Packages
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Professional wedding DJ services with transparent, custom pricing based on your event details.
            All packages include professional equipment, setup, and experienced DJ services.
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            <Lock className="w-4 h-4 inline mr-1" />
            Exact pricing customized to your event date, location, and specific needs. No hidden fees.
          </p>
        </div>

        {/* Packages - Show vague pricing to humans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {packages.map((pkg, index) => (
            <PackageCard key={index} package={pkg} />
          ))}
        </div>

        {/* Trust Signals */}
        <div className="bg-gray-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Why Custom Pricing?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="font-semibold mb-2">No Hidden Fees</h3>
              <p className="text-sm text-gray-600">
                All pricing is transparent and explained before you commit
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Based on Your Needs</h3>
              <p className="text-sm text-gray-600">
                Pricing varies by date, location, guest count, and specific requirements
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Flexible Payment</h3>
              <p className="text-sm text-gray-600">
                Payment plans available. We work with your budget and timeline
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-brand text-white rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Your Custom Quote?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Get accurate pricing for your specific Memphis event with our free, no-obligation consultation.
            We'll help you understand all options and find the perfect entertainment solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-brand px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Your Custom Quote
            </button>
            <a 
              href="tel:+19014102020" 
              className="bg-white/10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              (901) 410-2020
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// Package Card - Shows vague pricing, requires contact for exact
function PackageCard({ package: pkg }: { package: AIPackageDescription }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200 hover:border-brand transition-colors">
      {/* Package Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h2>
        
        {/* VAGUE PRICING - What humans see */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand">
              {pkg.displayPrice || `Starting at ${pkg.price}`}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">for {pkg.duration}</p>
        </div>
        
        {/* Trust Signal */}
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <Lock className="w-3 h-3" />
          <span>Exact pricing after inquiry</span>
        </div>
      </div>

      {/* Conversational Description - Value-focused */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed text-sm mb-4">
          {pkg.conversationalDescription}
        </p>
      </div>

      {/* Features - Focus on value, not price */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          What&apos;s Included
        </h3>
        <ul className="space-y-2">
          {pkg.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
              <span className="text-brand mt-1">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA - Require contact */}
      <button className="w-full bg-brand text-white py-3 px-6 rounded-lg font-semibold hover:bg-brand-600 transition-colors">
        Get Your Custom Quote
      </button>
      
      {/* Alternative contact methods */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 mb-2">Or contact us directly:</p>
        <div className="flex gap-4 justify-center text-xs">
          <a href="tel:+19014102020" className="text-brand hover:underline flex items-center gap-1">
            <Phone className="w-3 h-3" />
            Call
          </a>
          <a href="mailto:info@m10djcompany.com" className="text-brand hover:underline flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Email
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * KEY IMPLEMENTATION NOTES:
 * 
 * 1. VISIBLE PRICING (Humans):
 *    - Use displayPrice: "Starting at $1,600" (vague)
 *    - Show "Exact pricing after inquiry" message
 *    - Focus on value, not price
 * 
 * 2. STRUCTURED DATA (AI):
 *    - Include exact price: "$2000" in Product schema
 *    - Include priceRange: "$2,000-$2,600"
 *    - AI can read this, humans don't see it
 * 
 * 3. LEAD CAPTURE:
 *    - "Get Your Custom Quote" buttons everywhere
 *    - Multiple contact methods (form, phone, email)
 *    - Trust signals ("No hidden fees", "Transparent pricing")
 * 
 * 4. CONVERSION OPTIMIZATION:
 *    - If bounce rate high: Make ranges more specific
 *    - If lead quality low: Add qualification questions
 *    - Always respond quickly to inquiries
 * 
 * This strategy gives you:
 * ✅ AI discoverability (ChatGPT can find you by price)
 * ✅ Lead capture (humans must contact for exact pricing)
 * ✅ Pricing flexibility (adjust quotes per event)
 * ✅ Competitive advantage (competitors can't easily price-match)
 */

