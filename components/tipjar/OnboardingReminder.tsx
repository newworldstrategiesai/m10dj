'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, ArrowRight, CreditCard, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingReminderProps {
  organization: any;
}

interface IncompleteTask {
  id: string;
  title: string;
  description: string;
  critical: boolean;
  step: number;
}

export default function OnboardingReminder({ organization }: OnboardingReminderProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const [incompleteTasks, setIncompleteTasks] = useState<IncompleteTask[]>([]);

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
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    task.critical
                      ? 'bg-yellow-500/20 border border-yellow-300/30'
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {task.id === 'payment_setup' ? (
                      <CreditCard className="w-5 h-5" />
                    ) : task.id === 'display_name' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">
                      {task.critical && (
                        <span className="inline-block px-2 py-0.5 bg-red-500/30 rounded text-xs mr-2">
                          Critical
                        </span>
                      )}
                      {task.title}
                    </p>
                    <p className="text-xs text-purple-100">{task.description}</p>
                  </div>
                </div>
              ))}
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

