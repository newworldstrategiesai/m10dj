import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getGroupLabel, formatGroupDisplayName } from '@/types/karaoke';
import SongAutocomplete from '@/components/karaoke/SongAutocomplete';
import { Mic, Users, Loader2, AlertCircle, CheckCircle2, Zap, Plus, X, UserPlus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface ManualKaraokeSignupProps {
  organizationId: string;
  eventCode?: string;
  onSignupCreated?: (signup: any) => void;
  onClose?: () => void;
}

export default function ManualKaraokeSignup({
  organizationId,
  eventCode,
  onSignupCreated,
  onClose
}: ManualKaraokeSignupProps) {
  const supabase = createClient();
  const { toast } = useToast();

  // Form state - matching the public form structure
  const [groupMembers, setGroupMembers] = useState<string[]>(['']);
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [selectedVideoData, setSelectedVideoData] = useState<any>(null);
  const [singerEmail, setSingerEmail] = useState('');
  const [singerPhone, setSingerPhone] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a new group member input
  const addMember = () => {
    setGroupMembers(prev => [...prev, '']);
  };

  // Remove a group member
  const removeMember = (index: number) => {
    if (groupMembers.length > 1) {
      setGroupMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Update a group member name
  const handleMemberChange = (index: number, value: string) => {
    setGroupMembers(prev => prev.map((member, i) => i === index ? value : member));
  };

  // Validate form
  const validateForm = () => {
    if (!groupMembers[0]?.trim()) {
      setError('Please enter at least one singer name');
      return false;
    }

    if (!songTitle.trim()) {
      setError('Please enter a song title');
      return false;
    }

    if (!songArtist.trim()) {
      setError('Please enter the song artist');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/karaoke/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_qr_code: eventCode || 'admin-manual', // Default event code for admin signups
          organization_id: organizationId,
          group_size: groupMembers.filter(m => m.trim() !== '').length,
          singer_name: groupMembers[0]?.trim() || '',
          group_members: groupMembers.slice(1).filter(m => m.trim() !== ''),
          song_title: songTitle.trim(),
          song_artist: songArtist.trim() || null,
          video_data: selectedVideoData, // Include the linked video data
          singer_email: singerEmail.trim() || null,
          singer_phone: singerPhone.trim() || null,
          is_priority: isPriority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Failed to create signup. Please try again.');
        setSubmitting(false);
        return;
      }

      toast({
        title: 'Signup Created',
        description: `${formatGroupDisplayName(groupMembers[0], groupMembers.slice(1), groupMembers.length)} added to queue`,
      });

      // Reset form
      setGroupMembers(['']);
      setSongTitle('');
      setSongArtist('');
      setSelectedVideoData(null);
      setSingerEmail('');
      setSingerPhone('');
      setIsPriority(false);

      // Notify parent component
      if (onSignupCreated) {
        onSignupCreated(data.signup);
      }

      // Close modal if provided
      if (onClose) {
        onClose();
      }

    } catch (err: any) {
      console.error('Error creating signup:', err);
      setError(err.message || 'Failed to create signup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 flex flex-col h-full max-h-full">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full max-h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Manual Karaoke Signup</h2>
              <p className="text-blue-100 text-sm">Add a singer to the queue manually</p>
            </div>
          </div>
        </div>

        {/* Form - Scrollable content with sticky button */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Singer Names Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Singer Names <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {groupMembers.map((member, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      placeholder={index === 0 ? 'Primary singer name' : `Additional singer ${index + 1}`}
                      required={index === 0}
                      className="h-11 sm:h-10 text-base"
                    />
                  </div>
                  {groupMembers.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeMember(index)}
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                onClick={addMember}
                variant="outline"
                size="sm"
                className="w-full h-10 sm:h-9 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Singer
              </Button>
            </div>
          </div>

          {/* Song Selection Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Song Selection <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Song Title</label>
                <SongAutocomplete
                  value={songTitle}
                  onChange={(value) => setSongTitle(value)}
                  onSelect={(song) => {
                    setSongTitle(song.title);
                    if (song.artist) {
                      setSongArtist(song.artist);
                    }
                    // Store video data for signup creation
                    if ((song as any).videoData) {
                      setSelectedVideoData((song as any).videoData);
                    }
                  }}
                  placeholder="Search for a song..."
                  organizationId={organizationId}
                  className="h-11 sm:h-10"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Artist</label>
                <Input
                  type="text"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  placeholder="Artist name"
                  required
                  className="h-11 sm:h-10"
                />
                {selectedVideoData && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    Karaoke video linked
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Contact Information <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <Input
                  type="email"
                  value={singerEmail}
                  onChange={(e) => setSingerEmail(e.target.value)}
                  placeholder="singer@example.com"
                  className="h-11 sm:h-10"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                <Input
                  type="tel"
                  value={singerPhone}
                  onChange={(e) => setSingerPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="h-11 sm:h-10"
                />
              </div>
            </div>
          </div>

          {/* Priority Option */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-0 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Priority Signup</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Skip the line and go next</p>
              </div>
            </div>
            <Switch
              checked={isPriority}
              onCheckedChange={setIsPriority}
            />
          </div>
          </div>

          {/* Submit Buttons - Always visible at bottom, outside scrollable area */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 pt-4 pb-4 px-4 sm:px-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10 w-full">
            {onClose && (
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 h-12 sm:h-11 order-2 sm:order-1 min-w-0 w-full sm:w-auto"
                disabled={submitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 sm:h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 order-1 sm:order-2 min-w-0 w-full sm:w-auto flex-shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Add to Queue</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}