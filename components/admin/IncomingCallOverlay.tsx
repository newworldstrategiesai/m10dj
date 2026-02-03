'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LiveKitRoom } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { VoiceCallControls } from '@/components/livekit/VoiceCallControls';
import { useToast } from '@/hooks/use-toast';

interface IncomingCall {
  roomName: string;
  phoneNumber: string;
  callerId?: string;
}

/**
 * Listens for incoming_call notifications (Supabase Realtime) and shows
 * Answer/Decline. On Answer, joins the LiveKit room for the call.
 * Mount inside admin layout (M10 only) so any admin page can receive calls.
 */
export function IncomingCallOverlay() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [answered, setAnswered] = useState<{ token: string; serverUrl: string; roomName: string; displayName: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      setUserId(user.id);
      channel = supabase.channel(`admin-notifications:${user.id}`);

      channel
        .on('broadcast', { event: 'notification' }, (payload) => {
          const p = payload.payload as { type?: string; data?: { roomName?: string; phoneNumber?: string; callerId?: string } };
          if (p?.type === 'incoming_call' && p?.data?.roomName) {
            setIncoming({
              roomName: p.data.roomName,
              phoneNumber: p.data.phoneNumber ?? p.data.callerId ?? 'Unknown',
              callerId: p.data.callerId,
            });
          }
        })
        .subscribe();
    };

    setup();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleAnswer = useCallback(async () => {
    if (!incoming) return;

    try {
      const res = await fetch('/api/livekit/inbound-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: incoming.roomName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to get token');

      setAnswered({
        token: data.token,
        serverUrl: data.serverUrl,
        roomName: incoming.roomName,
        displayName: incoming.phoneNumber,
      });
      setIncoming(null);
    } catch (e) {
      toast({
        title: 'Could not join call',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [incoming, toast]);

  const handleDecline = useCallback(() => {
    setIncoming(null);
  }, []);

  const handleCallEnd = useCallback(() => {
    setAnswered(null);
  }, []);

  if (answered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/80">
        <div className="bg-background border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
          <LiveKitRoom
            video={false}
            audio={true}
            token={answered.token}
            serverUrl={answered.serverUrl}
            connect={true}
            onDisconnected={handleCallEnd}
            onError={(err) => {
              toast({ title: 'Call error', description: err.message, variant: 'destructive' });
              handleCallEnd();
            }}
            className="rounded-lg"
          >
            <VoiceCallControls displayName={answered.displayName} onHangUp={handleCallEnd} />
          </LiveKitRoom>
        </div>
      </div>
    );
  }

  if (!incoming) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/80">
      <div className="bg-background border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-lg font-medium mb-1">Incoming call</p>
        <p className="text-muted-foreground mb-6">{incoming.phoneNumber}</p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="default"
            size="lg"
            onClick={handleAnswer}
            className="rounded-full bg-green-600 hover:bg-green-700"
          >
            <Phone className="h-5 w-5 mr-2" />
            Answer
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleDecline}
            className="rounded-full"
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
