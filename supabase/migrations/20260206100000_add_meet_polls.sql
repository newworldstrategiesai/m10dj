-- Meet Polls: persist polls and votes for review after meeting ends.
-- TipJar meet only; scoped by meet_rooms (room owner can manage).

CREATE TABLE IF NOT EXISTS public.meet_polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_room_id UUID NOT NULL REFERENCES public.meet_rooms(id) ON DELETE CASCADE,
  client_poll_id TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meet_polls_room_client ON public.meet_polls(meet_room_id, client_poll_id);
CREATE INDEX IF NOT EXISTS idx_meet_polls_meet_room_id ON public.meet_polls(meet_room_id);
CREATE INDEX IF NOT EXISTS idx_meet_polls_created_at ON public.meet_polls(created_at);

COMMENT ON TABLE public.meet_polls IS 'TipJar meet: polls created during a meeting; client_poll_id is the id sent over data channel (e.g. poll-123-abc).';

CREATE TABLE IF NOT EXISTS public.meet_poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.meet_polls(id) ON DELETE CASCADE,
  participant_identity TEXT NOT NULL,
  option_index INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT meet_poll_votes_poll_identity_unique UNIQUE (poll_id, participant_identity)
);

CREATE INDEX IF NOT EXISTS idx_meet_poll_votes_poll_id ON public.meet_poll_votes(poll_id);

COMMENT ON TABLE public.meet_poll_votes IS 'TipJar meet: one vote per participant per poll; participant_identity is LiveKit identity.';

ALTER TABLE public.meet_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_poll_votes ENABLE ROW LEVEL SECURITY;

-- Room owner can manage polls for their rooms (select/insert; no anon access - API uses service role)
CREATE POLICY "Room owner can manage own meet polls" ON public.meet_polls
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meet_rooms mr
      WHERE mr.id = meet_polls.meet_room_id AND mr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meet_rooms mr
      WHERE mr.id = meet_polls.meet_room_id AND mr.user_id = auth.uid()
    )
  );

-- Votes: room owner can read; inserts done via API (service role) so participants can vote without auth
CREATE POLICY "Room owner can read meet poll votes" ON public.meet_poll_votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meet_polls mp
      JOIN public.meet_rooms mr ON mr.id = mp.meet_room_id
      WHERE mp.id = meet_poll_votes.poll_id AND mr.user_id = auth.uid()
    )
  );

-- Vote inserts from participants use API with service role (no auth). Room owner could also insert via auth.
CREATE POLICY "Room owner can insert meet poll votes" ON public.meet_poll_votes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meet_polls mp
      JOIN public.meet_rooms mr ON mr.id = mp.meet_room_id
      WHERE mp.id = meet_poll_votes.poll_id AND mr.user_id = auth.uid()
    )
  );
