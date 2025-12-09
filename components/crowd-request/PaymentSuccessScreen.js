import { useState, useEffect } from 'react';
import { CheckCircle, Music, Loader2 } from 'lucide-react';
import ReceiptRequestButton from './ReceiptRequestButton';
import { crowdRequestAPI } from '../../utils/crowd-request-api';

export default function PaymentSuccessScreen({ requestId, amount, additionalRequestIds = [] }) {
  const [additionalSongs, setAdditionalSongs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Initialize additional songs state
  useEffect(() => {
    if (additionalRequestIds && additionalRequestIds.length > 0) {
      setAdditionalSongs(
        additionalRequestIds.map(id => ({
          requestId: id,
          songTitle: '',
          songArtist: ''
        }))
      );
    }
  }, [additionalRequestIds]);

  const handleSongChange = (index, field, value) => {
    const updated = [...additionalSongs];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalSongs(updated);
  };

  const handleSaveSongs = async () => {
    setSaving(true);
    setError('');

    try {
      // Update each additional song request
      const updates = additionalSongs.map(song => 
        crowdRequestAPI.updateSongDetails({
          requestId: song.requestId,
          songTitle: song.songTitle.trim(),
          songArtist: song.songArtist.trim()
        })
      );

      await Promise.all(updates);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Failed to save song details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasAdditionalSongs = additionalSongs.length > 0;
  const allSongsFilled = additionalSongs.every(song => song.songTitle.trim());

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 animate-fade-in-up">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6 shadow-lg shadow-green-500/30">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Request Submitted!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
          Payment processed successfully!
        </p>
      </div>

      {/* Additional Songs Form */}
      {hasAdditionalSongs && !saved && (
        <div className="mt-6 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Enter Your Additional Song Details
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Please enter the song title and artist for each additional song you purchased.
          </p>

          <div className="space-y-4 mb-4">
            {additionalSongs.map((song, index) => (
              <div key={song.requestId} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Song {index + 1}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Song Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={song.songTitle}
                      onChange={(e) => handleSongChange(index, 'songTitle', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter song title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Artist Name
                    </label>
                    <input
                      type="text"
                      value={song.songArtist}
                      onChange={(e) => handleSongChange(index, 'songArtist', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter artist name"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleSaveSongs}
            disabled={saving || !allSongsFilled}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Song Details'
            )}
          </button>
        </div>
      )}

      {saved && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">
            ✓ Song details saved successfully!
          </p>
        </div>
      )}

      <div className="mt-6">
        <ReceiptRequestButton requestId={requestId} amount={amount} />
      </div>
    </div>
  );
}

