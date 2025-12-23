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
  const [extractedData, setExtractedData] = useState(null); // Store full extracted data including album art

  const extractSongInfo = async (url, setFormData) => {
    if (!url || extractingSong) return null;

    setExtractingSong(true);
    setExtractionError('');
    setExtractedData(null);

    try {
      const data = await crowdRequestAPI.extractSongInfo(url);

      // Store full extracted data including album art
      setExtractedData(data);

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

      return data; // Return extracted data
    } catch (err) {
      logger.error('Error extracting song info', err);
      setExtractedData(null);
      if (err instanceof CrowdRequestAPIError) {
        if (err.status === 504 || (err.status && err.status !== 400 && err.status !== 404)) {
          setExtractionError(err.message || 'Could not extract song information. Please try again or enter the details manually.');
        } else {
          setExtractionError('Could not extract song information. Please enter the details manually.');
        }
      } else {
        setExtractionError('Could not extract song information. Please enter the details manually.');
      }
      return null;
    } finally {
      setExtractingSong(false);
    }
  };

  return {
    extractingSong,
    extractionError,
    extractedData, // Include album art and other extracted data
    extractSongInfo
  };
}

