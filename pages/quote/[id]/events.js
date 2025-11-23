import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Save, Loader2, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toasts/use-toast';

export default function MyEvents() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contractSigned, setContractSigned] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventTime: '',
    endTime: '',
    location: '',
    venueName: '',
    guestCount: '',
    specialRequests: ''
  });

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      
      // Fetch both lead data and quote data
      const [leadResponse, quoteResponse] = await Promise.all([
        fetch(`/api/leads/get-lead?id=${id}`),
        fetch(`/api/quote/${id}`).catch(() => null) // Quote might not exist yet
      ]);
      
      if (!leadResponse.ok) {
        throw new Error('Failed to fetch lead data');
      }
      
      const leadData = await leadResponse.json();
      setLeadData(leadData);
      
      // Check if contract is signed from quote data
      if (quoteResponse && quoteResponse.ok) {
        const quoteData = await quoteResponse.json();
        if (quoteData.contract_id) {
          try {
            const contractResponse = await fetch(`/api/contracts/${quoteData.contract_id}`);
            if (contractResponse.ok) {
              const contractData = await contractResponse.json();
              if (contractData.status === 'signed' || contractData.signed_at) {
                setContractSigned(true);
              }
            }
          } catch (e) {
            console.log('Could not fetch contract details:', e);
          }
        }
      }

      // Populate form data
      setFormData({
        name: leadData.name || '',
        email: leadData.email || '',
        phone: leadData.phone || '',
        eventDate: leadData.eventDate ? leadData.eventDate.split('T')[0] : '',
        eventTime: leadData.eventTime || '',
        endTime: leadData.endTime || '',
        location: leadData.location || '',
        venueName: leadData.venueName || '',
        guestCount: leadData.guestCount || '',
        specialRequests: leadData.specialRequests || ''
      });
    } catch (error) {
      console.error('Error fetching lead data:', error);
      toast({
        title: "Error",
        description: "Failed to load event information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (contractSigned) {
      toast({
        title: "Cannot Edit",
        description: "Event information cannot be edited after contract is signed",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/leads/${id}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          endTime: formData.endTime,
          location: formData.location,
          venueName: formData.venueName,
          guestCount: formData.guestCount,
          specialRequests: formData.specialRequests
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update event information');
      }

      toast({
        title: "Success",
        description: "Event information updated successfully"
      });
      setIsEditing(false);
      await fetchLeadData();
    } catch (error) {
      console.error('Error saving event information:', error);
      toast({
        title: "Error",
        description: "Failed to save event information",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!leadData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Event Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find your event information.</p>
          <Link href="/" className="text-brand hover:text-brand-dark">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Events | M10 DJ Company</title>
        <meta name="description" content="View and manage your event details" />
      </Head>
      
      {/* Simplified Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-10 md:h-12">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo-static.jpg"
                alt="M10 DJ Company"
                width={120}
                height={40}
                className="h-6 md:h-8 w-auto"
                priority
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-6">
            <Link 
              href={`/quote/${id}`}
              className="inline-flex items-center gap-2 text-brand hover:text-brand-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Quote
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Events</h1>
              {!contractSigned && (
                <button
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      fetchLeadData(); // Reset form
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {isEditing ? 'Cancel' : 'Edit Event'}
                </button>
              )}
            </div>

            {contractSigned && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">
                    Your contract has been signed. Event information cannot be edited at this time.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Event Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.eventDate ? new Date(formData.eventDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Not specified'}
                  </p>
                )}
              </div>

              {/* Event Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Event Start Time
                </label>
                {isEditing ? (
                  <input
                    type="time"
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.eventTime || 'Not specified'}
                  </p>
                )}
              </div>

              {/* Event End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Event End Time
                </label>
                {isEditing ? (
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.endTime || 'Not specified'}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Event location"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.location || 'Not specified'}
                  </p>
                )}
              </div>

              {/* Venue Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="venueName"
                    value={formData.venueName}
                    onChange={handleInputChange}
                    placeholder="Venue name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.venueName || 'Not specified'}
                  </p>
                )}
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Expected Guest Count
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="guestCount"
                    value={formData.guestCount}
                    onChange={handleInputChange}
                    placeholder="Number of guests"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.guestCount || 'Not specified'}
                  </p>
                )}
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Requests or Notes
                </label>
                {isEditing ? (
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    placeholder="Any special requests or notes about your event..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {formData.specialRequests || 'None'}
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{formData.name || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{formData.email || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{formData.phone || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="pt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchLeadData();
                    }}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

