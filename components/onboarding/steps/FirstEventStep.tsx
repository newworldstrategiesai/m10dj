/**
 * First Event Step - Create first event
 */

import { useState } from 'react';
import { Calendar, MapPin, Clock, CheckCircle } from 'lucide-react';
import { OnboardingStepProps } from '../OnboardingWizard';

export default function FirstEventStep({
  organization,
  onComplete,
  onSkip,
  onNext
}: OnboardingStepProps) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [eventUrl, setEventUrl] = useState<string | null>(null);

  const handleCreateEvent = async () => {
    if (!eventName || !eventDate) {
      alert('Please fill in event name and date');
      return;
    }

    setCreating(true);
    try {
      // Create event via API
      const response = await fetch('/api/crowd-request/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          date: eventDate,
          location: eventLocation,
          organization_id: organization.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCreated(true);
        setEventUrl(data.eventUrl);
        onComplete();
      } else {
        throw new Error('Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. You can create one later from your dashboard.');
      onNext();
    } finally {
      setCreating(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onNext();
    }
  };

  if (created) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Event Created! 🎉
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your first event is ready. You can now share the request page with your audience.
        </p>
        {eventUrl && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
              Event URL:
            </p>
            <code className="text-xs sm:text-sm font-mono text-green-900 dark:text-green-100 break-all">
              {eventUrl}
            </code>
          </div>
        )}
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create Your First Event
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create an event to start accepting song requests. You can always add more later.
        </p>
      </div>

      {/* Event Form */}
      <div className="max-w-md mx-auto space-y-4 mb-6 w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Event Name
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g., Wedding Reception - Smith Wedding"
            className="w-full min-w-0 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Event Date
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full min-w-0 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Location (Optional)
          </label>
          <input
            type="text"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="e.g., The Peabody Hotel, Memphis"
            className="w-full min-w-0 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
          What happens next:
        </h3>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
          <li>Get a unique URL for this event</li>
          <li>Generate a QR code to share</li>
          <li>Start accepting song requests immediately</li>
          <li>View all requests in your dashboard</li>
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleSkip}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
        >
          Skip for now
        </button>
        <button
          onClick={handleCreateEvent}
          disabled={creating || !eventName || !eventDate}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </div>
  );
}

