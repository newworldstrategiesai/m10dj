'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { Play, Square } from 'lucide-react';

interface StreamControlsProps {
  roomName: string;
  isLive: boolean;
  onStreamStart: () => void;
  onStreamStop: () => void;
}

export function StreamControls({
  roomName,
  isLive,
  onStreamStart,
  onStreamStop,
}: StreamControlsProps) {
  const [title, setTitle] = useState('');
  const [ppvEnabled, setPpvEnabled] = useState(false);
  const [ppvPrice, setPpvPrice] = useState('');

  async function handleStartStream() {
    // Update stream in database
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await (supabase
      .from('live_streams') as any)
      .update({
        title: title || null,
        is_live: true,
        ppv_price_cents: ppvEnabled && ppvPrice ? Math.round(parseFloat(ppvPrice) * 100) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('room_name', roomName);

    onStreamStart();
  }

  async function handleStopStream() {
    const supabase = createClient();

    await (supabase
      .from('live_streams') as any)
      .update({
        is_live: false,
        updated_at: new Date().toISOString(),
      })
      .eq('room_name', roomName);

    onStreamStop();
  }

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <div>
        <Label htmlFor="title">Stream Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Live Stream"
          className="mt-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="ppv"
          checked={ppvEnabled}
          onChange={(e) => setPpvEnabled(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="ppv">Enable Pay-Per-View</Label>
      </div>

      {ppvEnabled && (
        <div>
          <Label htmlFor="ppvPrice">Price ($)</Label>
          <Input
            id="ppvPrice"
            type="number"
            step="0.01"
            min="0"
            value={ppvPrice}
            onChange={(e) => setPpvPrice(e.target.value)}
            placeholder="9.99"
            className="mt-1"
          />
        </div>
      )}

      <div className="flex gap-2">
        {!isLive ? (
          <Button
            onClick={handleStartStream}
            className="flex items-center gap-2"
            size="lg"
          >
            <Play className="h-4 w-4" />
            Go Live
          </Button>
        ) : (
          <Button
            onClick={handleStopStream}
            variant="destructive"
            className="flex items-center gap-2"
            size="lg"
          >
            <Square className="h-4 w-4" />
            End Stream
          </Button>
        )}
      </div>
    </div>
  );
}

