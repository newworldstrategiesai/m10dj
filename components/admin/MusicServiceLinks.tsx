'use client';

import React, { useState } from 'react';
import { ExternalLink, Loader2, RefreshCw, Music, Youtube, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface MusicServiceLinksProps {
  requestId: string;
  songTitle: string | null;
  songArtist: string | null;
  postedLink?: string | null; // Original URL if request was created from a posted link
  links: {
    spotify: string | null;
    youtube: string | null;
    tidal: string | null;
    apple_music: string | null;
    found_at: string | null;
    search_method: string;
  } | null;
  onLinksUpdated?: (links: any) => void;
  showRefreshButton?: boolean; // Whether to show the refresh/find links button
}

export default function MusicServiceLinks({
  requestId,
  songTitle,
  songArtist,
  postedLink,
  links,
  onLinksUpdated,
  showRefreshButton = true
}: MusicServiceLinksProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [currentLinks, setCurrentLinks] = useState(links);
  const { toast } = useToast();

  const handleFindLinks = async () => {
    // Check if we have a YouTube URL in posted_link
    const isYouTubeUrl = postedLink && (postedLink.includes('youtube.com') || postedLink.includes('youtu.be'));
    
    if (!songTitle && !songArtist && !isYouTubeUrl) {
      toast({
        title: 'Missing Information',
        description: 'Song title and artist, or a YouTube URL is required to find links',
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    try {
      const requestBody: any = {
        requestId,
        songTitle: songTitle || null,
        songArtist: songArtist || null
      };
      
      // If posted_link is a YouTube URL, include it to extract song info and find other services
      if (isYouTubeUrl) {
        requestBody.youtubeUrl = postedLink;
      }
      
      const response = await fetch('/api/crowd-request/find-music-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find music links');
      }

      // Debug: Log what we received
      console.log('Music links response:', {
        spotify: !!data.links?.spotify,
        youtube: !!data.links?.youtube,
        tidal: !!data.links?.tidal,
        apple_music: !!data.links?.apple_music,
        fullData: data.links
      });

      setCurrentLinks(data.links);
      if (onLinksUpdated) {
        onLinksUpdated(data.links);
      }

      const foundCount = [
        data.links?.spotify, 
        data.links?.youtube, 
        data.links?.tidal,
        data.links?.apple_music
      ].filter(Boolean).length;
      
      // More detailed toast message
      const foundServices = [];
      if (data.links?.spotify) foundServices.push('Spotify');
      if (data.links?.youtube) foundServices.push('YouTube');
      if (data.links?.tidal) foundServices.push('Tidal');
      if (data.links?.apple_music) foundServices.push('Apple Music');
      
      toast({
        title: foundCount > 0 ? 'Links Found' : 'No Links Found',
        description: foundCount > 0 
          ? `Found ${foundCount} link(s): ${foundServices.join(', ')}`
          : 'Could not find links for this song. Check console for details.',
        variant: foundCount > 0 ? 'default' : 'destructive'
      });
    } catch (error: any) {
      console.error('Error finding music links:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to find music links',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const hasLinks = currentLinks && (
    currentLinks.spotify || 
    currentLinks.youtube || 
    currentLinks.tidal || 
    currentLinks.apple_music
  );

  return (
    <div className="flex items-center gap-1.5 flex-nowrap">
      {hasLinks ? (
        <>
          {currentLinks.spotify && (
            <a
              href={currentLinks.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors whitespace-nowrap"
              title="Open on Spotify"
            >
              <Music className="w-3 h-3" />
              <span className="hidden sm:inline">Spotify</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {currentLinks.youtube && (
            <a
              href={currentLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors whitespace-nowrap"
              title="Open on YouTube"
            >
              <Youtube className="w-3 h-3" />
              <span className="hidden sm:inline">YouTube</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {currentLinks.tidal && (
            <a
              href={currentLinks.tidal}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-black hover:bg-gray-800 rounded transition-colors whitespace-nowrap"
              title="Open on Tidal"
            >
              <Waves className="w-3 h-3" />
              <span className="hidden sm:inline">Tidal</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {currentLinks.apple_music && (
            <a
              href={currentLinks.apple_music}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-pink-600 hover:bg-pink-700 rounded transition-colors whitespace-nowrap"
              title="Open on Apple Music"
            >
              <Music className="w-3 h-3" />
              <span className="hidden sm:inline">Apple</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFindLinks}
              disabled={isSearching}
              className="h-6 px-2 text-xs flex-shrink-0"
              title="Refresh links"
            >
              {isSearching ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          )}
        </>
      ) : showRefreshButton ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFindLinks}
          disabled={isSearching || (!songTitle && !songArtist && !(postedLink && (postedLink.includes('youtube.com') || postedLink.includes('youtu.be'))))}
          className="h-6 px-2 text-xs"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              <span className="hidden sm:inline">Finding...</span>
            </>
          ) : (
            <>
              <Music className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Find Links</span>
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}

