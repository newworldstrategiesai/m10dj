import { useState } from 'react';
import { crowdRequestAPI, CrowdRequestAPIError } from '../utils/crowd-request-api';
import { createLogger } from '../utils/logger';

const logger = createLogger('SongExtraction');

/**
 * Custom hook for extracting song information from URLs
 * Handles Spotify, YouTube, SoundCloud, Tidal links
 */
export function useSongExtraction() {
  const [extractingSong, setExtractingSong] = useState(false);
  const [extractionError, setExtractionError] = useState('');

  const extractSongInfo = async (url, setFormData) => {
    if (!url || extractingSong) return;

    setExtractingSong(true);
    setExtractionError('');

    try {
      const data = await crowdRequestAPI.extractSongInfo(url);

      // Auto-fill the form fields
      if (data?.title) {
        setFormData(prev => ({
          ...prev,
          songTitle: data.title
        }));
      }

      if (data?.artist) {
        setFormData(prev => ({
          ...prev,
          songArtist: data.artist
        }));
      }
    } catch (err) {
      logger.error('Error extracting song info', err);
      if (err instanceof CrowdRequestAPIError) {
        if (err.status === 504 || (err.status && err.status !== 400 && err.status !== 404)) {
          setExtractionError(err.message || 'Could not extract song information. Please try again or enter the details manually.');
        } else {
          setExtractionError('Could not extract song information. Please enter the details manually.');
        }
      } else {
        setExtractionError('Could not extract song information. Please enter the details manually.');
      }
    } finally {
      setExtractingSong(false);
    }
  };

  return {
    extractingSong,
    extractionError,
    extractSongInfo
  };
}

