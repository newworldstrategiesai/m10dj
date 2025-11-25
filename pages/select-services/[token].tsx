/**
 * Service Selection Page (Public)
 * Unique link for each lead to select their DJ services
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Music, 
  Clock, 
  Users, 
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  Loader,
  AlertCircle,
  Sparkles,
  Phone,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import VenueAutocomplete from '@/components/VenueAutocomplete';

export default function SelectServicesPage() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [valid, setValid] = useState(false);
  const [alreadyUsed, setAlreadyUsed] = useState(false);
  const [contact, setContact] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);

  // Form state
  const [selections, setSelections] = useState({
    eventType: '',
    eventDate: '',
    eventTime: '',
    endTime: '',
    venueName: '',
    venueAddress: '',
    guestCount: '',
    package: '',
    services: [] as string[],
    addOns: [] as string[],
    ceremonyMusic: false,
    cocktailHour: false,
    reception: true,
    afterParty: false,
    musicPreferences: '',
    specialRequests: ''
  });

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/service-selection/validate-token?token=${token}`);
      const data = await response.json();

      if (data.valid) {
        // If they already have a service selection, redirect to invoice/contract
        if (data.already_has_selection && data.should_redirect) {
          router.push(data.redirect_to || `/quote/${data.existing_quote_id}/invoice`);
          return;
        }

        setValid(true);
        setContact(data.contact);
        setAlreadyUsed(data.already_used || false);

        // Pre-fill form with contact data
        if (data.contact) {
          setSelections(prev => ({
            ...prev,
            eventType: data.contact.event_type || '',
            eventDate: data.contact.event_date || '',
            venueName: data.contact.venue_name || '',
            venueAddress: data.contact.venue_address || '',
            guestCount: data.contact.guest_count || ''
          }));
        }
      } else {
        setError(data.error || 'Invalid or expired link');
      }
    } catch (err) {
      setError('Failed to validate link. Please contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate package selection
    if (!selections.package) {
      setError('Please select a package to continue');
      return;
    }

    setError(''); // Clear any previous errors
    setSubmitting(true);

    try {
      console.log('📤 Submitting service selections:', selections);
      
      const response = await fetch('/api/service-selection/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          selections: {
            ...selections,
            guestCount: parseInt(selections.guestCount) || null
          }
        })
      });

      const data = await response.json();
      console.log('📥 Response:', { status: response.status, data });

      if (response.ok && data.success) {
        console.log('✅ Submission successful!');
        setSubmissionData(data);
        setSubmitted(true);
        // Scroll to top to see success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errorMsg = data.error || data.message || 'Submission failed. Please try again.';
        console.error('❌ Submission error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit. Please try again.';
      console.error('❌ Network or parsing error:', err);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
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
        'Ceremony audio & music'
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
        'Dancing on the Clouds effect'
      ]
    }
  ];

  const addOns = [
    { id: 'additional_hour', name: 'Additional Hour(s)', price: '$300' },
    { id: 'additional_speaker', name: 'Cocktail Hour Audio', price: '$250' },
    { id: 'dancing_clouds', name: 'Dancing on the Clouds', price: '$500' },
    { id: 'cold_spark', name: 'Cold Spark Fountain Effect', price: '$600' },
    { id: 'monogram', name: 'Monogram Projection', price: '$350' },
    { id: 'uplighting_addon', name: 'Uplighting Add-on (Package 1 only)', price: '$300' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your service selection...</p>
        </div>
      </div>
    );
  }

  if (error && !valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Main Recovery Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-12 w-12 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Link Needs Refreshing</h1>
              <p className="text-lg text-gray-600 mb-2">No worries! This happens sometimes.</p>
              <p className="text-gray-500">Let's get you back to securing your date →</p>
            </div>

            {/* Why This Happened (Build Trust) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Why?</span> Links can expire after 30 days or if the system was updated. No problem—let's fix this in 2 minutes.
              </p>
            </div>

            {/* Three Path Options (Choice Architecture) */}
            <div className="space-y-4 mb-8">
              <p className="font-semibold text-gray-900 text-center mb-6">Choose your fastest path forward:</p>
              
              {/* Option 1: Quick Call (Lowest Friction) */}
              <a 
                href="tel:+19014102020"
                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl hover:shadow-lg transition transform hover:scale-105 text-center font-semibold"
              >
                <Phone className="h-5 w-5 inline mr-2" />
                Call Now (Fastest) - 2 mins
                <div className="text-sm font-normal text-blue-100 mt-1">Direct to Ben for instant approval</div>
              </a>

              {/* Option 2: Chat (Medium Friction) */}
              <button 
                onClick={() => window.location.href = '/#contact'}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-xl hover:shadow-lg transition transform hover:scale-105 text-center font-semibold"
              >
                <Sparkles className="h-5 w-5 inline mr-2" />
                Chat via Website - 3 mins
                <div className="text-sm font-normal text-purple-100 mt-1">Quick questions? AI assistant available 24/7</div>
              </button>

              {/* Option 3: Email New Link (Self-Service) */}
              <button 
                onClick={() => {
                  const email = prompt('📧 What email should we send the new link to?');
                  if (email) {
                    fetch('/api/service-selection/generate-link', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: email,
                        eventType: 'wedding',
                        forceNewToken: true,
                        isResendingLink: true
                      })
                    })
                    .then(res => res.json())
                    .then(data => {
                      if (data.link) {
                        alert(`✅ New link sent to ${email}! Check your inbox in 1-2 minutes.`);
                      } else {
                        alert('Error generating link. Please call us instead.');
                      }
                    });
                  }
                }}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl hover:shadow-lg transition transform hover:scale-105 text-center font-semibold"
              >
                <FileText className="h-5 w-5 inline mr-2" />
                Email Me New Link - 1 min
                <div className="text-sm font-normal text-green-100 mt-1">Fresh link sent directly to your inbox</div>
              </button>
            </div>

            {/* Social Proof / Urgency */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-5 mb-8">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-orange-600">⚡ Pro Tip:</span> December is our busiest month. Getting this locked in now guarantees your date. Most couples book within 24 hours of viewing packages.
              </p>
            </div>

            {/* Direct Contact Info (Fallback) */}
            <div className="border-t border-gray-200 pt-8">
              <p className="text-center text-gray-600 mb-6 text-sm">
                Prefer to discuss everything first? Totally fine.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500 mb-1">📞 CALL (Fastest)</p>
                  <a href="tel:+19014102020" className="text-xl font-bold text-blue-600 hover:text-blue-700">
                    (901) 410-2020
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">📧 EMAIL</p>
                  <a href="mailto:djbenmurray@gmail.com" className="text-xl font-bold text-blue-600 hover:text-blue-700">
                    djbenmurray@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Trust Builders */}
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 shadow">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900">100% Free Quotes</p>
              <p className="text-xs text-gray-500">No hidden fees</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900">24-Hour Response</p>
              <p className="text-xs text-gray-500">Guaranteed reply</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <Music className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900">50+ Weddings/Year</p>
              <p className="text-xs text-gray-500">Most trusted in Memphis</p>
            </div>
          </div>

          {/* Bottom CTA - Return to Site */}
          <div className="text-center mt-8">
            <a 
              href="/"
              className="text-gray-600 hover:text-gray-900 font-semibold underline transition"
            >
              ← Back to M10 DJ Company
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyUsed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Submitted!</h1>
          <p className="text-gray-600 mb-4">
            Hi {contact?.first_name}! You've already submitted your service selections.
          </p>
          <p className="text-gray-500">
            We'll be in touch within 24 hours with your custom quote!
          </p>
        </div>
      </div>
    );
  }

  if (submitted && submissionData) {
    // Package details
    const packageDetails = {
      'package_1': { name: 'Package 1 - Reception Only', price: '$2,000', features: ['DJ/MC Services (4 hours)', 'Speakers & microphones', 'Dance floor lighting', 'Uplighting (16 LED fixtures)', 'Additional speaker'] },
      'package_2': { name: 'Package 2 - Reception Only', price: '$2,500', features: ['DJ/MC Services (4 hours)', 'Speakers & microphones', 'Dance floor lighting', 'Uplighting (16 LED fixtures)', 'Ceremony audio & music'] },
      'package_3': { name: 'Package 3 - Ceremony & Reception', price: '$3,000', features: ['DJ/MC Services (4 hours)', 'Speakers & microphones', 'Ceremony audio & music', 'Dance floor lighting', 'Uplighting (16 LED fixtures)', 'Dancing on the Clouds effect'] }
    };

    const addOnDetails = {
      'additional_hour': { name: 'Additional Hour(s)', price: '$300' },
      'additional_speaker': { name: 'Cocktail Hour Audio', price: '$250' },
      'dancing_clouds': { name: 'Dancing on the Clouds', price: '$500' },
      'cold_spark': { name: 'Cold Spark Fountain Effect', price: '$600' },
      'monogram': { name: 'Monogram Projection', price: '$350' },
      'uplighting_addon': { name: 'Uplighting Add-on', price: '$300' }
    };

    const selectedPackage = submissionData.selections?.package ? packageDetails[submissionData.selections.package as keyof typeof packageDetails] : null;
    const selectedAddOns = (submissionData.selections?.addOns || [])
      .map((id: string) => addOnDetails[id as keyof typeof addOnDetails])
      .filter(Boolean);
    const invoice = submissionData.invoice;
    const timeline = submissionData.selections?.timeline || {};

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You, {contact?.first_name}!</h1>
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
            {selectedPackage && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedPackage.name}</h3>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{selectedPackage.price}</p>
                  </div>
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <ul className="space-y-2 mt-4">
                  {selectedPackage.features.map((feature: string, idx: number) => (
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
                  {selectedAddOns.map((addon: any) => (
                    <li key={addon.name} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
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
            {submissionData.selections && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 mb-3">Event Details:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span><strong>Event:</strong> {submissionData.selections.eventType} on {submissionData.selections.eventDate}</span>
                  </div>
                  {submissionData.selections.guestCount && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span><strong>Guests:</strong> {submissionData.selections.guestCount}</span>
                    </div>
                  )}
                  {submissionData.selections.venueName && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span><strong>Venue:</strong> {submissionData.selections.venueName}</span>
                    </div>
                  )}
                  {submissionData.selections.eventTime && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span><strong>Start Time:</strong> {submissionData.selections.eventTime}</span>
                    </div>
                  )}
                  {submissionData.selections.endTime && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span><strong>End Time:</strong> {submissionData.selections.endTime}</span>
                    </div>
                  )}
                </div>
                {(timeline.ceremonyMusic || timeline.cocktailHour || timeline.reception || timeline.afterParty) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-700"><strong>Timeline:</strong></p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {timeline.ceremonyMusic && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          ✓ Ceremony
                        </span>
                      )}
                      {timeline.cocktailHour && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          ✓ Cocktail Hour
                        </span>
                      )}
                      {timeline.reception && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          ✓ Reception
                        </span>
                      )}
                      {timeline.afterParty && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          ✓ After Party
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Invoice */}
          {invoice && (
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
                <p className="text-sm text-gray-600">Invoice #: <span className="font-mono">{invoice.invoice_number}</span></p>
                <p className="text-sm text-gray-600">Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
              </div>

              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 text-gray-700">Description</th>
                    <th className="text-right py-3 text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-3 text-gray-900">{item.description}</td>
                      <td className="py-3 text-right font-semibold text-gray-900">
                        ${item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300">
                    <td className="py-4 text-lg font-bold text-gray-900">Total</td>
                    <td className="py-4 text-right text-2xl font-bold text-green-600">
                      ${invoice.total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <p className="text-xs text-gray-500 italic">
                * This is a draft estimate. Final quote may vary based on your specific requirements.
              </p>

              {invoice && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <a
                    href={`/api/documents/${invoice.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    <FileText className="h-5 w-5" />
                    View Full Documents (Invoice & Contract)
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Contract */}
          {submissionData.contract && submissionData.contract.signing_url && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Your Contract
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  READY TO SIGN
                </span>
              </div>

              <p className="text-gray-700 mb-6">
                Your contract has been generated and is ready for your signature. Please review and sign at your earliest convenience.
              </p>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  Contract #: <span className="font-mono font-semibold">{submissionData.contract.contract_number}</span>
                </p>
                {submissionData.contract.expires_at && (
                  <p className="text-sm text-gray-600">
                    Link expires: {new Date(submissionData.contract.expires_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>

              <a
                href={submissionData.contract.signing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
              >
                <FileText className="h-5 w-5" />
                Review & Sign Contract
              </a>

              <p className="text-xs text-gray-500 mt-4 italic">
                * This contract is valid for 30 days. After signing, you'll receive a copy via email.
              </p>
            </div>
          )}

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
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a 
                href="tel:+19014102020"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <Phone className="h-5 w-5" />
                Call Us: (901) 410-2020
              </a>
              <a 
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Visit Our Website
              </a>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Check your email for a confirmation of your selections.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hi {contact?.first_name}! Let's Plan Your Event 🎉
          </h1>
          <p className="text-gray-600">
            Select your DJ services and we'll send you a custom quote within 24 hours
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">Something went wrong</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <p className="text-red-600 text-xs mt-2">Please try again or call us at (901) 410-2020 for assistance.</p>
              </div>
            </div>
          </div>
        )}

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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Questions or Services Not Listed?
                </label>
                <textarea
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
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit Selections & Get Quote
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
