/**
 * Example: AI-Friendly Package Page Implementation
 * 
 * This example shows how to integrate AI-optimized package descriptions
 * into your existing pages for better ChatGPT shopping and conversational search visibility.
 * 
 * Key improvements:
 * 1. Uses conversational descriptions instead of feature lists
 * 2. Includes Product schema markup for AI understanding
 * 3. Displays vibes, genres, and event types for better matching
 * 4. Optimized for natural language queries
 */

import React from 'react';
import Head from 'next/head';
import { Lock } from 'lucide-react';
import { weddingPackages, generateProductSchema, AIPackageDescription } from '../utils/aiFriendlyPackages';

// Example: Enhanced Wedding Packages Page
export default function AIFriendlyWeddingPackagesPage() {
  // Use AI-optimized packages instead of static arrays
  const packages = weddingPackages;
  
  // Generate Product schema for each package
  const productSchemas = packages.map(pkg => generateProductSchema(pkg));
  
  // Combine all schemas into a @graph structure
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": productSchemas
  };

  return (
    <>
      <Head>
        <title>Memphis Wedding DJ Packages | AI-Optimized Descriptions</title>
        <meta 
          name="description" 
          content={packages[1].conversationalDescription.substring(0, 160)}
        />
        
        {/* Product Schema Markup for AI Shopping */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </Head>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Memphis Wedding DJ Packages
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find the perfect wedding DJ package for your Memphis celebration. 
            Each package is designed for specific wedding styles, guest counts, and vibes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <PackageCard key={index} package={pkg} />
          ))}
        </div>
      </div>
    </>
  );
}

// Enhanced Package Card Component
function PackageCard({ package: pkg }: { package: AIPackageDescription }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200 hover:border-brand transition-colors">
      {/* Package Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h2>
        <div className="flex items-baseline gap-2 mb-3">
          {/* Show vague displayPrice to humans, not exact price */}
          <span className="text-3xl font-bold text-brand">
            {pkg.displayPrice || `Starting at ${pkg.price}`}
          </span>
          <span className="text-gray-500">for {pkg.duration}</span>
        </div>
        {/* Trust signal - exact pricing requires contact */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Lock className="w-4 h-4" />
          <span>Exact pricing customized to your event</span>
        </div>
      </div>

      {/* Conversational Description - This is what AI reads */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed mb-4">
          {pkg.conversationalDescription}
        </p>
        
        {/* Short Description for Quick Scanning */}
        <p className="text-sm text-gray-600 italic border-l-4 border-brand pl-4">
          {pkg.shortDescription}
        </p>
      </div>

      {/* AI-Matching Attributes */}
      <div className="mb-6 space-y-4">
        {/* Vibes */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
            Perfect Vibes
          </h3>
          <div className="flex flex-wrap gap-2">
            {pkg.vibes.map((vibe, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {vibe}
              </span>
            ))}
          </div>
        </div>

        {/* Genres */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
            Music Styles
          </h3>
          <div className="flex flex-wrap gap-2">
            {pkg.genres.map((genre, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Event Types */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
            Ideal For
          </h3>
          <div className="flex flex-wrap gap-2">
            {pkg.eventTypes.map((type, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Guest Count & Atmosphere */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Guest Count:</span>
            <span className="text-sm font-semibold text-gray-900">{pkg.guestCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Atmosphere:</span>
            <span className="text-sm font-semibold text-gray-900">{pkg.atmosphere}</span>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          What&apos;s Included
        </h3>
        <ul className="space-y-2">
          {pkg.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-700">
              <span className="text-brand mt-1">✓</span>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <button className="w-full bg-brand text-white py-3 px-6 rounded-lg font-semibold hover:bg-brand-600 transition-colors">
        Book This Package
      </button>
    </div>
  );
}

// Example: Using the matching function for search
export function PackageSearchExample() {
  const [query, setQuery] = React.useState('');
  const [matches, setMatches] = React.useState<AIPackageDescription[]>([]);

  React.useEffect(() => {
    if (query.length > 3) {
      const { findMatchingPackages } = require('../utils/aiFriendlyPackages');
      const results = findMatchingPackages(query);
      setMatches(results);
    }
  }, [query]);

  return (
    <div className="p-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try: DJ for high-energy 30th birthday party with 90s hip-hop"
        className="w-full p-4 border border-gray-300 rounded-lg mb-4"
      />
      
      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Matching Packages:</h3>
          {matches.map((pkg, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold">{pkg.name}</h4>
              <p className="text-sm text-gray-600">{pkg.shortDescription}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * KEY TAKEAWAYS:
 * 
 * 1. Conversational Descriptions: Use natural language that matches how people actually search
 * 2. Product Schema: Include structured data so AI can understand pricing and availability
 * 3. Attribute Display: Show vibes, genres, and event types to help both users and AI match packages
 * 4. Meta Descriptions: Use conversational descriptions in meta tags for better AI understanding
 * 5. Search Matching: Use the findMatchingPackages function to match user queries to packages
 * 
 * This approach shifts from "service provider" language to "resource-driven" descriptions
 * that AI can easily match to specific user needs.
 */

