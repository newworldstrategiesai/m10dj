import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import QuoteBottomNav from '../../../components/quote/QuoteBottomNav';
import { Music, Heart, Radio, Link as LinkIcon, ArrowLeft, Loader2, CheckCircle, FileText, Calendar, MapPin, Users } from 'lucide-react';

export default function MySongsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <>
      <Head>
        <title>My Songs | M10 DJ Company</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

        <main className="section-container py-12 md:py-20">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <Link
              href={`/quote/${id}/confirmation`}
              className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Confirmation
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              My Songs
            </h1>
            {leadData && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {leadData.eventDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(leadData.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Songs to Avoid */}
            {questionnaireData?.bigNoSongs && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <Music className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Songs to Avoid</h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{questionnaireData.bigNoSongs}</p>
              </div>
            )}

            {/* Special Dances */}
            {questionnaireData?.specialDances && questionnaireData.specialDances.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Special Dances</h2>
                </div>
                <div className="space-y-4">
                  {questionnaireData.specialDances.map((danceId) => {
                    const song = questionnaireData.specialDanceSongs?.[danceId];
                    return (
                      <div key={danceId} className="border-l-4 border-pink-500 pl-4 py-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {specialDanceLabels[danceId] || danceId}
                        </h3>
                        {song ? (
                          <p className="text-gray-700 dark:text-gray-300">{song}</p>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500 italic">No song specified</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Playlist Links */}
            {questionnaireData?.playlistLinks && Object.values(questionnaireData.playlistLinks).some(link => link) && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <LinkIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Playlist Links</h2>
                </div>
                <div className="space-y-3">
                  {questionnaireData.playlistLinks.ceremony && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Ceremony</h3>
                      <a 
                        href={questionnaireData.playlistLinks.ceremony} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {questionnaireData.playlistLinks.ceremony}
                      </a>
                      {questionnaireData.importedPlaylists?.ceremony && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                            {questionnaireData.importedPlaylists.ceremony.title} ({questionnaireData.importedPlaylists.ceremony.count} songs)
                          </p>
                          <pre className="text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {questionnaireData.importedPlaylists.ceremony.songs}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  {questionnaireData.playlistLinks.cocktail && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Cocktail Hour</h3>
                      <a 
                        href={questionnaireData.playlistLinks.cocktail} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {questionnaireData.playlistLinks.cocktail}
                      </a>
                      {questionnaireData.importedPlaylists?.cocktail && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                            {questionnaireData.importedPlaylists.cocktail.title} ({questionnaireData.importedPlaylists.cocktail.count} songs)
                          </p>
                          <pre className="text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {questionnaireData.importedPlaylists.cocktail.songs}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  {questionnaireData.playlistLinks.reception && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Reception</h3>
                      <a 
                        href={questionnaireData.playlistLinks.reception} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {questionnaireData.playlistLinks.reception}
                      </a>
                      {questionnaireData.importedPlaylists?.reception && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                            {questionnaireData.importedPlaylists.reception.title} ({questionnaireData.importedPlaylists.reception.count} songs)
                          </p>
                          <pre className="text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {questionnaireData.importedPlaylists.reception.songs}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ceremony Music */}
            {questionnaireData?.ceremonyMusicType && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ceremony Music</h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 capitalize">
                  Type: {questionnaireData.ceremonyMusicType.replace('_', ' ')}
                </p>
                {questionnaireData.ceremonyMusic && Object.keys(questionnaireData.ceremonyMusic).length > 0 && (
                  <div className="space-y-3">
                    {Object.entries(questionnaireData.ceremonyMusic).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key} className="border-l-4 border-purple-500 pl-4 py-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {ceremonyMusicLabels[key] || key}
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!questionnaireData?.bigNoSongs && 
             (!questionnaireData?.specialDances || questionnaireData.specialDances.length === 0) &&
             (!questionnaireData?.playlistLinks || !Object.values(questionnaireData.playlistLinks).some(link => link)) &&
             !questionnaireData?.ceremonyMusicType && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 text-center">
                <Music className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Music Preferences Yet</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Complete the music questionnaire to see your song preferences here.
                </p>
                <Link
                  href={`/quote/${id}/questionnaire`}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Music className="w-5 h-5" />
                  Complete Music Questionnaire
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

