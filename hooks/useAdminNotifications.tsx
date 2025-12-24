import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { useDataChannel } from '@livekit/components-react';

export interface NewSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  eventType?: string;
  eventDate?: string;
  location?: string;
  created_at: string;
}

export interface UseAdminNotificationsReturn {
  newSubmissionsCount: number;
  isChecking: boolean;
  checkForNewSubmissions: () => Promise<void>;
}

export function useAdminNotifications(): UseAdminNotificationsReturn {
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  
  // LiveKit data channel for real-time notifications (if in voice assistant room)
  const { message } = useDataChannel('notifications');

  // Listen to LiveKit notifications
  useEffect(() => {
    if (message) {
      try {
        const data = JSON.parse(new TextDecoder().decode(message.payload));
        if (data.type === 'notification') {
          // Show toast notification
          toast({
            title: data.title,
            description: data.message,
            duration: 5000,
          });

          // Update count if it's a new lead
          if (data.type === 'new_lead') {
            setNewSubmissionsCount(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    }
  }, [message, toast]);

  const formatSubmissionForToast = (submission: NewSubmission): string => {
    const parts: string[] = [];
    if (submission.eventType) parts.push(submission.eventType);
    if (submission.eventDate) parts.push(new Date(submission.eventDate).toLocaleDateString());
    if (submission.location) parts.push(submission.location);
    
    return parts.length > 0 ? parts.join(' • ') : 'New inquiry';
  };

  const checkForNewSubmissions = useCallback(async (): Promise<void> => {
    setIsChecking(true);
    
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('No active session for admin notifications');
        return;
      }

      const lastLogin = getLastLoginTime();
      const params = new URLSearchParams();
      if (lastLogin) {
        params.append('lastLogin', lastLogin);
      }

      const response = await fetch(`/api/admin/new-submissions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch new submissions');
      }

      const data = await response.json();
      const submissions: NewSubmission[] = data.submissions || [];
      
      setNewSubmissionsCount(submissions.length);

      // Show toast notifications for each new submission
      submissions.forEach((submission, index) => {
        // Stagger the toasts so they don't all appear at once
        setTimeout(() => {
          toast({
            title: `📝 New Form Submission`,
            description: (
              <div className="space-y-1">
                <p className="font-medium">{submission.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatSubmissionForToast(submission)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(submission.created_at).toLocaleString()}
                </p>
              </div>
            ),
            duration: 5000, // Show for 5 seconds
          });
        }, index * 1000); // 1 second delay between toasts
      });

      // Update last login time to now
      setLastLoginTime(new Date().toISOString());

    } catch (error) {
      console.error('Error checking for new submissions:', error);
    } finally {
      setIsChecking(false);
    }
  }, [toast]);

  // Check on mount and set up polling
  useEffect(() => {
    checkForNewSubmissions();
    
    // Poll every 30 seconds (reduced from 5 minutes since we have LiveKit now)
    const interval = setInterval(checkForNewSubmissions, 30000);
    
    return () => clearInterval(interval);
  }, [checkForNewSubmissions]);

  return {
    newSubmissionsCount,
    isChecking,
    checkForNewSubmissions,
  };
}

// Helper functions for localStorage
function getLastLoginTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_last_login');
}

function setLastLoginTime(isoString: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_last_login', isoString);
}
