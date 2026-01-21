'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import KaraokeLayout from '@/components/karaoke/KaraokeLayout';
import {
  Search,
  Gamepad2,
  Play,
  Trophy,
  Clock,
  Users,
  Crown,
  Star,
  TrendingUp
} from 'lucide-react';
import { useKaraokeAuth } from '@/hooks/useKaraokeAuth';
import PremiumGate from '@/components/karaoke/premium/PremiumGate';

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  is_premium: boolean;
  player_count: number;
  average_score?: number;
  created_at: string;
}

export default function KaraokeQuizzesPage() {
  const { toast } = useToast();
  const { organization, subscriptionTier, isLoading: authLoading, isAuthenticated, supabase } = useKaraokeAuth();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const isPremium = subscriptionTier !== 'free';

  const categories = [
    { id: 'all', label: 'All Quizzes' },
    { id: 'pop', label: 'Pop' },
    { id: 'rock', label: 'Rock' },
    { id: '90s', label: '90s' },
    { id: '80s', label: '80s' },
    { id: 'mixed', label: 'Mixed' }
  ];

  // Load quizzes once authenticated
  useEffect(() => {
    if (isAuthenticated && organization && !authLoading) {
      loadQuizzes(organization.id);
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, organization, authLoading]);

  const loadQuizzes = async (orgId: string) => {
    try {
      // For now, show mock quiz data - in real implementation this would come from database
      const mockQuizzes: Quiz[] = [
        {
          id: '1',
          title: 'Britney Spears Trivia',
          description: 'Test your knowledge of Britney Spears hits',
          category: 'pop',
          difficulty: 'Medium',
          is_premium: false,
          player_count: 15420,
          average_score: 85,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'GREATEST HITS EVER',
          description: 'The ultimate karaoke challenge',
          category: 'mixed',
          difficulty: 'Hard',
          is_premium: true,
          player_count: 8750,
          average_score: 72,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: '90s Hits Challenge',
          description: 'Relive the 90s with these classics',
          category: '90s',
          difficulty: 'Easy',
          is_premium: false,
          player_count: 23100,
          average_score: 90,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          title: '80s Hits Totally Tubular',
          description: 'Totally tubular 80s karaoke quiz',
          category: '80s',
          difficulty: 'Medium',
          is_premium: false,
          player_count: 18900,
          average_score: 78,
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          title: 'Rock Legends Quiz',
          description: 'Test your knowledge of rock anthems',
          category: 'rock',
          difficulty: 'Hard',
          is_premium: true,
          player_count: 12300,
          average_score: 65,
          created_at: new Date().toISOString()
        },
        {
          id: '6',
          title: 'Pop Star Showdown',
          description: 'Who knows more about pop music?',
          category: 'pop',
          difficulty: 'Medium',
          is_premium: false,
          player_count: 31200,
          average_score: 82,
          created_at: new Date().toISOString()
        }
      ];

      setQuizzes(mockQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quizzes',
        variant: 'destructive'
      });
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    if (quiz.is_premium && !isPremium) {
      toast({
        title: 'Premium Required',
        description: 'Upgrade to premium to access this quiz',
        variant: 'destructive'
      });
      return;
    }

    // In a real implementation, this would navigate to quiz gameplay
    toast({
      title: 'Starting Quiz',
      description: `Loading "${quiz.title}"...`,
    });
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || quiz.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (authLoading || loading) {
    return (
      <KaraokeLayout title="Quizzes" currentPage="quizzes">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading quizzes...</p>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  return (
    <KaraokeLayout title="Quizzes" currentPage="quizzes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Karaoke Quizzes</h1>
            <p className="text-gray-400 mt-1">Test your music knowledge and compete with friends</p>
          </div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-pink-400" />
            <span className="text-white font-semibold">{quizzes.length} quizzes available</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "bg-pink-600 hover:bg-pink-700" : ""}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Quiz Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="karaoke-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-6 h-6 text-pink-400" />
                <div>
                  <p className="text-xl font-bold text-white">{quizzes.length}</p>
                  <p className="text-gray-400 text-sm">Total Quizzes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="karaoke-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-xl font-bold text-white">
                    {quizzes.reduce((sum, quiz) => sum + quiz.player_count, 0).toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm">Total Plays</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="karaoke-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-xl font-bold text-white">
                    {quizzes.filter(quiz => quiz.is_premium).length}
                  </p>
                  <p className="text-gray-400 text-sm">Premium Quizzes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="karaoke-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-xl font-bold text-white">
                    {Math.round(quizzes.reduce((sum, quiz) => sum + (quiz.average_score || 0), 0) / quizzes.length)}%
                  </p>
                  <p className="text-gray-400 text-sm">Avg. Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quizzes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <PremiumGate
              key={quiz.id}
              isPremium={isPremium}
              feature="quiz"
              compact={!isPremium && quiz.is_premium}
              fallback={
                <Card className="karaoke-card group hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-white text-lg truncate">
                          {quiz.title}
                        </CardTitle>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {quiz.description}
                        </p>
                      </div>
                      {quiz.is_premium && (
                        <Badge variant="outline" className="border-pink-500/50 text-pink-400 ml-2">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Quiz Meta */}
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={`${getDifficultyColor(quiz.difficulty)} text-white`}>
                          {quiz.difficulty}
                        </Badge>
                        <span className="text-gray-400 capitalize">{quiz.category}</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{quiz.player_count.toLocaleString()} played</span>
                        </div>
                        {quiz.average_score && (
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            <span>{quiz.average_score}% avg</span>
                          </div>
                        )}
                      </div>

                      {/* Play Button */}
                      <Button
                        onClick={() => startQuiz(quiz)}
                        disabled={quiz.is_premium && !isPremium}
                        className="w-full karaoke-btn-primary"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {quiz.is_premium && !isPremium ? 'Premium Required' : 'Start Quiz'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <Card className="karaoke-card group hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-lg truncate">
                        {quiz.title}
                      </CardTitle>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {quiz.description}
                      </p>
                    </div>
                    {quiz.is_premium && (
                      <Badge variant="outline" className="border-pink-500/50 text-pink-400 ml-2">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Quiz Meta */}
                    <div className="flex items-center justify-between text-sm">
                      <Badge className={`${getDifficultyColor(quiz.difficulty)} text-white`}>
                        {quiz.difficulty}
                      </Badge>
                      <span className="text-gray-400 capitalize">{quiz.category}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{quiz.player_count.toLocaleString()} played</span>
                      </div>
                      {quiz.average_score && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          <span>{quiz.average_score}% avg</span>
                        </div>
                      )}
                    </div>

                    {/* Play Button */}
                    <Button
                      onClick={() => startQuiz(quiz)}
                      className="w-full karaoke-btn-primary"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </PremiumGate>
          ))}
        </div>

        {filteredQuizzes.length === 0 && (
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? 'No quizzes found' : 'No quizzes available'}
            </h3>
            <p className="text-gray-400">
              {searchQuery
                ? 'Try adjusting your search terms or category filter'
                : 'Check back later for new quiz content'
              }
            </p>
          </div>
        )}
      </div>
    </KaraokeLayout>
  );
}