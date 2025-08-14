import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface NewSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  event_type: string;
  event_date?: string;
  location?: string;
  message?: string;
  created_at: string;
}

interface UseAdminNotificationsReturn {
  checkForNewSubmissions: () => Promise<void>;
  newSubmissionsCount: number;
  isChecking: boolean;
}

export function useAdminNotifications(): UseAdminNotificationsReturn {
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const getLastLoginTime = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_last_login');
    }
    return null;
  };

  const setLastLoginTime = (timestamp: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_last_login', timestamp);
    }
  };

  const formatSubmissionForToast = (submission: NewSubmission): string => {
    const parts = [];
    if (submission.event_type) parts.push(submission.event_type);
    if (submission.event_date) parts.push(new Date(submission.event_date).toLocaleDateString());
    if (submission.location) parts.push(submission.location);
    
    return parts.length > 0 ? parts.join(' • ') : 'New inquiry';
  };

  const checkForNewSubmissions = async (): Promise<void> => {
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
  };

  return {
    checkForNewSubmissions,
    newSubmissionsCount,
    isChecking
  };
}
