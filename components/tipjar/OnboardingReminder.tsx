'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, ArrowRight, CreditCard, User, MapPin, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingReminderProps {
  organization: any;
  onOrganizationUpdate?: (updatedOrg: any) => void;
}

interface IncompleteTask {
  id: string;
  title: string;
  description: string;
  critical: boolean;
  step: number;
}

export default function OnboardingReminder({ organization, onOrganizationUpdate }: OnboardingReminderProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const [incompleteTasks, setIncompleteTasks] = useState<IncompleteTask[]>([]);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;

    const tasks: IncompleteTask[] = [];

    // Critical Task 1: Display Name
    if (!organization.requests_header_artist_name || !organization.requests_header_artist_name.trim()) {
      tasks.push({
        id: 'display_name',
        title: 'Set Your Display Name',
        description: "Add a display name so customers know who they're tipping",
        critical: true,
        step: 2
      });
    }

    // Critical Task 2: Payment Setup
    if (!organization.stripe_connect_account_id || !organization.stripe_connect_charges_enabled) {
      tasks.push({
        id: 'payment_setup',
        title: 'Set Up Payments',
        description: 'Enable payment processing to receive tips and payments',
        critical: true,
        step: 3
      });
    }

    // Optional but recommended: Location
    if (!organization.requests_header_location || !organization.requests_header_location.trim()) {
      tasks.push({
        id: 'location',
        title: 'Add Your Location',
        description: 'Add your location to help customers find you',
        critical: false,
        step: 2
      });
    } else {
      // If location is now set, close the input form if it was open
      if (showLocationInput) {
        setShowLocationInput(false);
        setLocationCity('');
        setLocationState('');
      }
    }

    setIncompleteTasks(tasks);

    // Check sessionStorage for dismissed state
    // sessionStorage resets on each browser session (new login), so reminder will show on every login
    // But can be dismissed during the current session
    const dismissedKey = `onboarding_dismissed_${organization.id}`;
    const dismissed = sessionStorage.getItem(dismissedKey) === 'true';
    
    // If there are critical tasks, reminder should always be visible (unless explicitly dismissed for this session)
    // sessionStorage resets on each new browser session, so it will show on every login
    const criticalTasks = tasks.filter(t => t.critical);
    if (criticalTasks.length === 0) {
      // No critical tasks - respect dismissal (only non-critical reminders)
      setIsDismissed(dismissed);
    } else {
      // Has critical tasks - show reminder unless dismissed for this session
      // On next login, sessionStorage will be empty, so reminder will show again
      setIsDismissed(dismissed);
    }
  }, [organization]);

  const handleDismiss = () => {
    if (!organization) return;
    const dismissedKey = `onboarding_dismissed_${organization.id}`;
    sessionStorage.setItem(dismissedKey, 'true');
    setIsDismissed(true);
  };

  const handleCompleteOnboarding = () => {
    router.push('/tipjar/onboarding');
  };

  const handleLocationClick = () => {
    setShowLocationInput(true);
    // Pre-fill if location already exists
    if (organization?.requests_header_location) {
      const parts = organization.requests_header_location.split(',').map((p: string) => p.trim());
      if (parts.length >= 2) {
        setLocationCity(parts[0]);
        setLocationState(parts.slice(1).join(', '));
      } else {
        setLocationCity(organization.requests_header_location);
      }
    }
    setLocationError(null);
  };

  const handleSaveLocation = async () => {
    if (!locationCity.trim()) {
      setLocationError('City is required');
      return;
    }

    setSavingLocation(true);
    setLocationError(null);

    try {
      // Combine city and state
      const locationString = locationState.trim()
        ? `${locationCity.trim()}, ${locationState.trim()}`
        : locationCity.trim();

      const response = await fetch('/api/organizations/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests_header_location: locationString,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save location');
      }

      const { organization: updatedOrg } = await response.json();

      // Update local state
      setShowLocationInput(false);
      setLocationCity('');
      setLocationState('');

      // Notify parent component to refresh organization data
      if (onOrganizationUpdate) {
        onOrganizationUpdate(updatedOrg);
      } else {
        // Fallback: reload page to refresh organization data
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error saving location:', error);
      setLocationError(error.message || 'Failed to save location. Please try again.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleCancelLocation = () => {
    setShowLocationInput(false);
    setLocationCity('');
    setLocationState('');
    setLocationError(null);
  };

  // Don't show if no incomplete tasks or if dismissed
  if (!organization || incompleteTasks.length === 0 || isDismissed) {
    return null;
  }

  const criticalTasks = incompleteTasks.filter(t => t.critical);
  const hasCriticalTasks = criticalTasks.length > 0;

  return (
    <div className="mb-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl shadow-2xl p-4 sm:p-6 relative animate-in slide-in-from-top-2 duration-300">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors z-10"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="pr-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 mt-0.5">
            {hasCriticalTasks ? (
              <AlertCircle className="w-6 h-6 text-yellow-300" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-300" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">
              {hasCriticalTasks ? 'Complete Setup to Start Receiving Tips!' : 'Finish Your Setup'}
            </h3>
            <p className="text-purple-50 text-sm mb-4">
              {hasCriticalTasks
                ? `You have ${criticalTasks.length} critical ${criticalTasks.length === 1 ? 'task' : 'tasks'} remaining. Complete these to unlock all features.`
                : 'A few more steps and you\'ll be all set!'}
            </p>

            {/* Task List */}
            <div className="space-y-3 mb-4">
              {incompleteTasks.map((task) => {
                const handleTaskClick = () => {
                  if (task.id === 'payment_setup') {
                    // Scroll to StripeConnectSetup component if it exists on the page
                    const setupElement = document.querySelector('[data-stripe-setup]');
                    if (setupElement) {
                      setupElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      // Fallback: navigate to onboarding if setup component not found on current page
                      router.push('/tipjar/onboarding');
                    }
                  } else if (task.id === 'location') {
                    handleLocationClick();
                  }
                };

                const isClickable = task.id === 'payment_setup' || task.id === 'location';
                const isLocationTask = task.id === 'location';
                const showInputForThisTask = isLocationTask && showLocationInput;

                return (
                  <div
                    key={task.id}
                    className={`flex flex-col gap-3 p-3 rounded-lg transition-colors ${
                      task.critical
                        ? 'bg-yellow-500/20 border border-yellow-300/30'
                        : 'bg-white/10 border border-white/20'
                    } ${isClickable ? 'cursor-pointer hover:bg-yellow-500/30 dark:hover:bg-yellow-500/30' : ''}`}
                  >
                    <div
                      onClick={isClickable ? handleTaskClick : undefined}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {task.id === 'payment_setup' ? (
                          <CreditCard className="w-5 h-5" />
                        ) : task.id === 'display_name' ? (
                          <User className="w-5 h-5" />
                        ) : task.id === 'location' ? (
                          <MapPin className="w-5 h-5" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                          {task.critical && (
                            <span className="inline-block px-2 py-0.5 bg-red-500/30 rounded text-xs">
                              Critical
                            </span>
                          )}
                          <span>{task.title}</span>
                          {isClickable && (
                            <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
                          )}
                        </p>
                        <p className="text-xs text-purple-100">{task.description}</p>
                      </div>
                    </div>

                    {/* Location Input Form */}
                    {showInputForThisTask && (
                      <div className="mt-2 pt-3 border-t border-white/20 space-y-3">
                        {locationError && (
                          <div className="text-xs text-red-200 bg-red-500/20 p-2 rounded">
                            {locationError}
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="location-city" className="block text-xs font-medium text-purple-100 mb-1">
                              City *
                            </label>
                            <input
                              id="location-city"
                              type="text"
                              value={locationCity}
                              onChange={(e) => setLocationCity(e.target.value)}
                              placeholder="e.g., Memphis"
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                              disabled={savingLocation}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveLocation();
                                }
                              }}
                            />
                          </div>
                          <div>
                            <label htmlFor="location-state" className="block text-xs font-medium text-purple-100 mb-1">
                              State
                            </label>
                            <input
                              id="location-state"
                              type="text"
                              value={locationState}
                              onChange={(e) => setLocationState(e.target.value)}
                              placeholder="e.g., TN"
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                              disabled={savingLocation}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveLocation();
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveLocation}
                            disabled={savingLocation || !locationCity.trim()}
                            className="flex-1 px-4 py-2 bg-white text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {savingLocation ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelLocation}
                            disabled={savingLocation}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCompleteOnboarding}
                className="flex-1 px-4 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
              >
                Complete Setup Now
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors"
              >
                Dismiss for Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

