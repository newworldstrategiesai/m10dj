import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Clock, Trophy, DollarSign, Users, AlertCircle, Loader2 } from 'lucide-react';

interface BiddingRoundWithStats {
  id: string;
  round_number: number;
  started_at: string;
  ends_at: string;
  status: string;
  winning_request_id: string | null;
  winning_bid_amount: number | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  bidCount?: number;
  requestCount?: number;
  winning_request?: {
    id: string;
    song_title: string | null;
    song_artist: string | null;
    recipient_name: string | null;
    requester_name: string | null;
    current_bid_amount: number | null;
  } | null;
}

export default function BiddingRoundsAdmin() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [rounds, setRounds] = useState<BiddingRoundWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadRounds();
      // Set up real-time subscription
      const channel = supabase
        .channel('bidding-rounds-admin')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bidding_rounds',
            filter: `organization_id=eq.${organizationId}`
          },
          () => {
            loadRounds();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }

      // Get user's organization
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single();

      if (orgs) {
        setOrganizationId(orgs.id);
      } else {
        setError('No organization found');
      }
    } catch (err) {
      console.error('Error loading organization:', err);
      setError('Failed to load organization');
    }
  };

  const loadRounds = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('bidding_rounds')
        .select(`
          *,
          winning_request:crowd_requests!bidding_rounds_winning_request_id_fkey(
            id,
            song_title,
            song_artist,
            recipient_name,
            requester_name,
            current_bid_amount
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      // Get bid counts for each round
      const roundsWithStats = await Promise.all(
        (data || []).map(async (round) => {
          const { count: bidCount } = await supabase
            .from('bid_history')
            .select('*', { count: 'exact', head: true })
            .eq('bidding_round_id', round.id);

          const { count: requestCount } = await supabase
            .from('crowd_requests')
            .select('*', { count: 'exact', head: true })
            .eq('bidding_round_id', round.id);

          return {
            ...round,
            bidCount: bidCount || 0,
            requestCount: requestCount || 0
          };
        })
      );

      setRounds(roundsWithStats);
    } catch (err) {
      console.error('Error loading rounds:', err);
      setError('Failed to load bidding rounds');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading && rounds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bidding Rounds
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage bidding rounds for song requests
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {rounds.map((round) => (
            <div
              key={round.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 ${
                round.status === 'active'
                  ? 'border-purple-500'
                  : round.status === 'completed'
                  ? 'border-green-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Round #{round.round_number}
                    </h2>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        round.status === 'active'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : round.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {round.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Started: {formatTime(round.started_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Ends: {formatTime(round.ends_at)}</span>
                    </div>
                  </div>
                </div>
                {round.status === 'active' && (
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Time Remaining</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.max(0, Math.floor((new Date(round.ends_at).getTime() - Date.now()) / 1000 / 60))}m
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Requests</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {round.requestCount}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Total Bids</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {round.bidCount}
                  </div>
                </div>
                {round.winning_bid_amount && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm">Winning Bid</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(round.winning_bid_amount)}
                    </div>
                  </div>
                )}
              </div>

              {round.status === 'completed' && round.winning_request && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-900 dark:text-green-200">Winner</h3>
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300">
                    <p className="font-medium">
                      {round.winning_request.song_title
                        ? `${round.winning_request.song_title}${round.winning_request.song_artist ? ` by ${round.winning_request.song_artist}` : ''}`
                        : `Shoutout for ${round.winning_request.recipient_name}`}
                    </p>
                    <p className="mt-1">
                      Requested by: {round.winning_request.requester_name}
                    </p>
                    <p className="mt-1 font-semibold">
                      Winning Bid: {formatCurrency(round.winning_bid_amount || 0)}
                    </p>
                  </div>
                </div>
              )}

              {round.status === 'completed' && !round.winning_request && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    No bids were placed in this round.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {rounds.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No bidding rounds found. Enable bidding in your organization settings to start.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

