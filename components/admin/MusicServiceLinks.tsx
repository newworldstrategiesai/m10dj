'use client';

import React, { useState } from 'react';
import { ExternalLink, Loader2, RefreshCw, Music, Youtube, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface MusicServiceLinksProps {
  requestId: string;
  songTitle: string | null;
  songArtist: string | null;
  links: {
    spotify: string | null;
    youtube: string | null;
    tidal: string | null;
    found_at: string | null;
    search_method: string;
  } | null;
  onLinksUpdated?: (links: any) => void;
}

export default function MusicServiceLinks({
  requestId,
  songTitle,
  songArtist,
  links,
  onLinksUpdated
}: MusicServiceLinksProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [currentLinks, setCurrentLinks] = useState(links);
  const { toast } = useToast();

  const handleFindLinks = async () => {
    if (!songTitle || !songArtist) {
      toast({
        title: 'Missing Information',
        description: 'Song title and artist are required to find links',
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/crowd-request/find-music-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          songTitle,
          songArtist
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find music links');
      }

      setCurrentLinks(data.links);
      if (onLinksUpdated) {
        onLinksUpdated(data.links);
      }

      const foundCount = [data.links.spotify, data.links.youtube, data.links.tidal].filter(Boolean).length;
      
      toast({
        title: foundCount > 0 ? 'Links Found' : 'No Links Found',
        description: foundCount > 0 
          ? `Found ${foundCount} music service link(s)`
          : 'Could not find links for this song. You can try again or search manually.',
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

  const hasLinks = currentLinks && (currentLinks.spotify || currentLinks.youtube || currentLinks.tidal);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasLinks ? (
        <>
          {currentLinks.spotify && (
            <a
              href={currentLinks.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              title="Open on Spotify"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Spotify</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {currentLinks.youtube && (
            <a
              href={currentLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              title="Open on YouTube"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {currentLinks.tidal && (
            <a
              href={currentLinks.tidal}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
              title="Open on Tidal"
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Tidal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFindLinks}
            disabled={isSearching}
            className="h-7 text-xs"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </>
            )}
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFindLinks}
          disabled={isSearching || !songTitle || !songArtist}
          className="h-7 text-xs"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Finding Links...
            </>
          ) : (
            <>
              <Music className="w-3 h-3 mr-1" />
              Find Music Links
            </>
          )}
        </Button>
      )}
    </div>
  );
}

