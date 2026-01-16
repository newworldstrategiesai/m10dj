import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import QuoteBottomNav from '../../../components/quote/QuoteBottomNav';
import { Music, Heart, Radio, Link as LinkIcon, ArrowLeft, Loader2, CheckCircle, FileText, Calendar, MapPin, Users, Edit2, Save, X, Check, ChevronDown, ChevronUp, Clock, Sparkles, ExternalLink, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Badge } from '@/components/ui/badge';
import { normalizeSongInput, cleanSongInput } from '../../../utils/song-normalizer';

// Helper function to format date without timezone conversion issues
// Parses YYYY-MM-DD strings as local dates to prevent day shifting
const formatEventDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    // If it's a date string in YYYY-MM-DD format, parse it as local date
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const datePart = dateStr.split('T')[0]; // Remove time if present
      const [year, month, day] = datePart.split('-');
      // Create date in local timezone, not UTC (prevents day from shifting)
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    // Fallback for other date formats
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return '';
  }
};

export default function MySongsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [youtubeVideos, setYoutubeVideos] = useState({}); // Store video IDs by song key
  const [loadingVideos, setLoadingVideos] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [questionnaireResponse, leadResponse] = await Promise.all([
        fetch(`/api/questionnaire/get?leadId=${id}`),
        fetch(`/api/leads/get-lead?id=${id}`)
      ]);

      if (questionnaireResponse.ok) {
        const questionnaireResult = await questionnaireResponse.json();
        if (questionnaireResult.success) {
          setQuestionnaireData(questionnaireResult.data);
          setEditingData(questionnaireResult.data);
        } else {
          setError('Questionnaire not found. Please complete the music questionnaire first.');
        }
      } else if (questionnaireResponse.status === 404) {
        setError('Questionnaire not found. Please complete the music questionnaire first.');
      } else {
        setError('Failed to load questionnaire data.');
      }

      if (leadResponse.ok) {
        const lead = await leadResponse.json();
        setLeadData(lead);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingData) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/questionnaire/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: id,
          bigNoSongs: editingData.bigNoSongs || '',
          specialDances: editingData.specialDances || [],
          specialDanceSongs: editingData.specialDanceSongs || {},
          playlistLinks: editingData.playlistLinks || {},
          ceremonyMusicType: editingData.ceremonyMusicType || '',
          ceremonyMusic: editingData.ceremonyMusic || {},
          mcIntroduction: editingData.mcIntroduction !== undefined ? editingData.mcIntroduction : null
        })
      });

      if (response.ok) {
        const result = await response.json();
        setQuestionnaireData(editingData);
        setEditingSection(null);
        toast({
          title: 'Success!',
          description: 'Your music preferences have been updated.',
        });
        // Refresh data to get updated timestamp
        fetchData();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingData(questionnaireData);
    setEditingSection(null);
  };

  // Normalize song input on blur
  const handleSongInputBlur = async (fieldId, value, type = 'specialDance') => {
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
        setEditingData(prev => ({
          ...prev,
          specialDanceSongs: {
            ...prev.specialDanceSongs || {},
            [fieldId]: formatted
          }
        }));
      } else if (type === 'ceremony') {
        setEditingData(prev => ({
          ...prev,
          ceremonyMusic: {
            ...prev.ceremonyMusic || {},
            [fieldId]: formatted
          }
        }));
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

  const toggleSection = (section) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const specialDanceLabels = {
    'bridal_party_intro': 'Bridal Party Intro Song',
    'bride_groom_intro': 'Bride and Groom Introduction Song',
    'first_dance': 'Bride and Groom First Dance',
    'father_daughter': 'Father Daughter Dance',
    'mother_son': 'Mother Son Dance',
    'garter_toss': 'Garter Toss Song',
    'bouquet_toss': 'Bouquet Toss Song',
    'cake_cutting': 'Cake Cutting Song',
    'last_dance': 'Bride and Groom Last Dance of the night'
  };

  const ceremonyMusicLabels = {
    'prelude': 'Prelude',
    'interlude': 'Interlude',
    'processional': 'Processional',
    'bridal_march': 'Bridal March',
    'recessional': 'Recessional',
    'postlude': 'Postlude'
  };

  // Extract search query from song string (remove links, clean up)
  const getSongSearchQuery = (songString) => {
    if (!songString || !songString.trim()) return null;
    
    let searchQuery = songString.trim();
    
    // Remove any existing links (URLs)
    searchQuery = searchQuery.replace(/https?:\/\/[^\s]+/g, '').trim();
    
    return searchQuery;
  };

  // Fetch YouTube video for a song
  const fetchYouTubeVideo = async (songKey, songString) => {
    if (!songString || youtubeVideos[songKey]) return; // Already have video or no song
    
    const searchQuery = getSongSearchQuery(songString);
    if (!searchQuery) return;

    setLoadingVideos(prev => ({ ...prev, [songKey]: true }));
    
    try {
      const response = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.videoId) {
          setYoutubeVideos(prev => ({
            ...prev,
            [songKey]: {
              videoId: data.videoId,
              title: data.title,
              thumbnail: data.thumbnail,
              channelTitle: data.channelTitle
            }
          }));
        } else if (data.searchUrl) {
          // If API key is not available, store the search URL for manual verification
          setYoutubeVideos(prev => ({
            ...prev,
            [songKey]: {
              searchUrl: data.searchUrl,
              needsManualSearch: true
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching YouTube video:', error);
    } finally {
      setLoadingVideos(prev => {
        const newState = { ...prev };
        delete newState[songKey];
        return newState;
      });
    }
  };

  // Load YouTube videos when data is fetched
  useEffect(() => {
    if (!questionnaireData) return;

    // Load videos for special dance songs
    if (questionnaireData.specialDanceSongs) {
      Object.entries(questionnaireData.specialDanceSongs).forEach(([danceId, song]) => {
        if (song && song.trim()) {
          fetchYouTubeVideo(`specialDance_${danceId}`, song);
        }
      });
    }

    // Load videos for ceremony music
    if (questionnaireData.ceremonyMusic) {
      Object.entries(questionnaireData.ceremonyMusic).forEach(([key, song]) => {
        if (song && song.trim()) {
          fetchYouTubeVideo(`ceremony_${key}`, song);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionnaireData]);

  // Calculate summary stats
  const getSummaryStats = () => {
    if (!questionnaireData) return null;
    
    const stats = {
      songsToAvoid: questionnaireData.bigNoSongs ? questionnaireData.bigNoSongs.split('\n').filter(s => s.trim()).length : 0,
      specialDances: questionnaireData.specialDances?.length || 0,
      playlists: Object.values(questionnaireData.playlistLinks || {}).filter(link => link).length,
      ceremonySongs: Object.values(questionnaireData.ceremonyMusic || {}).filter(song => song).length
    };
    
    return stats;
  };

  // Check what information is still helpful to add
  const getMissingInfo = () => {
    if (!questionnaireData) return [];
    
    const missing = [];
    
    // Check for special dances without songs
    if (questionnaireData.specialDances && questionnaireData.specialDances.length > 0) {
      const dancesWithoutSongs = questionnaireData.specialDances.filter(danceId => {
        const song = questionnaireData.specialDanceSongs?.[danceId];
        return !song || song.trim() === '';
      });
      
      if (dancesWithoutSongs.length > 0) {
        missing.push({
          type: 'special_dance_songs',
          message: `${dancesWithoutSongs.length} special dance${dancesWithoutSongs.length > 1 ? 's' : ''} ${dancesWithoutSongs.length > 1 ? 'need' : 'needs'} a song`,
          count: dancesWithoutSongs.length,
          items: dancesWithoutSongs.map(id => specialDanceLabels[id] || id)
        });
      }
    }
    
    // Check for ceremony music type without details
    if (questionnaireData.ceremonyMusicType === 'pre_recorded') {
      const ceremonySongs = Object.values(questionnaireData.ceremonyMusic || {}).filter(song => song && song.trim() !== '');
      if (ceremonySongs.length === 0) {
        missing.push({
          type: 'ceremony_music',
          message: 'Ceremony music details would be helpful',
          count: 0
        });
      }
    }
    
    // Check for missing playlists (optional, so only suggest if they have other music info)
    const hasOtherMusic = questionnaireData.bigNoSongs || 
                         (questionnaireData.specialDances && questionnaireData.specialDances.length > 0) ||
                         questionnaireData.ceremonyMusicType;
    
    if (hasOtherMusic) {
      const playlistCount = Object.values(questionnaireData.playlistLinks || {}).filter(link => link && link.trim() !== '').length;
      if (playlistCount === 0) {
        missing.push({
          type: 'playlists',
          message: 'Playlist links would help us understand your style',
          count: 0
        });
      }
    }
    
    return missing;
  };

  const stats = getSummaryStats();
  const missingInfo = getMissingInfo();

  if (loading) {
    return (
      <>
        <Head>
          <title>My Songs | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading your music preferences...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !questionnaireData) {
    return (
      <>
        <Head>
          <title>My Songs | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <main className="section-container py-12 md:py-20">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                My Songs
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                {error}
              </p>
              <Link
                href={`/quote/${id}/questionnaire`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Music className="w-5 h-5" />
                Complete Music Questionnaire
              </Link>
            </div>
          </main>
        </div>
      </>
    );
  }

  const hasChanges = JSON.stringify(questionnaireData) !== JSON.stringify(editingData);

  return (
    <>
      <Head>
        <title>My Songs | M10 DJ Company</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

        <main className="section-container py-8 md:py-12">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <Link
                href={`/quote/${id}/confirmation`}
                className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Confirmation
              </Link>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Unsaved changes
                  </Badge>
                )}
                <Link href={`/quote/${id}/questionnaire`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit in Questionnaire</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                  My Songs
                </h1>
                {questionnaireData?.updatedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {new Date(questionnaireData.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            </div>

            {leadData && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {leadData.eventDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatEventDate(leadData.eventDate)}</span>
                  </div>
                )}
                {leadData.venueName && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{leadData.venueName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Summary Stats */}
            {stats && (stats.songsToAvoid > 0 || stats.specialDances > 0 || stats.playlists > 0 || stats.ceremonySongs > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
                {stats.songsToAvoid > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{stats.songsToAvoid}</div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Songs to Avoid</div>
                  </div>
                )}
                {stats.specialDances > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl md:text-3xl font-bold text-pink-600 dark:text-pink-400">{stats.specialDances}</div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Special Dances</div>
                  </div>
                )}
                {stats.playlists > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.playlists}</div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Playlists</div>
                  </div>
                )}
                {stats.ceremonySongs > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.ceremonySongs}</div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Ceremony Songs</div>
                  </div>
                )}
              </div>
            )}

            {/* Missing Info Indicators */}
            {missingInfo.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 md:p-5 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Helpful additions
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      These details would help us create an even better experience for your day:
                    </p>
                    <ul className="space-y-2">
                      {missingInfo.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                          <div className="flex-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.message}</span>
                            {item.items && item.items.length > 0 && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                                {item.items.slice(0, 2).join(', ')}
                                {item.items.length > 2 && ` +${item.items.length - 2} more`}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/quote/${id}/questionnaire?focused=true`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Add details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            {/* Songs to Avoid */}
            {questionnaireData?.bigNoSongs && (
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 md:p-6 cursor-pointer"
                  onClick={() => toggleSection('bigNoSongs')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Songs to Avoid</h2>
                      {stats?.songsToAvoid > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stats.songsToAvoid} song{stats.songsToAvoid !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingSection === 'bigNoSongs' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          disabled={saving}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                          }}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSection('bigNoSongs');
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {collapsedSections.has('bigNoSongs') ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                {!collapsedSections.has('bigNoSongs') && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6">
                    {editingSection === 'bigNoSongs' ? (
                      <textarea
                        value={editingData?.bigNoSongs || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, bigNoSongs: e.target.value }))}
                        className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                        rows={6}
                        placeholder="List any songs you absolutely don't want played..."
                      />
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{questionnaireData.bigNoSongs}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Special Dances */}
            {questionnaireData?.specialDances && questionnaireData.specialDances.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 md:p-6 cursor-pointer"
                  onClick={() => toggleSection('specialDances')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 md:w-6 md:h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Special Dances</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{questionnaireData.specialDances.length} dance{questionnaireData.specialDances.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingSection === 'specialDances' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          disabled={saving}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                          }}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSection('specialDances');
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {collapsedSections.has('specialDances') ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                {!collapsedSections.has('specialDances') && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6">
                    <div className="space-y-3 md:space-y-4">
                      {questionnaireData.specialDances.map((danceId) => {
                        const song = editingSection === 'specialDances' 
                          ? (editingData?.specialDanceSongs?.[danceId] || '')
                          : (questionnaireData.specialDanceSongs?.[danceId] || '');
                        return (
                          <div key={danceId} className="border-l-4 border-pink-500 pl-3 md:pl-4 py-2">
                            <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-1">
                              {specialDanceLabels[danceId] || danceId}
                            </h3>
                            {editingSection === 'specialDances' ? (
                              <input
                                type="text"
                                value={song}
                                onChange={(e) => setEditingData(prev => ({
                                  ...prev,
                                  specialDanceSongs: {
                                    ...prev.specialDanceSongs,
                                    [danceId]: e.target.value
                                  }
                                }))}
                                onBlur={(e) => handleSongInputBlur(danceId, e.target.value, 'specialDance')}
                                className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Track Name - Artist Name (or paste a link)"
                              />
                            ) : song ? (
                              <div className="flex items-start gap-3">
                                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 flex-1">{song}</p>
                                {(() => {
                                  const videoKey = `specialDance_${danceId}`;
                                  const video = youtubeVideos[videoKey];
                                  const isLoading = loadingVideos[videoKey];
                                  const searchQuery = getSongSearchQuery(song) || song;
                                  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
                                  
                                  if (isLoading) {
                                    return (
                                      <div className="flex-shrink-0 w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                      </div>
                                    );
                                  }
                                  
                                  if (video && video.videoId) {
                                    return (
                                      <a
                                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 relative w-24 h-16 rounded overflow-hidden group"
                                        title={video.title || 'Watch on YouTube'}
                                      >
                                        <img
                                          src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                                          alt={video.title || 'YouTube video'}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                              <path d="M8 5v14l11-7z"/>
                                            </svg>
                                          </div>
                                        </div>
                                      </a>
                                    );
                                  }
                                  
                                  // Show thumbnail placeholder that links to search
                                  return (
                                    <a
                                      href={searchUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0 relative w-24 h-16 rounded overflow-hidden group bg-gray-200 dark:bg-gray-700"
                                      title="Search for this song on YouTube"
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center group-hover:bg-red-700 transition-colors">
                                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate">
                                        YouTube
                                      </div>
                                    </a>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="text-sm md:text-base text-gray-400 dark:text-gray-500 italic">No song specified</p>
                                <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                                  Optional
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Playlist Links */}
            {questionnaireData?.playlistLinks && Object.values(questionnaireData.playlistLinks).some(link => link) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 md:p-6 cursor-pointer"
                  onClick={() => toggleSection('playlists')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <LinkIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Playlist Links</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stats?.playlists || 0} playlist{stats?.playlists !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingSection === 'playlists' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          disabled={saving}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                          }}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSection('playlists');
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {collapsedSections.has('playlists') ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                {!collapsedSections.has('playlists') && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6">
                    <div className="space-y-3 md:space-y-4">
                      {['ceremony', 'cocktail', 'reception'].map((type) => {
                        const labels = {
                          ceremony: 'Ceremony',
                          cocktail: 'Cocktail Hour',
                          reception: 'Reception'
                        };
                        const value = editingSection === 'playlists' 
                          ? (editingData?.playlistLinks?.[type] || '')
                          : (questionnaireData.playlistLinks?.[type] || '');
                        
                        if (!value && editingSection !== 'playlists') return null;
                        
                        return (
                          <div key={type}>
                            <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-2">{labels[type]}</h3>
                            {editingSection === 'playlists' ? (
                              <input
                                type="url"
                                value={value}
                                onChange={(e) => setEditingData(prev => ({
                                  ...prev,
                                  playlistLinks: {
                                    ...prev.playlistLinks,
                                    [type]: e.target.value
                                  }
                                }))}
                                className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="https://open.spotify.com/playlist/..."
                              />
                            ) : (
                              <a 
                                href={value} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline break-all text-sm md:text-base"
                              >
                                {value}
                              </a>
                            )}
                            {questionnaireData.importedPlaylists?.[type] && editingSection !== 'playlists' && (
                              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-xs md:text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                                  {questionnaireData.importedPlaylists[type].title} ({questionnaireData.importedPlaylists[type].count} songs)
                                </p>
                                <pre className="text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                  {questionnaireData.importedPlaylists[type].songs}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MC Introduction */}
            {questionnaireData?.mcIntroduction !== undefined && questionnaireData.mcIntroduction !== null && (
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 md:p-6 cursor-pointer"
                  onClick={() => toggleSection('mcIntroduction')}
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <Mic className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">MC Introduction</h2>
                      {questionnaireData.mcIntroduction === '' ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Declined</p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          &quot;{questionnaireData.mcIntroduction.substring(0, 50)}{questionnaireData.mcIntroduction.length > 50 ? '...' : ''}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/quote/${id}/questionnaire?focused=true`}>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </Link>
                    {collapsedSections.has('mcIntroduction') ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
                {!collapsedSections.has('mcIntroduction') && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-gray-200 dark:border-gray-700">
                    {questionnaireData.mcIntroduction === '' ? (
                      <p className="text-gray-500 dark:text-gray-400 italic py-4">MC introduction has been declined.</p>
                    ) : (
                      <div className="py-4">
                        <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 italic">
                          &quot;{questionnaireData.mcIntroduction}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Ceremony Music */}
            {questionnaireData?.ceremonyMusicType && questionnaireData.ceremonyMusicType === 'pre_recorded' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 md:p-6 cursor-pointer"
                  onClick={() => toggleSection('ceremonyMusic')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <Radio className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Ceremony Music</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {questionnaireData.ceremonyMusicType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingSection === 'ceremonyMusic' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          disabled={saving}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                          }}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSection('ceremonyMusic');
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {collapsedSections.has('ceremonyMusic') ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                {!collapsedSections.has('ceremonyMusic') && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6">
                    {editingSection === 'ceremonyMusic' ? (
                      // Edit mode: Show only selected ceremony music fields (derived from ceremonyMusic keys)
                      <div className="space-y-3 md:space-y-4">
                        {(() => {
                          // Get selected fields from ceremonyMusic keys (fields that exist in the object)
                          const selectedFields = Object.keys(questionnaireData?.ceremonyMusic || {});
                          // If no fields are selected yet, show a message
                          if (selectedFields.length === 0) {
                            return (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
                                  No ceremony music fields selected yet. Please select fields in the questionnaire first.
                                </p>
                                <Link href={`/quote/${id}/questionnaire?focused=true`}>
                                  <Button variant="outline" size="sm">
                                    Go to Questionnaire
                                  </Button>
                                </Link>
                              </div>
                            );
                          }
                          // Show only the selected fields
                          return selectedFields.map((key) => {
                            const label = ceremonyMusicLabels[key] || key;
                            const editValue = editingData?.ceremonyMusic?.[key] || '';
                            return (
                              <div key={key} className="border-l-4 border-purple-500 pl-3 md:pl-4 py-2">
                                <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-1">
                                  {label}
                                </h3>
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditingData(prev => ({
                                    ...prev,
                                    ceremonyMusic: {
                                      ...prev.ceremonyMusic || {},
                                      [key]: e.target.value
                                    }
                                  }))}
                                  onBlur={(e) => handleSongInputBlur(key, e.target.value, 'ceremony')}
                                  className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                  placeholder="Track Name - Artist Name (or paste a link)"
                                />
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : questionnaireData.ceremonyMusic && Object.keys(questionnaireData.ceremonyMusic).length > 0 ? (
                      // View mode: Show only fields with values
                      <div className="space-y-3 md:space-y-4">
                        {Object.entries(questionnaireData.ceremonyMusic).map(([key, value]) => {
                          if (!value) return null;
                          return (
                            <div key={key} className="border-l-4 border-purple-500 pl-3 md:pl-4 py-2">
                              <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-1">
                                {ceremonyMusicLabels[key] || key}
                              </h3>
                              <div className="flex items-start gap-3">
                                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 flex-1">{value}</p>
                                {(() => {
                                  const videoKey = `ceremony_${key}`;
                                  const video = youtubeVideos[videoKey];
                                  const isLoading = loadingVideos[videoKey];
                                  const searchQuery = getSongSearchQuery(value) || value;
                                  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
                                  
                                  if (isLoading) {
                                    return (
                                      <div className="flex-shrink-0 w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                      </div>
                                    );
                                  }
                                  
                                  if (video && video.videoId) {
                                    return (
                                      <a
                                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 relative w-24 h-16 rounded overflow-hidden group"
                                        title={video.title || 'Watch on YouTube'}
                                      >
                                        <img
                                          src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                                          alt={video.title || 'YouTube video'}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                              <path d="M8 5v14l11-7z"/>
                                            </svg>
                                          </div>
                                        </div>
                                      </a>
                                    );
                                  }
                                  
                                  // Show thumbnail placeholder that links to search
                                  return (
                                    <a
                                      href={searchUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0 relative w-24 h-16 rounded overflow-hidden group bg-gray-200 dark:bg-gray-700"
                                      title="Search for this song on YouTube"
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center group-hover:bg-red-700 transition-colors">
                                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate">
                                        YouTube
                                      </div>
                                    </a>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : questionnaireData.ceremonyMusicType === 'pre_recorded' ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
                          No ceremony songs specified yet
                        </p>
                        <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                          Optional
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!questionnaireData?.bigNoSongs && 
             (!questionnaireData?.specialDances || questionnaireData.specialDances.length === 0) &&
             (!questionnaireData?.playlistLinks || !Object.values(questionnaireData.playlistLinks).some(link => link)) &&
             !questionnaireData?.ceremonyMusicType && (
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl p-6 md:p-8 text-center">
                <Music className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Music Preferences Yet</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Complete the music questionnaire to see your song preferences here.
                </p>
                <Link href={`/quote/${id}/questionnaire`}>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Music className="w-5 h-5 mr-2" />
                    Complete Music Questionnaire
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
        <QuoteBottomNav quoteId={id} />
      </div>
    </>
  );
}
