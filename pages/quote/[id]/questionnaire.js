import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle, Music, Heart, Mic, Radio, Link as LinkIcon, Save, Loader2, Sparkles, HelpCircle, Edit2, Check, Download, PartyPopper, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { normalizeSongInput, cleanSongInput } from '../../../utils/song-normalizer';
import { getQuestionnaireConfig } from '../../../utils/questionnaire-config';

export default function MusicQuestionnaire() {
  const router = useRouter();
  const { id, focused } = router.query;
  const isFocusedMode = focused === 'true';
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    eventDate: '',
    venueName: '',
    eventTime: '',
    endTime: '',
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
    selectedCeremonyFields: [], // Track which ceremony music fields they want
    ceremonyMusic: {},
    vibe: '',
    importedPlaylists: {}, // Store imported playlist data
    mcIntroduction: null // null = not set, '' = declined, string = custom introduction
  });
  const [importingPlaylist, setImportingPlaylist] = useState({});
  const stepContentRef = useRef(null);
  const stepIndicatorRef = useRef(null);
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [hasCeremonyAudio, setHasCeremonyAudio] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [skippedSteps, setSkippedSteps] = useState(new Set());
  const [selectedServices, setSelectedServices] = useState({
    reception: false,
    ceremonyAudio: false,
    cocktailHour: false
  });
  const [clickedService, setClickedService] = useState(null);
  const { toast } = useToast();

  // Get questionnaire configuration based on event type
  const questionnaireConfig = useMemo(() => {
    const eventType = leadData?.eventType || 'wedding';
    return getQuestionnaireConfig(eventType);
  }, [leadData?.eventType]);

  useEffect(() => {
    if (!id) return;
    
    // Fetch lead data, quote data, and saved questionnaire data
    const fetchData = async () => {
      try {
        const [leadResponse, quoteResponse, questionnaireResponse] = await Promise.all([
          fetch(`/api/leads/get-lead?id=${id}`),
          fetch(`/api/quote/${id}`).catch(() => null), // Quote might not exist yet
          fetch(`/api/questionnaire/get?leadId=${id}`).catch(() => null) // Questionnaire might not exist yet
        ]);
        
        if (leadResponse.ok) {
          const data = await leadResponse.json();
          setLeadData(data);
        }
        
        // Check if ceremony audio was purchased and store quote data
        if (quoteResponse && quoteResponse.ok) {
          const quoteDataResult = await quoteResponse.json();
          setQuoteData(quoteDataResult);
          const addons = quoteDataResult.addons || [];
          const hasCeremony = addons.some(addon => {
            const addonId = typeof addon === 'object' ? addon.id : addon;
            return addonId === 'ceremony_audio';
          });
          setHasCeremonyAudio(hasCeremony);
          
          // Auto-detect services from quote/invoice data
          const services = detectServicesFromQuote(quoteDataResult);
          setSelectedServices(services);
          // Update hasCeremonyAudio based on selected services
          setHasCeremonyAudio(services.ceremonyAudio);
        }
        
        // Load saved questionnaire data from database (prioritize over localStorage)
        if (questionnaireResponse && questionnaireResponse.ok) {
          const questionnaireResult = await questionnaireResponse.json();
          if (questionnaireResult.success && questionnaireResult.data) {
            const savedData = questionnaireResult.data;
            // Load saved data, preserving event details that may have been set from leadData
            // Derive selectedCeremonyFields from ceremonyMusic keys (fields that have songs)
            const savedCeremonyMusic = savedData.ceremonyMusic || {};
            const derivedCeremonyFields = Object.keys(savedCeremonyMusic).filter(key => savedCeremonyMusic[key] && savedCeremonyMusic[key].trim() !== '');
            
            setFormData(prev => ({
              ...prev,
              // Load all saved questionnaire data
              bigNoSongs: savedData.bigNoSongs || '',
              specialDances: savedData.specialDances || [],
              specialDanceSongs: savedData.specialDanceSongs || {},
              playlistLinks: savedData.playlistLinks || {
                ceremony: '',
                cocktail: '',
                reception: ''
              },
              ceremonyMusicType: savedData.ceremonyMusicType || '',
              selectedCeremonyFields: derivedCeremonyFields.length > 0 ? derivedCeremonyFields : (prev.selectedCeremonyFields || []),
              ceremonyMusic: savedCeremonyMusic,
              importedPlaylists: savedData.importedPlaylists || {},
              mcIntroduction: savedData.mcIntroduction !== undefined ? savedData.mcIntroduction : null,
              // Preserve event details and vibe (these come from leadData or user input)
              eventDate: prev.eventDate || '',
              venueName: prev.venueName || '',
              guestCount: prev.guestCount || '',
              vibe: prev.vibe || ''
            }));
            // Clear localStorage since we have database data
            localStorage.removeItem(`questionnaire_${id}`);
          }
        } else {
          // Fallback to localStorage if no database data exists
          const savedData = localStorage.getItem(`questionnaire_${id}`);
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              // Derive selectedCeremonyFields from ceremonyMusic keys if not present
              const savedCeremonyMusic = parsed.ceremonyMusic || {};
              const derivedCeremonyFields = Object.keys(savedCeremonyMusic).filter(key => savedCeremonyMusic[key] && savedCeremonyMusic[key].trim() !== '');
              
              setFormData(prev => ({
                ...prev,
                // Load saved data from localStorage
                ...parsed,
                selectedCeremonyFields: parsed.selectedCeremonyFields || derivedCeremonyFields || [],
                // Preserve event details
                eventDate: prev.eventDate || parsed.eventDate || '',
                venueName: prev.venueName || parsed.venueName || '',
                guestCount: prev.guestCount || parsed.guestCount || ''
              }));
            } catch (e) {
              console.error('Error loading saved data from localStorage:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to localStorage on error
        const savedData = localStorage.getItem(`questionnaire_${id}`);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            // Derive selectedCeremonyFields from ceremonyMusic keys if not present
            const savedCeremonyMusic = parsed.ceremonyMusic || {};
            const derivedCeremonyFields = Object.keys(savedCeremonyMusic).filter(key => savedCeremonyMusic[key] && savedCeremonyMusic[key].trim() !== '');
            
            setFormData(prev => ({
              ...prev,
              ...parsed,
              selectedCeremonyFields: parsed.selectedCeremonyFields || derivedCeremonyFields || []
            }));
          } catch (e) {
            console.error('Error loading saved data from localStorage:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Pre-fill event details from leadData
  useEffect(() => {
    if (leadData) {
      setFormData(prev => ({
        ...prev,
        eventDate: prev.eventDate || (leadData.eventDate ? leadData.eventDate.split('T')[0] : ''),
        venueName: prev.venueName || leadData.venueName || leadData.venue_address || leadData.location || '',
        eventTime: prev.eventTime || leadData.eventTime || '',
        endTime: prev.endTime || leadData.endTime || '',
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

  // Auto-scroll step indicator to center active step
  useEffect(() => {
    if (stepIndicatorRef.current) {
      const activeStepElement = stepIndicatorRef.current.querySelector(`[data-step-index="${currentStep}"]`);
      if (activeStepElement) {
        // Use setTimeout to ensure the DOM has updated
        setTimeout(() => {
          const container = stepIndicatorRef.current;
          const elementRect = activeStepElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Calculate the center position
          const elementCenter = elementRect.left + elementRect.width / 2;
          const containerCenter = containerRect.left + containerRect.width / 2;
          const scrollOffset = elementCenter - containerCenter;
          
          // Scroll with padding to prevent clipping
          container.scrollBy({
            left: scrollOffset,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [currentStep]);

  // Get special dance options from config (or special moments for non-wedding events)
  const specialDanceOptions = questionnaireConfig.specialDanceFields || [];

  // Get ceremony music fields from config (empty for non-wedding events)
  const ceremonyMusicFields = questionnaireConfig.ceremonyMusicFields || [];

  // Base steps array from config - ceremony steps will be conditionally included
  const baseSteps = questionnaireConfig.steps || [];

  // Determine which steps are needed based on missing information
  const getNeededSteps = () => {
    const needed = new Set();
    
    // Always include welcome and review
    needed.add('welcome');
    needed.add('review');
    
    // Check for missing special dance songs
    if (formData.specialDances && formData.specialDances.length > 0) {
      const dancesWithoutSongs = formData.specialDances.filter(danceId => {
        const song = formData.specialDanceSongs?.[danceId];
        return !song || song.trim() === '';
      });
      if (dancesWithoutSongs.length > 0) {
        needed.add('special_dance_songs');
      }
    }
    
    // Check for missing ceremony music details (only for events that support ceremony music)
    if (questionnaireConfig.hasCeremonyMusic && formData.ceremonyMusicType === 'pre_recorded' && selectedServices.ceremonyAudio) {
      const ceremonySongs = Object.values(formData.ceremonyMusic || {}).filter(song => song && song.trim() !== '');
      if (ceremonySongs.length === 0) {
        needed.add('ceremony_fields');
        needed.add('ceremony_details');
      }
    }
    
    // Playlists are helpful but optional - include if they have other music info
    const hasOtherMusic = formData.bigNoSongs || 
                         (formData.specialDances && formData.specialDances.length > 0) ||
                         formData.ceremonyMusicType;
    if (hasOtherMusic) {
      const playlistCount = Object.values(formData.playlistLinks || {}).filter(link => link && link.trim() !== '').length;
      if (playlistCount === 0) {
        needed.add('playlists');
      }
    }
    
    return needed;
  };

  // Filter steps based on selected services, config, and focused mode
  const steps = baseSteps.filter(step => {
    // Hide ceremony steps if ceremony audio is not selected OR if config doesn't support ceremony music
    if ((!selectedServices.ceremonyAudio || !questionnaireConfig.hasCeremonyMusic) && 
        (step.id === 'ceremony_type' || step.id === 'ceremony_fields' || step.id === 'ceremony_details')) {
      return false;
    }
    
    // In focused mode, only show steps that are needed (missing important info)
    if (isFocusedMode) {
      const neededSteps = getNeededSteps();
      return neededSteps.has(step.id);
    }
    
    return true;
  });

  // Reset step when entering focused mode or when steps change significantly
  // Must be after steps is defined
  useEffect(() => {
    if (steps.length > 0 && currentStep >= steps.length) {
      setCurrentStep(0);
    }
  }, [steps.length, currentStep]);

  const handleSpecialDanceToggle = (danceId) => {
    setFormData(prev => {
      const newSpecialDances = prev.specialDances.includes(danceId)
        ? prev.specialDances.filter(id => id !== danceId)
        : [...prev.specialDances, danceId];
      
      // If special dances are now selected, un-skip the special dance songs step
      if (newSpecialDances.length > 0) {
        setSkippedSteps(prevSkipped => {
          const newSkipped = new Set(prevSkipped);
          newSkipped.delete('special_dance_songs');
          return newSkipped;
        });
      }
      
      return {
        ...prev,
        specialDances: newSpecialDances
      };
    });
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

  // Normalize song input on blur
  const handleSongInputBlur = async (danceId, value, type = 'specialDance') => {
    if (!value || !value.trim()) return;
    
    // Clean the input first
    const cleaned = cleanSongInput(value);
    
    // Normalize the song input
    const normalized = await normalizeSongInput(cleaned);
    
    // If normalization changed the value, update it
    if (normalized.normalized !== cleaned && normalized.normalized) {
      // Format: "Track Name - Artist Name" with optional link
      let formatted = normalized.normalized;
      if (normalized.link) {
        formatted += ` ${normalized.link}`;
      }
      
      if (type === 'specialDance') {
        handleSpecialDanceSongChange(danceId, formatted);
      } else if (type === 'ceremony') {
        handleCeremonyMusicChange(danceId, formatted);
      }
      
      // Show a subtle toast if we normalized it
      if (normalized.link || normalized.artist) {
        toast({
          title: 'Song formatted',
          description: normalized.link ? 'Track info extracted from link' : 'Formatted as "Track - Artist"',
          duration: 2000,
        });
      }
    }
  };

  const handleCeremonyFieldToggle = (fieldId) => {
    setFormData(prev => {
      const newCeremonyFields = prev.selectedCeremonyFields?.includes(fieldId)
        ? prev.selectedCeremonyFields.filter(id => id !== fieldId)
        : [...(prev.selectedCeremonyFields || []), fieldId];
      
      // If ceremony fields are now selected, un-skip the ceremony details step
      if (newCeremonyFields.length > 0) {
        setSkippedSteps(prevSkipped => {
          const newSkipped = new Set(prevSkipped);
          newSkipped.delete('ceremony_details');
          return newSkipped;
        });
      }
      
      return {
        ...prev,
        selectedCeremonyFields: newCeremonyFields
      };
    });
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

  // Detect services from quote/invoice data
  const detectServicesFromQuote = (quote) => {
    const services = {
      reception: false,
      ceremonyAudio: false,
      cocktailHour: false
    };
    
    if (!quote) return services;
    
    const addons = quote.addons || [];
    const addonIds = addons.map(addon => typeof addon === 'object' ? addon.id : addon);
    const packageName = quote.package_name || '';
    const packageId = quote.package_id || '';
    const lineItems = quote.custom_line_items || [];
    
    // Check line items first (most accurate source)
    const hasCompleteCoverage = lineItems.some(item => {
      const itemName = typeof item === 'object' ? (item.item || item.name || '') : '';
      return itemName.includes('Complete Wedding Day') || itemName.includes('Full-day');
    });
    
    if (hasCompleteCoverage) {
      services.reception = true;
      services.ceremonyAudio = true;
      services.cocktailHour = true;
    } else {
      // Check line items for individual services
      const lineItemNames = lineItems.map(item => {
        return typeof item === 'object' ? (item.item || item.name || '').toLowerCase() : '';
      });
      
      // Reception
      const hasReception = lineItemNames.some(name => 
        name.includes('reception') || 
        name.includes('dj/mc') || 
        name.includes('dj and mc')
      );
      services.reception = hasReception || (packageId && packageId !== 'speaker_rental' && !packageName.toLowerCase().includes('ceremony only'));
      
      // Ceremony Audio
      const hasCeremony = lineItemNames.some(name => name.includes('ceremony')) || addonIds.includes('ceremony_audio');
      services.ceremonyAudio = hasCeremony;
      
      // Cocktail Hour
      const hasCocktail = lineItemNames.some(name => name.includes('cocktail')) || 
                         addonIds.includes('additional_speaker') ||
                         addonIds.some(id => id.includes('cocktail')) ||
                         packageName.toLowerCase().includes('cocktail');
      services.cocktailHour = hasCocktail;
    }
    
    return services;
  };

  const toggleService = (service) => {
    // Visual feedback - briefly highlight which button was clicked
    setClickedService(service);
    setTimeout(() => setClickedService(null), 300);
    
    setSelectedServices(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
    
    // Update hasCeremonyAudio when ceremony audio is toggled
    if (service === 'ceremonyAudio') {
      setHasCeremonyAudio(!selectedServices.ceremonyAudio);
    }
    
    // Provide haptic-like feedback with toast
    toast({
      title: selectedServices[service] ? 'Service Deactivated' : 'Service Activated',
      description: `${service === 'reception' ? 'Reception' : service === 'ceremonyAudio' ? 'Ceremony Audio' : 'Cocktail Hour'} ${selectedServices[service] ? 'deactivated' : 'activated'}`,
      duration: 2000,
    });
  };

  // Handle ceremony music type change - un-skip ceremony fields and details if pre_recorded is selected
  const handleCeremonyMusicTypeChange = (value) => {
    setFormData(prev => ({ ...prev, ceremonyMusicType: value }));
    
    // If pre-recorded is selected, un-skip the ceremony fields and details steps
    if (value === 'pre_recorded') {
      setSkippedSteps(prevSkipped => {
        const newSkipped = new Set(prevSkipped);
        newSkipped.delete('ceremony_fields');
        newSkipped.delete('ceremony_details');
        return newSkipped;
      });
    } else {
      // If not pre-recorded, skip ceremony fields and details
      setSkippedSteps(prevSkipped => {
        const newSkipped = new Set(prevSkipped);
        newSkipped.add('ceremony_fields');
        newSkipped.add('ceremony_details');
        return newSkipped;
      });
    }
  };

  // Get the actual step index in the filtered steps array
  const getActualStepIndex = (stepId) => {
    return steps.findIndex(s => s.id === stepId);
  };

  // Get step ID from actual step index
  const getStepIdFromIndex = (index) => {
    return steps[index]?.id;
  };

  const nextStep = () => {
    const currentStepData = steps[currentStep];
    
    // Skip special dance songs step if no special dances selected
    if (currentStepData?.id === 'special_dances' && formData.specialDances.length === 0) {
      const specialDanceSongsIndex = steps.findIndex(s => s.id === 'special_dance_songs');
      if (specialDanceSongsIndex !== -1) {
        setSkippedSteps(prev => new Set([...prev, 'special_dance_songs']));
      }
      const playlistsIndex = steps.findIndex(s => s.id === 'playlists');
      if (playlistsIndex !== -1) {
        setCurrentStep(playlistsIndex);
        return;
      }
    }
    
    // Skip ceremony fields and details if not pre-recorded (only if ceremony audio is selected)
    if (selectedServices.ceremonyAudio && currentStepData?.id === 'ceremony_type' && formData.ceremonyMusicType !== 'pre_recorded') {
      const ceremonyFieldsIndex = steps.findIndex(s => s.id === 'ceremony_fields');
      if (ceremonyFieldsIndex !== -1) {
        setSkippedSteps(prev => new Set([...prev, 'ceremony_fields']));
      }
      const ceremonyDetailsIndex = steps.findIndex(s => s.id === 'ceremony_details');
      if (ceremonyDetailsIndex !== -1) {
        setSkippedSteps(prev => new Set([...prev, 'ceremony_details']));
      }
      const reviewIndex = steps.findIndex(s => s.id === 'review');
      if (reviewIndex !== -1) {
        setCurrentStep(reviewIndex);
        return;
      }
    }
    
    // Skip ceremony details if no ceremony fields selected
    if (selectedServices.ceremonyAudio && currentStepData?.id === 'ceremony_fields' && (!formData.selectedCeremonyFields || formData.selectedCeremonyFields.length === 0)) {
      const ceremonyDetailsIndex = steps.findIndex(s => s.id === 'ceremony_details');
      if (ceremonyDetailsIndex !== -1) {
        setSkippedSteps(prev => new Set([...prev, 'ceremony_details']));
      }
      const reviewIndex = steps.findIndex(s => s.id === 'review');
      if (reviewIndex !== -1) {
        setCurrentStep(reviewIndex);
        return;
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    const currentStepData = steps[currentStep];
    
    // Skip special dance songs step if no special dances selected
    if (currentStepData?.id === 'playlists' && formData.specialDances.length === 0) {
      const specialDancesIndex = steps.findIndex(s => s.id === 'special_dances');
      if (specialDancesIndex !== -1) {
        setCurrentStep(specialDancesIndex);
        return;
      }
    }
    
    // Skip ceremony fields and details if not pre-recorded (only if ceremony audio is selected)
    if (selectedServices.ceremonyAudio && currentStepData?.id === 'review' && formData.ceremonyMusicType !== 'pre_recorded') {
      const ceremonyTypeIndex = steps.findIndex(s => s.id === 'ceremony_type');
      if (ceremonyTypeIndex !== -1) {
        setCurrentStep(ceremonyTypeIndex);
        return;
      }
    }
    
    // Skip ceremony details if no ceremony fields selected
    if (selectedServices.ceremonyAudio && currentStepData?.id === 'review' && (!formData.selectedCeremonyFields || formData.selectedCeremonyFields.length === 0)) {
      const ceremonyFieldsIndex = steps.findIndex(s => s.id === 'ceremony_fields');
      if (ceremonyFieldsIndex !== -1) {
        setCurrentStep(ceremonyFieldsIndex);
        return;
      }
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
          ...formData,
          isComplete: true // Mark as complete when submitted
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
    // Navigate to the appropriate step by finding the step ID
    const stepIdMap = {
      'bigNoSongs': 'big_no',
      'specialDances': 'special_dances',
      'specialDanceSongs': 'special_dance_songs',
      'mcIntroduction': 'mc_introduction',
      'playlists': 'playlists',
      'ceremonyType': 'ceremony_type',
      'ceremonyDetails': 'ceremony_details'
    };
    const targetStepId = stepIdMap[section];
    if (targetStepId) {
      const stepIndex = steps.findIndex(s => s.id === targetStepId);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
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

  // Start Over function - clears all data and resets form
  const handleStartOver = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to start over? This will clear all your previous selections and cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      setSaving(true);
      
      // Clear localStorage
      localStorage.removeItem(`questionnaire_${id}`);
      
      // Clear database by saving empty data
      await fetch('/api/questionnaire/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: id,
          bigNoSongs: '',
          specialDances: [],
          specialDanceSongs: {},
          playlistLinks: {
            ceremony: '',
            cocktail: '',
            reception: ''
          },
          ceremonyMusicType: '',
          ceremonyMusic: {}
        })
      });
      
      // Reset form state (but keep event details from leadData)
      setFormData({
        eventDate: leadData?.eventDate ? leadData.eventDate.split('T')[0] : '',
        venueName: leadData?.venueName || leadData?.location || '',
        guestCount: leadData?.guestCount || '',
        bigNoSongs: '',
        specialDances: [],
        specialDanceSongs: {},
        playlistLinks: {
          ceremony: '',
          cocktail: '',
          reception: ''
        },
        ceremonyMusicType: '',
        selectedCeremonyFields: [],
        ceremonyMusic: {},
        vibe: '',
        importedPlaylists: {}
      });
      
      // Reset step and skipped steps
      setCurrentStep(0);
      setSkippedSteps(new Set());
      setAutoSaveStatus(null);
      
      toast({
        title: 'Started Over',
        description: 'All your previous selections have been cleared. You can start fresh!'
      });
    } catch (error) {
      console.error('Error starting over:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

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
    if (!step) return false;
    
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
    if (step.id === 'ceremony_type' && selectedServices.ceremonyAudio) {
      return formData.ceremonyMusicType !== '';
    }
    if (step.id === 'ceremony_fields' && selectedServices.ceremonyAudio) {
      return true; // Can proceed with none selected
    }
    if (step.id === 'ceremony_details' && selectedServices.ceremonyAudio) {
      return true; // Optional step
    }
    if (step.id === 'playlists') {
      return true; // Optional - can skip if no playlists
    }
    return true;
  };

  // Ensure currentStep is valid after filtering (must be before early returns)
  useEffect(() => {
    if (steps.length > 0 && currentStep >= steps.length) {
      setCurrentStep(0);
    }
  }, [steps.length, currentStep]);

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
          <div className="space-y-3">
            <Link href={`/quote/${id}/my-songs`}>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-base py-6 flex items-center justify-center gap-2">
                <Music className="w-5 h-5" />
                View & Edit My Songs
              </Button>
            </Link>
            <Link href={`/quote/${id}/confirmation`}>
              <Button variant="outline" className="w-full text-base py-6 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                Continue to Confirmation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  
  // Safety check - if no step data, show loading
  if (!currentStepData || steps.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Music Planning Questionnaire | M10 DJ Company</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <style jsx global>{`
          * {
            box-sizing: border-box;
          }
          html {
            margin: 0 !important;
            padding: 0 !important;
            height: 100%;
            overflow-x: hidden;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden;
            height: 100%;
            position: relative;
            background: linear-gradient(to bottom right, #faf5ff, #ffffff, #fdf2f8) !important;
          }
          body.dark {
            background: linear-gradient(to bottom right, #111827, #1f2937, #111827) !important;
          }
          #__next {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 100vh;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </Head>
      
      <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" style={{ margin: 0, padding: 0, position: 'absolute', top: 0, left: 0, right: 0, width: '100%' }}>
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-50" style={{ margin: 0, padding: 0, top: 0 }}>
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        {/* Sticky Header Section */}
        <div className="sticky top-0 z-40 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" style={{ marginTop: '1px' }}>
          <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-2 sm:pb-4" style={{ paddingTop: '8px' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <Link 
                href={`/quote/${id}/confirmation`}
                className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Confirmation
              </Link>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-green-600 dark:text-green-400">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Saved</span>
                  </div>
                )}
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Step {currentStep + 1} of {steps.length}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStartOver}
                  disabled={saving}
                  className="text-xs sm:text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 animate-spin" />
                      <span className="hidden sm:inline">Clearing...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                      <span>Start Over</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Visual Step Indicator */}
            <div className="mb-4 sm:mb-6" role="region" aria-label="Questionnaire progress">
              <div 
                ref={stepIndicatorRef} 
                className="flex items-center overflow-x-auto pb-2 -mx-3 sm:mx-0 px-6 sm:px-0 scrollbar-hide snap-x snap-mandatory"
                role="progressbar"
                aria-valuenow={currentStep + 1}
                aria-valuemin={1}
                aria-valuemax={steps.length}
                aria-label={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]?.title || 'Questionnaire'}`}
              >
              <div className="flex items-center sm:justify-between gap-1 sm:gap-2">
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isSkipped = skippedSteps.has(step.id);
                  const isCompleted = index < currentStep && !isSkipped;
                  const StepIcon = step.icon;
                  
                  return (
                    <div key={step.id} data-step-index={index} className="flex items-center flex-shrink-0 snap-start min-w-[20%] sm:min-w-0">
                      <div className="flex flex-col items-center w-full">
                        <div className={`${isActive ? 'p-1' : ''}`}>
                          <button
                            onClick={() => {
                              if (index < currentStep || index === currentStep) {
                                // If navigating to a skipped step, un-skip it
                                if (skippedSteps.has(step.id)) {
                                  setSkippedSteps(prev => {
                                    const newSkipped = new Set(prev);
                                    newSkipped.delete(step.id);
                                    return newSkipped;
                                  });
                                }
                                setCurrentStep(index);
                              }
                            }}
                            className={`flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                              isActive
                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white scale-110'
                                : isSkipped
                                ? 'bg-yellow-500 text-white'
                                : isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            } ${index <= currentStep ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                            disabled={index > currentStep}
                            aria-label={`${isActive ? 'Current step' : isCompleted ? 'Completed' : isSkipped ? 'Skipped' : 'Not started'}: Step ${index + 1} of ${steps.length} - ${step.title}`}
                            aria-current={isActive ? 'step' : undefined}
                            type="button"
                          >
                          {isSkipped ? (
                            <span className="text-[9px] sm:text-xs font-semibold">Skip</span>
                          ) : isCompleted ? (
                            <CheckCircle className="w-5 h-5 sm:w-5 sm:h-5" />
                          ) : (
                            <StepIcon className="w-5 h-5 sm:w-5 sm:h-5" />
                          )}
                        </button>
                        </div>
                        <span className={`mt-1 sm:mt-2 text-[10px] sm:text-xs text-center max-w-[60px] sm:max-w-[80px] truncate px-0.5 ${
                          isActive
                            ? 'text-purple-600 dark:text-purple-400 font-semibold'
                            : isSkipped
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : isCompleted
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-shrink-0 h-0.5 mx-0.5 sm:mx-2 sm:flex-1 hidden sm:block ${
                          isSkipped 
                            ? 'bg-yellow-500' 
                            : isCompleted 
                            ? 'bg-green-500' 
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`} style={{ minWidth: '12px' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-20 sm:pb-6 sm:pb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12">
            {/* Step Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-3 sm:mb-4">
                <currentStepData.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {currentStepData.title}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 px-2">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Content */}
            <div ref={stepContentRef} className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              {/* Welcome Step */}
              {steps[currentStep]?.id === 'welcome' && (
                <div className="text-center py-4 sm:py-8">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent px-2">
                    Help us create the perfect soundtrack for your day
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-2">
                    {getGreeting()}
                  </p>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-2">
                    {questionnaireConfig.welcomeMessage || "Let's plan the perfect music for your event!"}
                  </p>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 px-2">
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
                      placeholder={questionnaireConfig.vibePlaceholder || "Describe your event in 3 words (e.g., fun, elegant, energetic)"}
                      className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Event Details Step - Quick Confirmation */}
              {steps[currentStep]?.id === 'event_details' && (
                <div className="space-y-3 sm:space-y-6">
                  <div className="mb-2 sm:mb-4 p-2 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                      <strong>Event Details:</strong> Your event information is confirmed. These details cannot be changed here.
                    </p>
                  </div>
                  
                  {/* Compact Grid Layout for Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    {/* Event Date - Read Only */}
                    <div>
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                        Wedding Date
                      </label>
                      <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                        {formData.eventDate || (leadData?.eventDate ? new Date(leadData.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set')}
                      </div>
                    </div>

                    {/* Venue Name - Read Only */}
                    <div>
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                        Venue Name
                      </label>
                      <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                        {formData.venueName || leadData?.venueName || leadData?.venue_address || leadData?.location || 'Not set'}
                      </div>
                    </div>

                    {/* Helper function to format time */}
                    {(() => {
                      const formatTime = (timeStr) => {
                        if (!timeStr) return null;
                        try {
                          // Handle different time formats
                          let formatted = timeStr;
                          if (!formatted.includes(':')) {
                            // Format like "1400" -> "14:00"
                            if (formatted.length === 4) {
                              formatted = `${formatted.slice(0, 2)}:${formatted.slice(2)}`;
                            }
                          }
                          const [hours, minutes = '00'] = formatted.split(':');
                          const hour24 = parseInt(hours);
                          if (isNaN(hour24)) return null;
                          const hour12 = hour24 % 12 || 12;
                          const ampm = hour24 >= 12 ? 'PM' : 'AM';
                          return `${hour12}:${minutes.padStart(2, '0')} ${ampm}`;
                        } catch {
                          return null;
                        }
                      };

                      // Get all available times
                      const eventTime = formData.eventTime || leadData?.eventTime;
                      const endTime = formData.endTime || leadData?.endTime;
                      const grandEntrance = leadData?.grandEntranceTime;
                      const grandExit = leadData?.grandExitTime;
                      
                      // Determine which times to show based on available data and selected services
                      // If grand entrance/exit exist, those are the reception times
                      // If ceremony audio is selected and we have grand entrance/exit, 
                      // then event_time/end_time are likely ceremony times
                      const hasGrandEntrance = !!grandEntrance;
                      const hasGrandExit = !!grandExit;
                      const hasReceptionTimes = hasGrandEntrance || hasGrandExit;
                      
                      // Ceremony times: If ceremony audio is selected and we have reception times,
                      // assume event_time/end_time are ceremony times
                      const ceremonyStart = selectedServices.ceremonyAudio && hasReceptionTimes ? eventTime : null;
                      const ceremonyEnd = selectedServices.ceremonyAudio && hasReceptionTimes ? endTime : null;
                      
                      // Reception times: Use grand entrance/exit if available, otherwise fallback to event_time/end_time
                      const receptionStart = grandEntrance || (!hasReceptionTimes && selectedServices.reception ? eventTime : null);
                      const receptionEnd = grandExit || (!hasReceptionTimes && selectedServices.reception ? endTime : null);
                      
                      // Cocktail hour: Show if cocktail hour service is selected and we have both ceremony end and reception start
                      const cocktailStart = selectedServices.cocktailHour && ceremonyEnd ? ceremonyEnd : null;
                      const cocktailEnd = selectedServices.cocktailHour && receptionStart ? receptionStart : null;

                      return (
                        <>
                          {/* Ceremony Start */}
                          {selectedServices.ceremonyAudio && ceremonyStart && (
                            <div>
                              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                Ceremony Start
                              </label>
                              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                                {formatTime(ceremonyStart) || 'Not set'}
                              </div>
                            </div>
                          )}

                          {/* Ceremony End */}
                          {selectedServices.ceremonyAudio && ceremonyEnd && (
                            <div>
                              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                Ceremony End
                              </label>
                              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                                {formatTime(ceremonyEnd) || 'Not set'}
                              </div>
                            </div>
                          )}

                          {/* Cocktail Hour */}
                          {selectedServices.cocktailHour && cocktailStart && cocktailEnd && (
                            <div>
                              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                Cocktail Hour
                              </label>
                              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                                {formatTime(cocktailStart)} - {formatTime(cocktailEnd)}
                              </div>
                            </div>
                          )}

                          {/* Reception Start */}
                          {selectedServices.reception && receptionStart && (
                            <div>
                              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                Reception Start
                              </label>
                              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                                {formatTime(receptionStart) || 'Not set'}
                              </div>
                            </div>
                          )}

                          {/* Reception End */}
                          {selectedServices.reception && receptionEnd && (
                            <div>
                              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                Reception End
                              </label>
                              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                                {formatTime(receptionEnd) || 'Not set'}
                              </div>
                            </div>
                          )}

                          {/* Fallback: Show generic Start/End Time if no services are selected or times don't match service structure */}
                          {!selectedServices.ceremonyAudio && !selectedServices.reception && eventTime && (
                            <div>
                              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                Start Time
                              </label>
                              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                                {formatTime(eventTime) || 'Not set'}
                              </div>
                            </div>
                          )}

                          {!selectedServices.ceremonyAudio && !selectedServices.reception && endTime && (
                            <div>
                              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                End Time
                              </label>
                              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                                {formatTime(endTime) || 'Not set'}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Services Provided - Interactive Buttons */}
                  <div className="mt-3 sm:mt-4">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      M10 Services
                    </label>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-4">
                      Click to activate or deactivate services. This helps us show you the right questions.
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => toggleService('reception')}
                        className={`relative px-2 sm:px-4 py-2 sm:py-4 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm font-medium min-h-[60px] sm:min-h-[80px] flex flex-col items-center justify-center gap-1 sm:gap-2 transform hover:scale-105 active:scale-95 cursor-pointer touch-manipulation ${
                          selectedServices.reception
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-purple-600 dark:border-purple-500 shadow-lg shadow-purple-500/40 ring-2 ring-purple-300 dark:ring-purple-700 ring-offset-2'
                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:shadow-md hover:text-purple-700 dark:hover:text-purple-300'
                        } ${clickedService === 'reception' ? 'animate-pulse' : ''}`}
                      >
                        {selectedServices.reception ? (
                          <>
                            <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 animate-in zoom-in duration-200" />
                            <span className="font-semibold text-xs sm:text-base">Reception</span>
                            <span className="text-[9px] sm:text-xs opacity-90 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse" />
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center transition-all group-hover:border-purple-500 group-hover:scale-110">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-transparent group-hover:bg-purple-500 transition-all duration-200" />
                            </div>
                            <span className="font-medium text-xs sm:text-sm">Reception</span>
                            <span className="text-[9px] sm:text-xs opacity-70">Tap</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleService('ceremonyAudio')}
                        className={`relative px-2 sm:px-4 py-2 sm:py-4 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm font-medium min-h-[60px] sm:min-h-[80px] flex flex-col items-center justify-center gap-1 sm:gap-2 transform hover:scale-105 active:scale-95 cursor-pointer touch-manipulation ${
                          selectedServices.ceremonyAudio
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-purple-600 dark:border-purple-500 shadow-lg shadow-purple-500/40 ring-2 ring-purple-300 dark:ring-purple-700 ring-offset-2'
                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:shadow-md hover:text-purple-700 dark:hover:text-purple-300'
                        } ${clickedService === 'ceremonyAudio' ? 'animate-pulse' : ''}`}
                      >
                        {selectedServices.ceremonyAudio ? (
                          <>
                            <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 animate-in zoom-in duration-200" />
                            <span className="font-semibold text-xs sm:text-base">Ceremony</span>
                            <span className="text-[9px] sm:text-xs opacity-90 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse" />
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center transition-all group-hover:border-purple-500 group-hover:scale-110">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-transparent group-hover:bg-purple-500 transition-all duration-200" />
                            </div>
                            <span className="font-medium text-xs sm:text-sm">Ceremony</span>
                            <span className="text-[9px] sm:text-xs opacity-70">Tap</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleService('cocktailHour')}
                        className={`relative px-2 sm:px-4 py-2 sm:py-4 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm font-medium min-h-[60px] sm:min-h-[80px] flex flex-col items-center justify-center gap-1 sm:gap-2 transform hover:scale-105 active:scale-95 cursor-pointer touch-manipulation ${
                          selectedServices.cocktailHour
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-purple-600 dark:border-purple-500 shadow-lg shadow-purple-500/40 ring-2 ring-purple-300 dark:ring-purple-700 ring-offset-2'
                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:shadow-md hover:text-purple-700 dark:hover:text-purple-300'
                        } ${clickedService === 'cocktailHour' ? 'animate-pulse' : ''}`}
                      >
                        {selectedServices.cocktailHour ? (
                          <>
                            <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 animate-in zoom-in duration-200" />
                            <span className="font-semibold text-xs sm:text-base">Cocktail</span>
                            <span className="text-[9px] sm:text-xs opacity-90 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse" />
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center transition-all group-hover:border-purple-500 group-hover:scale-110">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-transparent group-hover:bg-purple-500 transition-all duration-200" />
                            </div>
                            <span className="font-medium text-xs sm:text-sm">Cocktail</span>
                            <span className="text-[9px] sm:text-xs opacity-70">Tap</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-4 text-center">
                      {selectedServices.reception || selectedServices.ceremonyAudio || selectedServices.cocktailHour 
                        ? '✓ Services selected'
                        : '👆 Tap to activate'}
                    </p>
                  </div>

                  {/* Guest Count - Only show if we already have the data */}
                  {(formData.guestCount || leadData?.guestCount) && (
                    <div className="mt-2 sm:mt-4">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                        Approximate Guest Count
                      </label>
                      <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                        {formData.guestCount || leadData?.guestCount || 'Not set'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Big No Songs */}
              {steps[currentStep]?.id === 'big_no' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                    Songs We&apos;ll Happily Skip
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </label>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 italic">
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
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  />
                  <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    You can list multiple songs, one per line or separated by commas.
                  </p>
                </div>
              )}

              {/* Special Dances Selection */}
              {steps[currentStep]?.id === 'special_dances' && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Check all that apply:
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {specialDanceOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.specialDances.includes(option.id)}
                          onChange={() => handleSpecialDanceToggle(option.id)}
                          className="w-5 h-5 min-w-[20px] min-h-[20px] text-purple-600 focus:ring-purple-500 rounded cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                              {option.label}
                            </span>
                            {/* Desktop: Tooltip on hover */}
                            <div className="hidden sm:block">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-help flex-shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm">{option.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            {/* Mobile: Show info icon that's always visible */}
                            <div className="sm:hidden">
                              <HelpCircle className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                            </div>
                          </div>
                          {/* Mobile: Always show tooltip text below label */}
                          <p className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            {option.tooltip}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {formData.specialDances.length === 0 && (
                    <p className="mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
                      No special dances? That&apos;s perfectly fine! You can skip the next step.
                    </p>
                  )}
                </div>
              )}

              {/* Special Dance Songs */}
              {steps[currentStep]?.id === 'special_dance_songs' && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                    Please give us the song names for all special dances below. It is not required to have a song for each category — just leave it blank if the category doesn&apos;t apply.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 italic">
                    Please include the artist name, or you can copy and paste song links. Not sure about a song yet? That&apos;s OK — you can always update this later!
                  </p>
                  <div className="space-y-3 sm:space-y-4">
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
                            onBlur={(e) => handleSongInputBlur(danceId, e.target.value, 'specialDance')}
                            placeholder="Track Name - Artist Name (or paste a Spotify/Apple Music/YouTube link)"
                            className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                            Format: &quot;Song Name - Artist Name&quot; or paste a link. We&apos;ll format it automatically.
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MC Introduction */}
              {steps[currentStep]?.id === 'mc_introduction' && (
                <div className="space-y-4 sm:space-y-6">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    How would you like the MC to introduce you? You can use our template, write your own, or decline an introduction.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Option 1: Fill in the blank */}
                    <div className="p-4 border-2 border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Option 1: Fill in the blank
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-700 dark:text-gray-300">Allow me to introduce to you for the very first time</span>
                        <input
                          type="text"
                          value={(() => {
                            if (!formData.mcIntroduction || formData.mcIntroduction === '') return '';
                            if (formData.mcIntroduction.startsWith('Allow me to introduce to you for the very first time ')) {
                              return formData.mcIntroduction.replace('Allow me to introduce to you for the very first time ', '').replace('!', '');
                            }
                            return '';
                          })()}
                          onChange={(e) => {
                            const name = e.target.value.trim();
                            if (name) {
                              setFormData(prev => ({
                                ...prev,
                                mcIntroduction: `Allow me to introduce to you for the very first time ${name}!`
                              }));
                            } else if (formData.mcIntroduction && formData.mcIntroduction.startsWith('Allow me to introduce')) {
                              setFormData(prev => ({
                                ...prev,
                                mcIntroduction: null
                              }));
                            }
                          }}
                          placeholder="Your names here"
                          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-gray-700 dark:text-gray-300">!</span>
                      </div>
                    </div>

                    {/* Option 2: Write your own */}
                    <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Option 2: Write your own introduction
                      </label>
                      <textarea
                        value={(() => {
                          if (!formData.mcIntroduction || formData.mcIntroduction === '') return '';
                          if (formData.mcIntroduction.startsWith('Allow me to introduce to you for the very first time ')) {
                            return '';
                          }
                          return formData.mcIntroduction;
                        })()}
                        onChange={(e) => {
                          const custom = e.target.value.trim();
                          if (custom) {
                            setFormData(prev => ({
                              ...prev,
                              mcIntroduction: custom
                            }));
                          } else if (formData.mcIntroduction && !formData.mcIntroduction.startsWith('Allow me to introduce')) {
                            setFormData(prev => ({
                              ...prev,
                              mcIntroduction: null
                            }));
                          }
                        }}
                        placeholder="Write your custom introduction here..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                        Write exactly how you&apos;d like to be introduced. Leave blank to use the template above.
                      </p>
                    </div>

                    {/* Option 3: Decline */}
                    <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.mcIntroduction === ''}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                mcIntroduction: ''
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                mcIntroduction: null
                              }));
                            }
                          }}
                          className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Decline MC introduction (skip this entirely)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Preview */}
                  {formData.mcIntroduction !== null && formData.mcIntroduction !== '' && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                      <p className="text-base text-gray-900 dark:text-white italic">
                        &quot;{formData.mcIntroduction}&quot;
                      </p>
                    </div>
                  )}

                  {formData.mcIntroduction === '' && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        ✓ MC introduction declined. No introduction will be made.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Playlist Links */}
              {steps[currentStep]?.id === 'playlists' && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Have a playlist already started? We love it! Add any links to Spotify, Apple Music or Tidal playlists below.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 italic">
                    Don&apos;t have playlists yet? No worries — we&apos;ll create something amazing based on your preferences!
                  </p>
                  <div className="mb-4 sm:mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={nextStep}
                      className="w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      I don&apos;t have playlists — skip this step
                    </Button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {(() => {
                      // Only show playlist fields for selected services
                      const playlistTypes = [];
                      if (selectedServices.reception) playlistTypes.push('reception');
                      if (selectedServices.ceremonyAudio) playlistTypes.push('ceremony');
                      if (selectedServices.cocktailHour) playlistTypes.push('cocktail');
                      
                      return playlistTypes.map((type) => {
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
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="url"
                              value={value}
                              onChange={(e) => handlePlaylistLinkChange(type, e.target.value)}
                              placeholder="https://open.spotify.com/playlist/..."
                              className={`flex-1 px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
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
                                className="whitespace-nowrap min-h-[44px] sm:min-h-0"
                              >
                                {isImporting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    <span className="hidden sm:inline">Importing...</span>
                                    <span className="sm:hidden">Importing</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Import Songs</span>
                                    <span className="sm:hidden">Import</span>
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
                      });
                    })()}
                  </div>
                  {!selectedServices.reception && !selectedServices.ceremonyAudio && !selectedServices.cocktailHour && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        No services selected above. Please select at least one service to see playlist options.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Ceremony Music Type */}
              {steps[currentStep]?.id === 'ceremony_type' && selectedServices.ceremonyAudio && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    What type of music will be played during your ceremony?
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { value: 'pre_recorded', label: 'Pre-recorded Music' },
                      { value: 'live_musician', label: 'Live Musician' },
                      { value: 'both', label: 'Both' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors min-h-[44px]"
                      >
                        <input
                          type="radio"
                          name="ceremonyMusicType"
                          value={option.value}
                          checked={formData.ceremonyMusicType === option.value}
                          onChange={(e) => handleCeremonyMusicTypeChange(e.target.value)}
                          className="w-5 h-5 min-w-[20px] min-h-[20px] text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0"
                        />
                        <span className="ml-3 text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Ceremony Music Selection */}
              {steps[currentStep]?.id === 'ceremony_fields' && selectedServices.ceremonyAudio && formData.ceremonyMusicType === 'pre_recorded' && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Check all that apply:
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {ceremonyMusicFields.map((field) => (
                      <label
                        key={field.id}
                        className="flex items-start p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedCeremonyFields?.includes(field.id) || false}
                          onChange={() => handleCeremonyFieldToggle(field.id)}
                          className="w-5 h-5 min-w-[20px] min-h-[20px] text-purple-600 focus:ring-purple-500 rounded cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                              {field.label}
                            </span>
                          </div>
                          {/* Mobile: Always show description */}
                          <p className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            {field.description}
                          </p>
                          {/* Desktop: Show description on hover via tooltip */}
                          <div className="hidden sm:block">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                              {field.description}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {(!formData.selectedCeremonyFields || formData.selectedCeremonyFields.length === 0) && (
                    <p className="mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
                      No ceremony music fields selected? That&apos;s perfectly fine! You can skip the next step.
                    </p>
                  )}
                </div>
              )}

              {/* Ceremony Music Details */}
              {steps[currentStep]?.id === 'ceremony_details' && selectedServices.ceremonyAudio && formData.ceremonyMusicType === 'pre_recorded' && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                    Please give us the song names for the ceremony music moments you selected below. It is not required to have a song for each category — just leave it blank if you&apos;re not sure yet.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 italic">
                    Please include the artist name, or you can copy and paste song links. Not sure about a song yet? That&apos;s OK — you can always update this later!
                  </p>
                  <div className="space-y-3 sm:space-y-4">
                    {formData.selectedCeremonyFields?.map((fieldId) => {
                      const field = ceremonyMusicFields.find(f => f.id === fieldId);
                      if (!field) return null;
                      return (
                        <div key={fieldId}>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                          </label>
                          {field.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
                              {field.description}
                            </p>
                          )}
                          <input
                            type="text"
                            value={formData.ceremonyMusic[fieldId] || ''}
                            onChange={(e) => handleCeremonyMusicChange(fieldId, e.target.value)}
                            onBlur={(e) => handleSongInputBlur(fieldId, e.target.value, 'ceremony')}
                            placeholder="Track Name - Artist Name (or paste a Spotify/Apple Music/YouTube link)"
                            className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                            Format: &quot;Song Name - Artist Name&quot; or paste a link. We&apos;ll format it automatically.
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Review Step */}
              {steps[currentStep]?.id === 'review' && (
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

                  {/* MC Introduction */}
                  {formData.mcIntroduction !== null && formData.mcIntroduction !== undefined && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 relative">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          MC Introduction
                        </h3>
                        <button
                          onClick={() => handleEditSection('mcIntroduction')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                      {formData.mcIntroduction === '' ? (
                        <p className="text-gray-500 dark:text-gray-400 italic">MC introduction declined</p>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 italic">
                          &quot;{formData.mcIntroduction}&quot;
                        </p>
                      )}
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

                  {/* Ceremony Music - Only show if ceremony audio was purchased */}
                  {selectedServices.ceremonyAudio && formData.ceremonyMusicType && (
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

                  {selectedServices.ceremonyAudio && Object.keys(formData.ceremonyMusic).length > 0 && (
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
            <div className="fixed bottom-0 left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg sm:shadow-none z-40 px-3 sm:px-0 py-3 sm:py-0 sm:mt-6 sm:mt-8 sm:pt-6 sm:pt-8">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 min-h-[44px] text-sm sm:text-base text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </button>

              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center justify-center px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 min-h-[44px] text-sm sm:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg touch-manipulation flex-1 sm:flex-initial"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Saving...</span>
                      <span className="sm:hidden">Saving</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Lock In My Music & Get My Custom Preview</span>
                      <span className="sm:hidden">Lock In Music</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center justify-center px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 min-h-[44px] text-sm sm:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg touch-manipulation flex-1 sm:flex-initial"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </TooltipProvider>
    </>
  );
}

