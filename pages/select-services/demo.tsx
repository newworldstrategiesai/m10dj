/**
 * Service Selection Demo Page
 * Test the service selection form without needing a real token
 * URL: /select-services/demo
 */

import React, { useState } from 'react';
import { 
  Music, 
  Clock, 
  Users, 
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Phone
} from 'lucide-react';
import Button from '@/components/ui/Button';
import VenueAutocomplete from '@/components/VenueAutocomplete';

export default function ServiceSelectionDemo() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Demo contact data
  const contact = {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email_address: 'sarah@example.com',
    phone: '(901) 555-1234',
    event_type: 'wedding',
    event_date: '2025-06-15',
    venue_name: 'The Peabody Memphis',
    venue_address: '149 Union Ave, Memphis, TN 38103',
    guest_count: 150
  };

  // Form state
  const [selections, setSelections] = useState({
    eventType: contact.event_type || 'wedding',
    eventDate: contact.event_date || '',
    eventTime: '',
    endTime: '',
    venueName: contact.venue_name || '',
    venueAddress: contact.venue_address || '',
    guestCount: contact.guest_count?.toString() || '',
    package: '',
    services: [] as string[],
    addOns: [] as string[],
    ceremonyMusic: false,
    cocktailHour: false,
    reception: true,
    afterParty: false,
    musicPreferences: '',
    specialRequests: '',
    additionalQuestions: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Demo Submission:', selections);
    setSubmitted(true);
    setSubmitting(false);
  };

  const packages = [
    {
      id: 'package_1',
      name: 'Package 1 - Reception Only',
      price: '$2,000',
      features: [
        'DJ/MC Services (4 hours)',
        'Speakers & microphones',
        'Dance floor lighting',
        'Uplighting (16 LED fixtures)',
        'Additional speaker'
      ]
    },
    {
      id: 'package_2',
      name: 'Package 2 - Reception Only',
      price: '$2,500',
      popular: true,
      features: [
        'DJ/MC Services (4 hours)',
        'Speakers & microphones',
        'Dance floor lighting',
        'Uplighting (16 LED fixtures)',
        'Ceremony audio & music',
        'Monogram projection'
      ]
    },
    {
      id: 'package_3',
      name: 'Package 3 - Ceremony & Reception',
      price: '$3,000',
      features: [
        'DJ/MC Services (4 hours)',
        'Speakers & microphones',
        'Ceremony audio & music',
        'Dance floor lighting',
        'Uplighting (16 LED fixtures)',
        'Dancing on the Clouds effect',
        'Monogram projection'
      ]
    }
  ];

  const addOns = [
    { id: 'additional_hour', name: 'Additional Hour(s)', price: '$300' },
    { id: 'additional_speaker', name: 'Additional Speaker', price: '$250' },
    { id: 'dancing_clouds', name: 'Dancing on the Clouds', price: '$500' },
    { id: 'cold_spark', name: 'Cold Spark Fountain Effect', price: '$600' },
    { id: 'monogram', name: 'Monogram Projection', price: '$350' },
    { id: 'uplighting_addon', name: 'Uplighting Add-on (Package 1 only)', price: '$300' }
  ];

  if (submitted) {
    // Get selected package details
    const selectedPkg = packages.find(p => p.id === selections.package);
    const selectedAddOns = addOns.filter(a => selections.addOns.includes(a.id));
    
    // Calculate pricing
    const packagePrice = selectedPkg ? parseFloat(selectedPkg.price.replace(/[$,]/g, '')) : 0;
    const addOnsTotal = selectedAddOns.reduce((sum, addon) => 
      sum + parseFloat(addon.price.replace(/[$,]/g, '')), 0
    );
    const subtotal = packagePrice + addOnsTotal;
    const invoiceNumber = `INV-${Date.now()}`;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You, {contact.first_name}!</h1>
            <p className="text-xl text-gray-600 mb-2">
              Your service selections have been received 🎉
            </p>
            <p className="text-gray-500">
              We'll review your selections and send you a custom quote within 24 hours
            </p>
          </div>

          {/* Selection Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Your Selections
            </h2>

            {/* Selected Package */}
            {selectedPkg && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedPkg.name}</h3>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{selectedPkg.price}</p>
                  </div>
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <ul className="space-y-2 mt-4">
                  {selectedPkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Selected Add-ons */}
            {selectedAddOns.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Add-ons Selected:</h3>
                <ul className="space-y-3">
                  {selectedAddOns.map(addon => (
                    <li key={addon.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-gray-900">{addon.name}</span>
                      </div>
                      <span className="font-bold text-purple-600">{addon.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Event Details */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 mb-3">Event Details:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span><strong>Event:</strong> {selections.eventType} on {selections.eventDate}</span>
                </div>
                {selections.guestCount && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span><strong>Guests:</strong> {selections.guestCount}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span><strong>Venue:</strong> {selections.venueName}</span>
                </div>
                {selections.eventTime && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span><strong>Start Time:</strong> {selections.eventTime}</span>
                  </div>
                )}
                {selections.endTime && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span><strong>End Time:</strong> {selections.endTime}</span>
                  </div>
                )}
              </div>
              {(selections.ceremonyMusic || selections.cocktailHour || selections.reception || selections.afterParty) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700"><strong>Timeline:</strong></p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selections.ceremonyMusic && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        ✓ Ceremony
                      </span>
                    )}
                    {selections.cocktailHour && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        ✓ Cocktail Hour
                      </span>
                    )}
                    {selections.reception && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        ✓ Reception
                      </span>
                    )}
                    {selections.afterParty && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        ✓ After Party
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Preview */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                Draft Invoice
              </h2>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                DRAFT
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600">Invoice #: <span className="font-mono">{invoiceNumber}</span></p>
              <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
            </div>

            <table className="w-full mb-6">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 text-gray-700">Description</th>
                  <th className="text-right py-3 text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedPkg && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 text-gray-900">{selectedPkg.name}</td>
                    <td className="py-3 text-right font-semibold text-gray-900">{selectedPkg.price}</td>
                  </tr>
                )}
                {selectedAddOns.map(addon => (
                  <tr key={addon.id} className="border-b border-gray-200">
                    <td className="py-3 text-gray-900">{addon.name}</td>
                    <td className="py-3 text-right font-semibold text-gray-900">{addon.price}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td className="py-4 text-lg font-bold text-gray-900">Total</td>
                  <td className="py-4 text-right text-2xl font-bold text-green-600">
                    ${subtotal.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            <p className="text-xs text-gray-500 italic">
              * This is a draft estimate. Final quote may vary based on your specific requirements.
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What Happens Next:</h2>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span className="text-gray-700">We'll review your selections and event details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span className="text-gray-700">Prepare a detailed custom quote for your event</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span className="text-gray-700">Reach out within 24 hours with pricing and next steps</span>
              </li>
            </ol>
            <div className="mt-6 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Questions in the meantime?</strong>
              </p>
              <a href="tel:+19014102020" className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                <Phone className="h-4 w-4" />
                Call us: (901) 410-2020
              </a>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-6 text-center">
            <p className="font-bold text-yellow-900 mb-4">🧪 DEMO MODE - Admin Controls</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => { setSubmitted(false); setSelections({...selections, package: '', addOns: []}); }}>
                Test Again
              </Button>
              <Button variant="slim" onClick={() => window.location.href = '/admin/service-selection'}>
                Admin Dashboard
              </Button>
            </div>
            <p className="text-xs text-yellow-800 mt-4">
              💡 Check browser console for full submission data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      {/* Demo Banner */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 text-center">
          <p className="font-bold text-yellow-900">🧪 DEMO MODE</p>
          <p className="text-sm text-yellow-800">This is a test version. Real leads will see the actual token-protected page.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hi {contact.first_name}! Let's Plan Your Event 🎉
          </h1>
          <p className="text-gray-600">
            Select your DJ services and we'll send you a custom quote within 24 hours
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Details */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Event Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <select
                  value={selections.eventType}
                  onChange={(e) => setSelections({...selections, eventType: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="private_party">Private Party</option>
                  <option value="school_dance">School Dance</option>
                  <option value="holiday_party">Holiday Party</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={selections.eventDate}
                  onChange={(e) => setSelections({...selections, eventDate: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={selections.eventTime}
                  onChange={(e) => setSelections({...selections, eventTime: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={selections.endTime}
                  onChange={(e) => setSelections({...selections, endTime: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Count
                </label>
                <input
                  type="number"
                  value={selections.guestCount}
                  onChange={(e) => setSelections({...selections, guestCount: e.target.value})}
                  placeholder="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <VenueAutocomplete
                venueName={selections.venueName}
                venueAddress={selections.venueAddress}
                onVenueNameChange={(name) => setSelections({...selections, venueName: name})}
                onVenueAddressChange={(address) => setSelections({...selections, venueAddress: address})}
              />
            </div>
          </div>

          {/* Package Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Select Your Package *
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => setSelections({...selections, package: pkg.id})}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition ${
                    selections.package === pkg.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-4">{pkg.price}</p>
                  
                  <ul className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Add-Ons Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Add-Ons & Extras
            </h2>
            <p className="text-gray-600 mb-6">Select any additional services you'd like to add:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addOns.map(addon => (
                <label key={addon.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selections.addOns.includes(addon.id)}
                    onChange={(e) => {
                      const newAddOns = e.target.checked
                        ? [...selections.addOns, addon.id]
                        : selections.addOns.filter(id => id !== addon.id);
                      setSelections({...selections, addOns: newAddOns});
                    }}
                    className="mt-1 h-5 w-5 text-purple-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{addon.name}</p>
                      <p className="text-sm font-bold text-purple-600">{addon.price}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Timeline Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              Event Timeline
            </h2>

            <div className="space-y-4">
              {[
                { id: 'ceremonyMusic', label: 'Ceremony Music', desc: 'Music for wedding ceremony (included in Package 2 & 3)' },
                { id: 'cocktailHour', label: 'Cocktail Hour', desc: 'Background music during cocktail/social hour' },
                { id: 'reception', label: 'Reception / Main Event', desc: 'DJ for main party and dancing (included in all packages)' },
                { id: 'afterParty', label: 'After Party', desc: 'Extended hours beyond main event' }
              ].map(item => (
                <label key={item.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selections[item.id as keyof typeof selections] as boolean}
                    onChange={(e) => setSelections({...selections, [item.id]: e.target.checked})}
                    className="mt-1 h-5 w-5 text-blue-600 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Music Preferences
                </label>
                <textarea
                  value={selections.musicPreferences}
                  onChange={(e) => setSelections({...selections, musicPreferences: e.target.value})}
                  placeholder="Top 40, Classic Rock, Country, Hip-Hop, etc."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests
                </label>
                <textarea
                  value={selections.specialRequests}
                  onChange={(e) => setSelections({...selections, specialRequests: e.target.value})}
                  placeholder="Any specific songs, special moments, or requirements?"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Questions or Services Not Listed?
                </label>
                <textarea
                  value={selections.additionalQuestions}
                  onChange={(e) => setSelections({...selections, additionalQuestions: e.target.value})}
                  placeholder="Any other services you're interested in or questions about our offerings?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Button
              type="submit"
              disabled={submitting || !selections.package}
              className="w-full md:w-auto px-12 py-4 text-lg font-semibold"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2 inline" />
                  Test Submit (Demo Only)
                </>
              )}
            </Button>
            
            {!selections.package && (
              <p className="text-sm text-gray-500 mt-4">
                Please select a package to continue
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="mb-2">Questions? We're here to help!</p>
          <a href="tel:+19014102020" className="text-blue-600 font-semibold hover:text-blue-700">
            Call (901) 410-2020
          </a>
        </div>
      </div>
    </div>
  );
}

