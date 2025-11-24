import { Sparkles, X } from 'lucide-react';

export default function UpsellModal({
  show,
  onClose,
  formData,
  additionalSongs,
  setAdditionalSongs,
  bundleDiscount,
  getBaseAmount,
  getPaymentAmount,
  onContinue,
  onSkip,
  error,
  setError
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Request More Songs & Save!
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add more songs to your request and get a {Math.round(bundleDiscount * 100)}% discount on each additional song!
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Current Song */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-4 border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Your First Song:</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formData.songTitle}
              {formData.songArtist && ` by ${formData.songArtist}`}
            </p>
          </div>

          {/* Additional Songs */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Add More Songs ({additionalSongs.length} added):
            </p>
            {additionalSongs.map((song, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Song title"
                    value={song.songTitle || ''}
                    onChange={(e) => {
                      const updated = [...additionalSongs];
                      updated[index] = { ...updated[index], songTitle: e.target.value };
                      setAdditionalSongs(updated);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Artist name"
                    value={song.songArtist || ''}
                    onChange={(e) => {
                      const updated = [...additionalSongs];
                      updated[index] = { ...updated[index], songArtist: e.target.value };
                      setAdditionalSongs(updated);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    setAdditionalSongs(additionalSongs.filter((_, i) => i !== index));
                  }}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2"
                  aria-label="Remove song"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            <button
              onClick={() => setAdditionalSongs([...additionalSongs, { songTitle: '', songArtist: '' }])}
              className="w-full py-2.5 px-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg text-purple-600 dark:text-purple-400 hover:border-purple-500 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm font-medium"
            >
              + Add Another Song
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Savings Calculation */}
          {additionalSongs.filter(s => s.songTitle?.trim()).length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Bundle Discount ({Math.round(bundleDiscount * 100)}% off):
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  -${((getBaseAmount() * additionalSongs.filter(s => s.songTitle?.trim()).length * bundleDiscount) / 100).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  You&apos;ll save ${((getBaseAmount() * bundleDiscount) / 100).toFixed(2)} on each additional song!
                </p>
                <p className="font-medium">
                  Total: {additionalSongs.filter(s => s.songTitle?.trim()).length + 1} songs for ${(getPaymentAmount() / 100).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onSkip}
              className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors"
            >
              Skip & Continue
            </button>
            <button
              onClick={onContinue}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
            >
              {additionalSongs.filter(s => s.songTitle?.trim()).length > 0 
                ? `Continue with ${additionalSongs.filter(s => s.songTitle?.trim()).length + 1} Songs` 
                : 'Continue to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

