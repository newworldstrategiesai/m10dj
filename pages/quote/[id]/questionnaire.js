import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle, Music, Heart, Mic, Radio, Link as LinkIcon, Save, Loader2, Sparkles } from 'lucide-react';

export default function MusicQuestionnaire() {
  const router = useRouter();
  const { id } = router.query;
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
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
  });
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

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

  const specialDanceOptions = [
    { id: 'bridal_party_intro', label: 'Bridal Party Intro Song' },
    { id: 'bride_groom_intro', label: 'Bride and Groom Introduction Song' },
    { id: 'first_dance', label: 'Bride and Groom First Dance' },
    { id: 'father_daughter', label: 'Father Daughter Dance' },
    { id: 'mother_son', label: 'Mother Son Dance' },
    { id: 'garter_toss', label: 'Garter Toss Song' },
    { id: 'bouquet_toss', label: 'Bouquet Toss Song' },
    { id: 'cake_cutting', label: 'Cake Cutting Song' },
    { id: 'last_dance', label: 'Bride and Groom Last Dance of the night' }
  ];

  const ceremonyMusicFields = [
    { id: 'prelude', label: 'Prelude', description: 'This is the quiet and gentle background music that is played while the guests are being seated. It is essentially there to fill the room with something other than silence.' },
    { id: 'interlude', label: 'Interlude', description: 'A song during the lighting of the unity candle or at another point in the ceremony. It can be instrumental or vocal.' },
    { id: 'processional', label: 'Processional', description: 'Stately music played as the bridal party walks down the aisle, with the bride and her escort at the very end. Often the bride\'s walk is accompanied by a different tune.' },
    { id: 'bridal_march', label: 'Bridal March', description: 'Music that plays as the bride walks down the aisle.' },
    { id: 'recessional', label: 'Recessional', description: 'Upbeat, triumphant music played at the end of the service as the bride and groom make their way back up the aisle and exit the ceremony.' },
    { id: 'postlude', description: 'Music that plays until every last guest has exited the ceremony area. It should revert to the background and last around fifteen minutes.' }
  ];

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Your Music Planning',
      icon: Sparkles,
      description: 'Let\'s make sure your wedding day music is absolutely perfect!'
    },
    {
      id: 'big_no',
      title: 'Songs to Avoid',
      icon: Music,
      description: 'Let us know what songs are a BIG NO'
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
    if (currentStep === 2 && formData.specialDances.length === 0) {
      setCurrentStep(4); // Skip to playlists
      return;
    }
    // Skip ceremony details if not pre-recorded
    if (currentStep === 5 && formData.ceremonyMusicType !== 'pre_recorded') {
      setCurrentStep(7); // Skip to review
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    // Skip special dance songs step if no special dances selected
    if (currentStep === 4 && formData.specialDances.length === 0) {
      setCurrentStep(2);
      return;
    }
    // Skip ceremony details if not pre-recorded
    if (currentStep === 7 && formData.ceremonyMusicType !== 'pre_recorded') {
      setCurrentStep(5);
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
        setSaved(true);
        setTimeout(() => {
          router.push(`/quote/${id}/confirmation`);
        }, 2000);
      } else {
        throw new Error('Failed to save questionnaire');
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      alert('There was an error saving your questionnaire. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getProgress = () => {
    const totalSteps = steps.length;
    const currentStepIndex = currentStep + 1;
    return (currentStepIndex / totalSteps) * 100;
  };

  const canProceed = () => {
    const step = steps[currentStep];
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Questionnaire Saved!</h2>
          <p className="text-gray-600 dark:text-gray-300">Your music preferences have been saved successfully.</p>
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
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
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
            <div className="space-y-6">
              {/* Welcome Step */}
              {currentStep === 0 && (
                <div className="text-center py-8">
                  <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                    We're so excited to be a part of your wedding day! Let's make sure your music is absolutely perfect.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    This questionnaire will help us understand your musical preferences and ensure every moment is exactly as you envision.
                  </p>
                </div>
              )}

              {/* Big No Songs */}
              {currentStep === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Let us know what songs are a BIG NO
                  </label>
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
              {currentStep === 2 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Check all that apply:
                  </p>
                  <div className="space-y-3">
                    {specialDanceOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.specialDances.includes(option.id)}
                          onChange={() => handleSpecialDanceToggle(option.id)}
                          className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                        />
                        <span className="ml-3 text-gray-900 dark:text-white font-medium">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.specialDances.length === 0 && (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
                      No special dances? That's perfectly fine! You can skip the next step.
                    </p>
                  )}
                </div>
              )}

              {/* Special Dance Songs */}
              {currentStep === 3 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Please give us the song names for all special dances below. It is not required to have a song for each category. Just leave it blank if the category doesn't apply. Please include the artist name. You may also copy and paste song links alternatively.
                  </p>
                  <div className="space-y-4">
                    {formData.specialDances.map((danceId) => {
                      const option = specialDanceOptions.find(o => o.id === danceId);
                      return (
                        <div key={danceId}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {option?.label}
                          </label>
                          <input
                            type="text"
                            value={formData.specialDanceSongs[danceId] || ''}
                            onChange={(e) => handleSpecialDanceSongChange(danceId, e.target.value)}
                            placeholder="Song name and artist, or paste a link..."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Playlist Links */}
              {currentStep === 4 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Add any links to Spotify, Apple Music or Tidal playlists below:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ceremony Music Playlist Link
                      </label>
                      <input
                        type="url"
                        value={formData.playlistLinks.ceremony}
                        onChange={(e) => handlePlaylistLinkChange('ceremony', e.target.value)}
                        placeholder="https://open.spotify.com/playlist/..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cocktail Hour Playlist Link
                      </label>
                      <input
                        type="url"
                        value={formData.playlistLinks.cocktail}
                        onChange={(e) => handlePlaylistLinkChange('cocktail', e.target.value)}
                        placeholder="https://open.spotify.com/playlist/..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reception Playlist Link
                      </label>
                      <input
                        type="url"
                        value={formData.playlistLinks.reception}
                        onChange={(e) => handlePlaylistLinkChange('reception', e.target.value)}
                        placeholder="https://open.spotify.com/playlist/..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Ceremony Music Type */}
              {currentStep === 5 && (
                <div>
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
                          className="w-5 h-5 text-purple-600 focus:ring-purple-500"
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
              {currentStep === 6 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    If pre-recorded music will be played, please give the song names below. Again, it is not required to have songs for each of the fields below. If the category doesn't apply, simply leave it blank.
                  </p>
                  <div className="space-y-6">
                    {ceremonyMusicFields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {field.label || field.id.charAt(0).toUpperCase() + field.id.slice(1)}
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
              {currentStep === 7 && (
                <div className="space-y-6">
                  {/* Big No Songs */}
                  {formData.bigNoSongs && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Songs to Avoid</h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{formData.bigNoSongs}</p>
                    </div>
                  )}

                  {/* Special Dances */}
                  {formData.specialDances.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Special Dances</h3>
                      <ul className="space-y-2">
                        {formData.specialDances.map((danceId) => {
                          const option = specialDanceOptions.find(o => o.id === danceId);
                          const song = formData.specialDanceSongs[danceId];
                          return (
                            <li key={danceId} className="text-gray-700 dark:text-gray-300">
                              <strong>{option?.label}:</strong> {song || 'No song specified'}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Playlists */}
                  {(formData.playlistLinks.ceremony || formData.playlistLinks.cocktail || formData.playlistLinks.reception) && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Playlist Links</h3>
                      <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                        {formData.playlistLinks.ceremony && <li><strong>Ceremony:</strong> <a href={formData.playlistLinks.ceremony} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">{formData.playlistLinks.ceremony}</a></li>}
                        {formData.playlistLinks.cocktail && <li><strong>Cocktail Hour:</strong> <a href={formData.playlistLinks.cocktail} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">{formData.playlistLinks.cocktail}</a></li>}
                        {formData.playlistLinks.reception && <li><strong>Reception:</strong> <a href={formData.playlistLinks.reception} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">{formData.playlistLinks.reception}</a></li>}
                      </ul>
                    </div>
                  )}

                  {/* Ceremony Music */}
                  {formData.ceremonyMusicType && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Ceremony Music Type</h3>
                      <p className="text-gray-700 dark:text-gray-300 capitalize">{formData.ceremonyMusicType.replace('_', ' ')}</p>
                    </div>
                  )}

                  {Object.keys(formData.ceremonyMusic).length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Ceremony Music Details</h3>
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
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Questionnaire
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

