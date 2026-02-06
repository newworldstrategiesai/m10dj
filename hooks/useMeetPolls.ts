'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDataChannel, useRoomContext } from '@livekit/components-react';

const MEET_POLLS_TOPIC = 'meet_polls';

type PollStartMessage = { t: 'poll'; id: string; q: string; opts: string[] };
type PollVoteMessage = { t: 'vote'; pollId: string; id: string; opt: number };
type PollMessage = PollStartMessage | PollVoteMessage;

export interface ActivePoll {
  id: string;
  question: string;
  options: string[];
}

export function useMeetPolls(roomName?: string) {
  const room = useRoomContext();
  const localIdentity = room?.localParticipant?.identity ?? '';
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [votes, setVotes] = useState<Map<string, number>>(new Map()); // identity -> optionIndex
  const [myVote, setMyVote] = useState<number | null>(null);

  const { message, send } = useDataChannel(MEET_POLLS_TOPIC, () => {});

  useEffect(() => {
    if (!message?.payload) return;
    try {
      const data = JSON.parse(new TextDecoder().decode(message.payload)) as PollMessage;
      if (data.t === 'poll') {
        setActivePoll({ id: data.id, question: data.q, options: data.opts ?? [] });
        setVotes(new Map());
        setMyVote(null);
      } else if (data.t === 'vote' && activePoll?.id === data.pollId) {
        const optIndex = Math.max(0, Math.min((activePoll.options.length - 1) || 0, data.opt));
        setVotes((prev) => {
          const next = new Map(prev);
          next.set(data.id, optIndex);
          return next;
        });
        if (data.id === localIdentity) {
          setMyVote(optIndex);
        }
      }
    } catch {
      // ignore
    }
  }, [message, activePoll?.id, localIdentity]);

  const sendPoll = useCallback(
    (question: string, options: string[]) => {
      if (!send || !localIdentity) return;
      const id = `poll-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const opts = options.filter((o) => o.trim()).slice(0, 6);
      const payload = new TextEncoder().encode(
        JSON.stringify({ t: 'poll', id, q: question.trim(), opts } as PollStartMessage)
      );
      send(payload, {});
      setActivePoll({ id, question: question.trim(), options: opts });
      setVotes(new Map());
      setMyVote(null);
      if (roomName?.trim()) {
        fetch('/api/meet/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: roomName.trim(), question: question.trim(), options: opts, clientPollId: id }),
          credentials: 'include',
        }).catch((err) => console.warn('[useMeetPolls] persist poll failed', err));
      }
    },
    [send, localIdentity, roomName]
  );

  const sendVote = useCallback(
    (optionIndex: number) => {
      if (!send || !localIdentity || !activePoll) return;
      const opt = Math.max(0, Math.min(activePoll.options.length - 1, optionIndex));
      const payload = new TextEncoder().encode(
        JSON.stringify({ t: 'vote', pollId: activePoll.id, id: localIdentity, opt } as PollVoteMessage)
      );
      send(payload, {});
      setVotes((prev) => {
        const next = new Map(prev);
        next.set(localIdentity, opt);
        return next;
      });
      setMyVote(opt);
      if (roomName?.trim()) {
        fetch('/api/meet/polls/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: roomName.trim(),
            clientPollId: activePoll.id,
            optionIndex: opt,
            participantIdentity: localIdentity,
          }),
          credentials: 'include',
        }).catch((err) => console.warn('[useMeetPolls] persist vote failed', err));
      }
    },
    [send, localIdentity, activePoll, roomName]
  );

  const results = activePoll
    ? activePoll.options.map((_, i) => Array.from(votes.values()).filter((v) => v === i).length)
    : [];

  return { activePoll, votes, myVote, results, sendPoll, sendVote };
}
