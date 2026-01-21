'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  Play,
  Lock,
  Crown,
  Music,
  Gamepad2,
  Star,
  User,
  Clock,
  Heart,
  Loader2
} from 'lucide-react';

interface DiscoverPageProps {
  isPremium: boolean;
  supabase: any;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  video_ids: string[];
  created_at: string;
  user_id: string;
  organization_id: string;
  songCount?: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isPremium?: boolean;
  playerCount?: number;
}

export default function DiscoverPage({ isPremium, supabase }: DiscoverPageProps) {
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);
  const [hoveredQuiz, setHoveredQuiz] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlaylists() {
      try {
        setLoading(true);
        setError(null);

        // Get current organization
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw new Error(`Authentication error: ${userError.message}`);
        if (!user) throw new Error('Not authenticated - please sign in');

        const { data: userOrgs, error: orgError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);

        if (orgError) throw new Error(`Organization access error: ${orgError.message}`);
        if (!userOrgs?.length) throw new Error('No organization access - please contact administrator');

        const organizationId = (userOrgs[0] as any).organization_id;

        // Load playlists
        const { data: playlistData, error: playlistError } = await supabase
          .from('user_playlists')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (playlistError) {
          console.error('Error loading playlists:', playlistError);
          throw new Error(`Failed to load playlists: ${playlistError.message}`);
        }

        // Calculate song count for each playlist
        const playlistsWithCount = await Promise.all(
          (playlistData || []).map(async (playlist) => {
            const songCount = (playlist as any).video_ids?.length || 0;
            return {
              ...(playlist as any),
              songCount
            };
          })
        );

        setPlaylists(playlistsWithCount);
      } catch (err) {
        console.error('Error loading playlists:', err);
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setLoading(false);
      }
    }

    loadPlaylists();
  }, []);

  const quizzes: Quiz[] = [
    {
      id: '1',
      title: 'Britney Spears',
      description: 'Test your knowledge of Britney Spears hits',
      imageUrl: '/api/placeholder/200/200',
      category: 'Pop',
      difficulty: 'Medium',
      playerCount: 15420
    },
    {
      id: '2',
      title: 'GREATEST HITS EVER',
      description: 'The ultimate karaoke challenge',
      imageUrl: '/api/placeholder/200/200',
      category: 'Mixed',
      difficulty: 'Hard',
      isPremium: true,
      playerCount: 8750
    },
    {
      id: '3',
      title: '90s Hits',
      description: 'Relive the 90s with these classics',
      imageUrl: '/api/placeholder/200/200',
      category: '90s',
      difficulty: 'Easy',
      playerCount: 23100
    },
    {
      id: '4',
      title: '80s Hits',
      description: 'Totally tubular 80s karaoke quiz',
      imageUrl: '/api/placeholder/200/200',
      category: '80s',
      difficulty: 'Medium',
      playerCount: 18900
    }
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Premium CTA Banner */}
      <div className="karaoke-gradient-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Sing without limits.
            </h2>
            <p className="text-lg opacity-90 mb-6 max-w-md">
              Subscribe to unlock full versions of songs and premium features for the ultimate karaoke experience.
            </p>
            <Button className="bg-white text-pink-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg shadow-xl">
              Upgrade to Premium
            </Button>
          </div>

          {/* K Logo */}
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ml-8">
            <span className="text-white font-bold text-3xl">K</span>
          </div>
        </div>
      </div>

      {/* Playlists Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Playlists</h2>
          <Link href="/admin/karaoke/playlists" className="text-pink-400 hover:text-pink-300 font-medium flex items-center gap-2">
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white/60" />
                <p className="text-white/60">Loading playlists...</p>
              </div>
            </div>
          ) : error ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-red-400 mb-4">Failed to load playlists</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : playlists.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <Music className="w-12 h-12 mx-auto mb-4 text-white/40" />
                <p className="text-white/60 mb-4">No playlists available</p>
                <p className="text-white/40 text-sm">Create your first playlist to get started</p>
              </div>
            </div>
          ) : (
            playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group relative karaoke-card karaoke-card-hover cursor-pointer"
                onMouseEnter={() => setHoveredPlaylist(playlist.id)}
                onMouseLeave={() => setHoveredPlaylist(null)}
              >
                {/* Background Image/Gradient */}
                <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 relative">
                  {/* Hover Overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredPlaylist === playlist.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <Button
                      size="lg"
                      className="bg-white/90 hover:bg-white text-gray-900 font-semibold"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Play
                    </Button>
                  </div>

                  {/* Vignette Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-lg mb-1">{playlist.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{playlist.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500 text-sm">{playlist.songCount} songs</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Quizzes Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Quizzes</h2>
          <Link href="/admin/karaoke/quizzes" className="text-pink-400 hover:text-pink-300 font-medium flex items-center gap-2">
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="group relative karaoke-card karaoke-card-hover cursor-pointer"
              onMouseEnter={() => setHoveredQuiz(quiz.id)}
              onMouseLeave={() => setHoveredQuiz(null)}
            >
              {/* Background Image */}
              <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-600 relative">
                {/* Premium Lock */}
                {quiz.isPremium && !isPremium && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                  hoveredQuiz === quiz.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <Button
                    size="lg"
                    className="bg-white/90 hover:bg-white text-gray-900 font-semibold"
                    disabled={quiz.isPremium && !isPremium}
                  >
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Play Quiz
                  </Button>
                </div>

                {/* Vignette Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`text-xs ${
                    quiz.difficulty === 'Easy' ? 'bg-green-500' :
                    quiz.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {quiz.difficulty}
                  </Badge>
                  <span className="text-xs text-gray-500">{quiz.category}</span>
                </div>

                <h3 className="font-bold text-white text-lg mb-1">{quiz.title}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{quiz.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500 text-sm">
                      {quiz.playerCount?.toLocaleString()} played
                    </span>
                  </div>

                  {quiz.isPremium && (
                    <Badge variant="outline" className="border-pink-500/50 text-pink-400">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity / Quick Access */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Continue Singing</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recently Played */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-pink-400" />
              <h3 className="font-semibold text-white">Recently Played</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                  <Music className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">Bohemian Rhapsody</p>
                  <p className="text-gray-400 text-xs">Queen</p>
                </div>
                <Button size="sm" variant="ghost" className="text-pink-400 hover:text-pink-300">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Favorites */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-pink-400" />
              <h3 className="font-semibold text-white">Favorites</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded flex items-center justify-center">
                  <Music className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">Hotel California</p>
                  <p className="text-gray-400 text-xs">Eagles</p>
                </div>
                <Button size="sm" variant="ghost" className="text-pink-400 hover:text-pink-300">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Top Charts */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-pink-400" />
              <h3 className="font-semibold text-white">Top This Week</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30">
                <div className="flex items-center justify-center w-6 h-6 bg-pink-500 rounded-full text-white text-xs font-bold">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">Shape of You</p>
                  <p className="text-gray-400 text-xs">Ed Sheeran</p>
                </div>
                <Button size="sm" variant="ghost" className="text-pink-400 hover:text-pink-300">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}