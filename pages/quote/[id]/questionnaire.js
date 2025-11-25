import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle, Music, Heart, Mic, Radio, Link as LinkIcon, Save, Loader2, Sparkles, HelpCircle, Edit2, Check, Download, PartyPopper } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function MusicQuestionnaire() {
  const router = useRouter();
  const { id } = router.query;
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    eventDate: '',
    venueName: '',
    guestCount: '',
    bigNoSongs: '',
    specialDances: [],
    specialDanceSongs: {},
    playlistLinks: {
      ceremony: '',
      cocktail: '',
      reception: ''
    },
    ceremonyMusicType: '',
    ceremonyMusic: {},
    vibe: '',
    importedPlaylists: {} // Store imported playlist data
  });
  const [importingPlaylist, setImportingPlaylist] = useState({});
  const stepContentRef = useRef(null);
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    
    // Fetch lead data
    const fetchLeadData = async () => {
      try {
        const response = await fetch(`/api/leads/get-lead?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setLeadData(data);
        }
      } catch (error) {
        console.error('Error fetching lead data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeadData();
    
    // Load saved data from localStorage
    const savedData = localStorage.getItem(`questionnaire_${id}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ ...parsed, ...prev }));
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, [id]);

  // Pre-fill event details from leadData
  useEffect(() => {
    if (leadData) {
      setFormData(prev => ({
        ...prev,
        eventDate: prev.eventDate || (leadData.eventDate ? leadData.eventDate.split('T')[0] : ''),
        venueName: prev.venueName || leadData.venueName || leadData.location || '',
        guestCount: prev.guestCount || leadData.guestCount || ''
      }));
    }
  }, [leadData]);

  // Auto-save functionality
  useEffect(() => {
    if (!id || currentStep === 0) return;
    
    const autoSaveTimer = setTimeout(() => {
      setAutoSaveStatus('saving');
      localStorage.setItem(`questionnaire_${id}`, JSON.stringify(formData));
      setTimeout(() => {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      }, 300);
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [formData, id, currentStep]);

  const specialDanceOptions = [
    { 
      id: 'bridal_party_intro', 
      label: 'Bridal Party Intro Song',
      tooltip: 'The high-energy song when your wedding party makes their grand entrance'
    },
    { 
      id: 'bride_groom_intro', 
      label: 'Bride and Groom Introduction Song',
      tooltip: 'YOUR big moment walking in as the new Mr & Mrs!'
    },
    { 
      id: 'first_dance', 
      label: 'Bride and Groom First Dance',
      tooltip: 'The romantic song just for the two of you'
    },
    { 
      id: 'father_daughter', 
      label: 'Father Daughter Dance',
      tooltip: 'That tear-jerker moment with Dad'
    },
    { 
      id: 'mother_son', 
      label: 'Mother Son Dance',
      tooltip: 'A sweet dedication to Mom'
    },
    { 
      id: 'garter_toss', 
      label: 'Garter Toss Song',
      tooltip: 'The fun, upbeat song for the garter toss tradition'
    },
    { 
      id: 'bouquet_toss', 
      label: 'Bouquet Toss Song',
      tooltip: 'The celebratory song when you toss the bouquet to your single friends'
    },
    { 
      id: 'cake_cutting', 
      label: 'Cake Cutting Song',
      tooltip: 'The sweet song that plays while you cut your wedding cake together'
    },
    { 
      id: 'last_dance', 
      label: 'Bride and Groom Last Dance of the night',
      tooltip: 'Your final dance together as the night comes to a close'
    }
  ];

  const ceremonyMusicFields = [
    { 
      id: 'prelude', 
      label: 'Prelude', 
      description: 'Soft background music while guests arrive and find their seats – think peaceful and welcoming'
    },
    { 
      id: 'interlude', 
      label: 'Interlude', 
      description: 'A beautiful song during the lighting of the unity candle or another special moment in your ceremony. It can be instrumental or vocal.'
    },
    { 
      id: 'processional', 
      label: 'Processional', 
      description: 'Stately, elegant music played as your bridal party walks down the aisle, with you and your escort at the very end. Often the bride\'s walk is accompanied by a different, more emotional tune.'
    },
    { 
      id: 'bridal_march', 
      label: 'Bridal March', 
      description: 'The moment everyone\'s been waiting for – the music that plays as you walk down the aisle.'
    },
    { 
      id: 'recessional', 
      label: 'Recessional', 
      description: 'Upbeat, triumphant music played at the end of the service as you make your way back up the aisle as newlyweds!'
    },
    { 
      id: 'postlude', 
      label: 'Postlude',
      description: 'Background music that plays until every last guest has exited the ceremony area. It should be gentle and last around fifteen minutes.'
    }
  ];

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Your Music Planning',
      icon: Sparkles,
      description: 'Let\'s make sure your wedding day music is absolutely perfect!'
    },
    {
      id: 'event_details',
      title: 'Event Details',
      icon: PartyPopper,
      description: 'Help us understand your event basics'
    },
    {
      id: 'big_no',
      title: 'Songs We\'ll Happily Skip',
      icon: Music,
      description: 'We\'ll steer clear of these so your dance floor stays perfect'
    },
    {
      id: 'special_dances',
      title: 'Special Dances',
      icon: Heart,
      description: 'Are we having any special songs played for first dance, father daughter dance, etc?'
    },
    {
      id: 'special_dance_songs',
      title: 'Special Dance Songs',
      icon: Music,
      description: 'Please provide the song names and artists for your special dances'
    },
    {
      id: 'playlists',
      title: 'Your Playlists',
      icon: LinkIcon,
      description: 'Have a playlist already started? We love it!'
    },
    {
      id: 'ceremony_type',
      title: 'Ceremony Music',
      icon: Radio,
      description: 'What music will be played at the ceremony?'
    },
    {
      id: 'ceremony_details',
      title: 'Ceremony Music Details',
      icon: Music,
      description: 'Please provide the song names for your ceremony'
    },
    {
      id: 'review',
      title: 'Review & Submit',
      icon: CheckCircle,
      description: 'Review your music selections before submitting'
    }
  ];

  const handleSpecialDanceToggle = (danceId) => {
    setFormData(prev => ({
      ...prev,
      specialDances: prev.specialDances.includes(danceId)
        ? prev.specialDances.filter(id => id !== danceId)
        : [...prev.specialDances, danceId]
    }));
  };

  const handleSpecialDanceSongChange = (danceId, value) => {
    setFormData(prev => ({
      ...prev,
      specialDanceSongs: {
        ...prev.specialDanceSongs,
        [danceId]: value
      }
    }));
  };

  const handlePlaylistLinkChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      playlistLinks: {
        ...prev.playlistLinks,
        [type]: value
      }
    }));
  };

  const handleCeremonyMusicChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      ceremonyMusic: {
        ...prev.ceremonyMusic,
        [fieldId]: value
      }
    }));
  };

  const nextStep = () => {
    // Skip special dance songs step if no special dances selected
    if (currentStep === 3 && formData.specialDances.length === 0) {
      setCurrentStep(5); // Skip to playlists
      return;
    }
    // Skip ceremony details if not pre-recorded
    if (currentStep === 6 && formData.ceremonyMusicType !== 'pre_recorded') {
      setCurrentStep(8); // Skip to review
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    // Skip special dance songs step if no special dances selected
    if (currentStep === 5 && formData.specialDances.length === 0) {
      setCurrentStep(3);
      return;
    }
    // Skip ceremony details if not pre-recorded
    if (currentStep === 8 && formData.ceremonyMusicType !== 'pre_recorded') {
      setCurrentStep(6);
      return;
    }
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/questionnaire/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: id,
          ...formData
        })
      });

      if (response.ok) {
        // Trigger confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        setSaved(true);
        // Don't auto-redirect, show celebration screen
      } else {
        throw new Error('Failed to save questionnaire');
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast({
        title: 'Error',
        description: 'There was an error saving your questionnaire. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    // Navigate to the appropriate step
    const stepMap = {
      'bigNoSongs': 2,
      'specialDances': 3,
      'specialDanceSongs': 4,
      'playlists': 5,
      'ceremonyType': 6,
      'ceremonyDetails': 7
    };
    if (stepMap[section] !== undefined) {
      setCurrentStep(stepMap[section]);
    }
  };

  const isValidUrl = (url) => {
    if (!url) return true; // Empty is valid (optional)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Spotify Playlist Import Function
  async function getSpotifyPlaylist(url) {
    try {
      const match = url.match(/(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]{22})/);
      if (!match) return null;
      const id = match[1];

      // Primary endpoint
      let res = await fetch(`https://open.spotify.com/oembed/${id}/tracks`);
      if (!res.ok) {
        // Fallback community proxy
        res = await fetch(`https://spotify-api-omega.vercel.app/api/playlist?id=${id}`);
      }
      if (!res.ok) return null;

      const data = await res.json();
      return {
        title: data.title || 'Spotify Playlist',
        songs: data.tracks.map((t) => `${t.name} - ${t.artists?.[0]?.name || 'Unknown Artist'}`).join('\n')
      };
    } catch {
      return null;
    }
  }

  const handleImportPlaylist = async (type) => {
    const url = formData.playlistLinks[type];
    if (!url || !url.includes('spotify')) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid Spotify playlist URL first.',
        variant: 'destructive'
      });
      return;
    }

    setImportingPlaylist(prev => ({ ...prev, [type]: true }));
    
    try {
      const playlistData = await getSpotifyPlaylist(url);
      
      if (playlistData) {
        const songCount = playlistData.songs.split('\n').filter(s => s.trim()).length;
        
        setFormData(prev => ({
          ...prev,
          importedPlaylists: {
            ...prev.importedPlaylists,
            [type]: {
              title: playlistData.title,
              songs: playlistData.songs,
              count: songCount
            }
          }
        }));

        toast({
          title: 'Success!',
          description: `Imported ${songCount} songs from "${playlistData.title}"`
        });
      } else {
        toast({
          title: 'Import Failed',
          description: 'Make sure the playlist is public and try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error importing playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to import playlist. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setImportingPlaylist(prev => ({ ...prev, [type]: false }));
    }
  };

  // Get personalized greeting
  const getGreeting = () => {
    if (!leadData?.name) return 'Hi lovebirds!';
    
    const name = leadData.name.trim();
    // Try to extract first names (common patterns: "John & Jane", "John and Jane", "John, Jane", "John Jane")
    const nameMatch = name.match(/^([^&,]+)(?:[&,]|\s+and\s+)(.+)$/i);
    if (nameMatch) {
      const firstName1 = nameMatch[1].trim().split(' ')[0];
      const firstName2 = nameMatch[2].trim().split(' ')[0];
      return `Hi ${firstName1} & ${firstName2}!`;
    }
    
    // Single name - use first name
    const firstName = name.split(' ')[0];
    return `Hi ${firstName}!`;
  };

  // Auto-focus first input when step changes
  useEffect(() => {
    if (stepContentRef.current && currentStep > 0) {
      const firstInput = stepContentRef.current.querySelector('input, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [currentStep]);

  // Auto-scroll to first special dance input when coming from selection step
  useEffect(() => {
    if (currentStep === 4 && formData.specialDances.length > 0) {
      setTimeout(() => {
        const firstInput = stepContentRef.current?.querySelector('input');
        if (firstInput) {
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInput.focus();
        }
      }, 300);
    }
  }, [currentStep, formData.specialDances.length]);

  const getProgress = () => {
    const totalSteps = steps.length;
    const currentStepIndex = currentStep + 1;
    return (currentStepIndex / totalSteps) * 100;
  };

  const canProceed = () => {
    const step = steps[currentStep];
    if (step.id === 'event_details') {
      return true; // All optional for booked leads
    }
    if (step.id === 'special_dance_songs') {
      return true; // Optional step
    }
    if (step.id === 'ceremony_details') {
      return true; // Optional step
    }
    if (step.id === 'big_no') {
      return true; // Optional
    }
    if (step.id === 'special_dances') {
      return true; // Can proceed with none selected
    }
    if (step.id === 'ceremony_type') {
      return formData.ceremonyMusicType !== '';
    }
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  if (saved) {
    // Get personalized details for success message
    const eventDateStr = formData.eventDate 
      ? new Date(formData.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : leadData?.eventDate 
        ? new Date(leadData.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'your special day';
    
    const hasSpecialDances = formData.specialDances.length > 0;
    const hasPlaylists = Object.values(formData.playlistLinks).some(link => link) || Object.keys(formData.importedPlaylists || {}).length > 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center animate-in fade-in duration-500">
          <div className="mb-6">
            <PartyPopper className="w-20 h-20 text-purple-600 dark:text-purple-400 mx-auto mb-4 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Your Music is Locked In! 🎵
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            {getGreeting()} We&apos;ve got everything we need to create the perfect soundtrack for {eventDateStr}.
          </p>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>What happens next:</strong>
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>We&apos;ll review your preferences{hasSpecialDances ? ' and special dance songs' : ''}{hasPlaylists ? ' along with your playlists' : ''}</li>
              <li>You&apos;ll receive a personalized preview playlist within 24 hours</li>
              <li>We&apos;ll be in touch if we have any questions</li>
            </ul>
          </div>
          <Link href={`/quote/${id}/confirmation`}>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-base py-6">
              Continue to Confirmation
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <>
      <Head>
        <title>Music Planning Questionnaire | M10 DJ Company</title>
      </Head>
      
      <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <Link 
              href={`/quote/${id}/confirmation`}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back to Confirmation
            </Link>
            <div className="flex items-center gap-4">
              {autoSaveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
              {autoSaveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </div>
              )}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          </div>
          
          {/* Visual Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const StepIcon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <button
                        onClick={() => {
                          if (index < currentStep || index === currentStep) {
                            setCurrentStep(index);
                          }
                        }}
                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                          isActive
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white scale-110'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                        } ${index <= currentStep ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                        disabled={index > currentStep}
                        aria-label={`Go to step ${index + 1}: ${step.title}`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </button>
                      <span className={`mt-2 text-xs text-center max-w-[80px] truncate ${
                        isActive
                          ? 'text-purple-600 dark:text-purple-400 font-semibold'
                          : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
            {/* Step Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
                <currentStepData.icon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {currentStepData.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Content */}
            <div ref={stepContentRef} className="space-y-6 animate-in fade-in duration-300">
              {/* Welcome Step */}
              {currentStep === 0 && (
                <div className="text-center py-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Help us create the perfect soundtrack for your day
                  </h2>
                  <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
                    {getGreeting()}
                  </p>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    We&apos;re so excited to be a part of your wedding day! Let&apos;s make sure your music is absolutely perfect.
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">
                    This questionnaire will help us understand your musical preferences and ensure every moment is exactly as you envision.
                  </p>
                  <div className="max-w-md mx-auto">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                      Quick vibe check <Badge variant="secondary" className="text-xs ml-2">Optional</Badge>
                    </label>
                    <input
                      type="text"
                      value={formData.vibe}
                      onChange={(e) => setFormData(prev => ({ ...prev, vibe: e.target.value }))}
                      placeholder="Describe your wedding in 3 words (e.g., romantic, upbeat, classy)"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Event Details Step - Quick Confirmation */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Quick confirmation:</strong> We have your event details on file. Feel free to update anything below or skip ahead to the music questions.
                    </p>
                  </div>
                  
                  {/* Event Date */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wedding Date
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
                      Update if anything has changed
                    </p>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Venue Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Venue Name
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
                      Update if your venue has changed
                    </p>
                    <input
                      type="text"
                      value={formData.venueName}
                      onChange={(e) => setFormData(prev => ({ ...prev, venueName: e.target.value }))}
                      placeholder="e.g., The Grand Ballroom, Garden Estate..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Guest Count */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Approximate Guest Count
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
                      An approximate number helps us plan — not sure yet? That&apos;s OK!
                    </p>
                    <select
                      value={formData.guestCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, guestCount: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a range...</option>
                      <option value="1-50">1-50 guests</option>
                      <option value="51-100">51-100 guests</option>
                      <option value="101-150">101-150 guests</option>
                      <option value="151-200">151-200 guests</option>
                      <option value="201-250">201-250 guests</option>
                      <option value="251-300">251-300 guests</option>
                      <option value="300+">300+ guests</option>
                      <option value="not_sure">Not sure yet — that&apos;s OK!</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Big No Songs */}
              {currentStep === 2 && (
                <div>
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">What is a song?</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          A song is a complete piece of music with a title and artist. For example: &quot;Uptown Funk&quot; by Bruno Mars, or &quot;Sweet Caroline&quot; by Neil Diamond. Just write the song name and who sings it!
                        </p>
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Songs We&apos;ll Happily Skip
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 italic">
                    We&apos;ll steer clear of these so your dance floor stays perfect
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Don&apos;t have any? That&apos;s totally fine — just skip this step!
                  </p>
                  <textarea
                    value={formData.bigNoSongs}
                    onChange={(e) => setFormData(prev => ({ ...prev, bigNoSongs: e.target.value }))}
                    placeholder="List any songs you absolutely don't want played at your wedding..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    You can list multiple songs, one per line or separated by commas.
                  </p>
                </div>
              )}

              {/* Special Dances Selection */}
              {currentStep === 3 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Check all that apply:
                  </p>
                  <div className="space-y-3">
                    {specialDanceOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.specialDances.includes(option.id)}
                          onChange={() => handleSpecialDanceToggle(option.id)}
                          className="w-5 h-5 min-w-[20px] min-h-[20px] text-purple-600 focus:ring-purple-500 rounded cursor-pointer mt-0.5"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 dark:text-white font-medium">
                              {option.label}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{option.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {formData.specialDances.length === 0 && (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
                      No special dances? That&apos;s perfectly fine! You can skip the next step.
                    </p>
                  )}
                </div>
              )}

              {/* Special Dance Songs */}
              {currentStep === 4 && (
                <div>
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">What is a song?</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          A song is a complete piece of music with a title and artist. For example: &quot;At Last&quot; by Etta James, or &quot;Thinking Out Loud&quot; by Ed Sheeran. Just write the song name and who sings it!
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Please give us the song names for all special dances below. It is not required to have a song for each category — just leave it blank if the category doesn&apos;t apply.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 italic">
                    Please include the artist name, or you can copy and paste song links. Not sure about a song yet? That&apos;s OK — you can always update this later!
                  </p>
                  <div className="space-y-4">
                    {formData.specialDances.map((danceId) => {
                      const option = specialDanceOptions.find(o => o.id === danceId);
                      return (
                        <div key={danceId}>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {option?.label}
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
                          </label>
                          <input
                            type="text"
                            value={formData.specialDanceSongs[danceId] || ''}
                            onChange={(e) => handleSpecialDanceSongChange(danceId, e.target.value)}
                            placeholder="Song name and artist, or paste a link&hellip;"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Playlist Links */}
              {currentStep === 5 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Have a playlist already started? We love it! Add any links to Spotify, Apple Music or Tidal playlists below.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 italic">
                    Don&apos;t have playlists yet? No worries — we&apos;ll create something amazing based on your preferences!
                  </p>
                  <div className="space-y-4">
                    {['ceremony', 'cocktail', 'reception'].map((type) => {
                      const labels = {
                        ceremony: 'Ceremony Music Playlist Link',
                        cocktail: 'Cocktail Hour Playlist Link',
                        reception: 'Reception Playlist Link'
                      };
                      const value = formData.playlistLinks[type];
                      const isValid = isValidUrl(value);
                      const isImporting = importingPlaylist[type];
                      const importedData = formData.importedPlaylists?.[type];
                      
                      return (
                        <div key={type}>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {labels[type]}
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={value}
                              onChange={(e) => handlePlaylistLinkChange(type, e.target.value)}
                              placeholder="https://open.spotify.com/playlist/..."
                              className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                                value && !isValid
                                  ? 'border-red-300 dark:border-red-700'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            />
                            {value && value.includes('spotify') && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleImportPlaylist(type)}
                                disabled={isImporting}
                                className="whitespace-nowrap"
                              >
                                {isImporting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Importing...
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Import Songs
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          {value && !isValid && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              Please enter a valid URL (e.g., https://open.spotify.com/playlist/...)
                            </p>
                          )}
                          {importedData && (
                            <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Imported {importedData.count} songs from &quot;{importedData.title}&quot;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ceremony Music Type */}
              {currentStep === 6 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    What type of music will be played during your ceremony?
                  </p>
                  <div className="space-y-3">
                    {[
                      { value: 'pre_recorded', label: 'Pre-recorded Music' },
                      { value: 'live_musician', label: 'Live Musician' },
                      { value: 'both', label: 'Both' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                      >
                        <input
                          type="radio"
                          name="ceremonyMusicType"
                          value={option.value}
                          checked={formData.ceremonyMusicType === option.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, ceremonyMusicType: e.target.value }))}
                          className="w-5 h-5 min-w-[20px] min-h-[20px] text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="ml-3 text-gray-900 dark:text-white font-medium">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Ceremony Music Details */}
              {currentStep === 7 && (
                <div>
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">What is a song?</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          A song is a complete piece of music with a title and artist. For example: &quot;Canon in D&quot; by Pachelbel, or &quot;A Thousand Years&quot; by Christina Perri. Just write the song name and who sings it!
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    If pre-recorded music will be played, please give the song names below. It is not required to have songs for each of the fields below — if a category doesn&apos;t apply, simply leave it blank.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 italic">
                    Not sure about specific songs yet? That&apos;s perfectly fine! You can always update this later or we can help you choose.
                  </p>
                  <div className="space-y-6">
                    {ceremonyMusicFields.map((field) => (
                      <div key={field.id}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {field.label || field.id.charAt(0).toUpperCase() + field.id.slice(1)}
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        </label>
                        {field.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
                            {field.description}
                          </p>
                        )}
                        <input
                          type="text"
                          value={formData.ceremonyMusic[field.id] || ''}
                          onChange={(e) => handleCeremonyMusicChange(field.id, e.target.value)}
                          placeholder="Song name and artist..."
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Step */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  {/* Big No Songs */}
                  {formData.bigNoSongs && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 relative">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          Songs to Avoid
                        </h3>
                        <button
                          onClick={() => handleEditSection('bigNoSongs')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{formData.bigNoSongs}</p>
                    </div>
                  )}

                  {/* Special Dances */}
                  {formData.specialDances.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 relative">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          Special Dances
                        </h3>
                        <button
                          onClick={() => handleEditSection('specialDanceSongs')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {formData.specialDances.map((danceId) => {
                          const option = specialDanceOptions.find(o => o.id === danceId);
                          const song = formData.specialDanceSongs[danceId];
                          return (
                            <li key={danceId} className="text-gray-700 dark:text-gray-300">
                              <strong>{option?.label}:</strong> {song || <span className="text-gray-400 italic">No song specified</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Playlists */}
                  {(formData.playlistLinks.ceremony || formData.playlistLinks.cocktail || formData.playlistLinks.reception || Object.keys(formData.importedPlaylists || {}).length > 0) && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 relative">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <LinkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          Playlist Links
                        </h3>
                        <button
                          onClick={() => handleEditSection('playlists')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                      <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                        {formData.playlistLinks.ceremony && (
                          <li>
                            <strong>Ceremony:</strong>{' '}
                            <a href={formData.playlistLinks.ceremony} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline break-all">
                              {formData.playlistLinks.ceremony}
                            </a>
                            {formData.importedPlaylists?.ceremony && (
                              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <Music className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                    {formData.importedPlaylists.ceremony.title} (imported {formData.importedPlaylists.ceremony.count} songs)
                                  </span>
                                </div>
                                <pre className="text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                  {formData.importedPlaylists.ceremony.songs}
                                </pre>
                              </div>
                            )}
                          </li>
                        )}
                        {formData.playlistLinks.cocktail && (
                          <li>
                            <strong>Cocktail Hour:</strong>{' '}
                            <a href={formData.playlistLinks.cocktail} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline break-all">
                              {formData.playlistLinks.cocktail}
                            </a>
                            {formData.importedPlaylists?.cocktail && (
                              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <Music className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                    {formData.importedPlaylists.cocktail.title} (imported {formData.importedPlaylists.cocktail.count} songs)
                                  </span>
                                </div>
                                <pre className="text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                  {formData.importedPlaylists.cocktail.songs}
                                </pre>
                              </div>
                            )}
                          </li>
                        )}
                        {formData.playlistLinks.reception && (
                          <li>
                            <strong>Reception:</strong>{' '}
                            <a href={formData.playlistLinks.reception} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline break-all">
                              {formData.playlistLinks.reception}
                            </a>
                            {formData.importedPlaylists?.reception && (
                              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <Music className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                    {formData.importedPlaylists.reception.title} (imported {formData.importedPlaylists.reception.count} songs)
                                  </span>
                                </div>
                                <pre className="text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                  {formData.importedPlaylists.reception.songs}
                                </pre>
                              </div>
                            )}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Ceremony Music */}
                  {formData.ceremonyMusicType && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 relative">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Radio className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          Ceremony Music Type
                        </h3>
                        <button
                          onClick={() => handleEditSection('ceremonyType')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 capitalize">{formData.ceremonyMusicType.replace('_', ' ')}</p>
                    </div>
                  )}

                  {Object.keys(formData.ceremonyMusic).length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 relative">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          Ceremony Music Details
                        </h3>
                        <button
                          onClick={() => handleEditSection('ceremonyDetails')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {Object.entries(formData.ceremonyMusic).map(([key, value]) => {
                          if (!value) return null;
                          const field = ceremonyMusicFields.find(f => f.id === key);
                          return (
                            <li key={key} className="text-gray-700 dark:text-gray-300">
                              <strong>{field?.label || key}:</strong> {value}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center px-4 md:px-6 py-3 min-h-[44px] text-base text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </button>

              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center justify-center px-4 md:px-8 py-3 min-h-[44px] text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg touch-manipulation flex-1 sm:flex-initial"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Saving...</span>
                      <span className="sm:hidden">Saving</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      <span className="hidden sm:inline">Lock In My Music & Get My Custom Preview</span>
                      <span className="sm:hidden">Lock In Music</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center justify-center px-4 md:px-8 py-3 min-h-[44px] text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg touch-manipulation flex-1 sm:flex-initial"
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      </TooltipProvider>
    </>
  );
}

