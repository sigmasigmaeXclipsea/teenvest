import { useState, useMemo } from 'react';
import { 
  Trophy, 
  Target, 
  Zap, 
  Star,
  ChevronRight,
  CheckCircle2,
  Lock,
  Flame,
  Medal,
  TrendingUp,
  BookOpen,
  Briefcase,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTrades } from '@/hooks/useTrades';
import { usePortfolio, useHoldings } from '@/hooks/usePortfolio';
import { useUserProgress } from '@/hooks/useLearning';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'trading' | 'learning' | 'portfolio' | 'streak';
  progress: number;
  target: number;
  xp: number;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

const GameLayer = () => {
  const { user } = useAuth();
  const { data: trades } = useTrades();
  const { data: portfolio } = usePortfolio();
  const { data: holdings } = useHoldings();
  const { data: userProgress } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate challenges based on user data
  const challenges = useMemo((): Challenge[] => {
    const tradeCount = trades?.length || 0;
    const holdingsCount = holdings?.length || 0;
    const lessonsCompleted = userProgress?.filter(p => p.completed).length || 0;
    const cashBalance = portfolio?.cash_balance || 10000;
    const uniqueStocks = new Set(trades?.map(t => t.symbol) || []).size;

    // Calculate sectors owned
    const sectorsOwned = new Set(holdings?.map(h => h.sector).filter(Boolean) || []).size;

    return [
      // Trading challenges
      {
        id: 'first-trade',
        title: 'First Steps',
        description: 'Make your first trade',
        icon: <Briefcase className="w-5 h-5" />,
        category: 'trading',
        progress: Math.min(tradeCount, 1),
        target: 1,
        xp: 50,
        completed: tradeCount >= 1,
        difficulty: 'easy',
      },
      {
        id: 'active-trader',
        title: 'Active Trader',
        description: 'Complete 10 trades',
        icon: <Zap className="w-5 h-5" />,
        category: 'trading',
        progress: Math.min(tradeCount, 10),
        target: 10,
        xp: 200,
        completed: tradeCount >= 10,
        difficulty: 'medium',
      },
      {
        id: 'stock-explorer',
        title: 'Stock Explorer',
        description: 'Trade 5 different stocks',
        icon: <Target className="w-5 h-5" />,
        category: 'trading',
        progress: Math.min(uniqueStocks, 5),
        target: 5,
        xp: 150,
        completed: uniqueStocks >= 5,
        difficulty: 'medium',
      },

      // Portfolio challenges
      {
        id: 'first-position',
        title: 'Portfolio Builder',
        description: 'Hold your first stock position',
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'portfolio',
        progress: Math.min(holdingsCount, 1),
        target: 1,
        xp: 75,
        completed: holdingsCount >= 1,
        difficulty: 'easy',
      },
      {
        id: 'diversified',
        title: 'Diversification Pro',
        description: 'Own stocks in 3 different sectors',
        icon: <Star className="w-5 h-5" />,
        category: 'portfolio',
        progress: Math.min(sectorsOwned, 3),
        target: 3,
        xp: 250,
        completed: sectorsOwned >= 3,
        difficulty: 'medium',
      },
      {
        id: 'five-positions',
        title: 'Growing Portfolio',
        description: 'Build a portfolio with 5 positions',
        icon: <Medal className="w-5 h-5" />,
        category: 'portfolio',
        progress: Math.min(holdingsCount, 5),
        target: 5,
        xp: 300,
        completed: holdingsCount >= 5,
        difficulty: 'hard',
      },

      // Learning challenges
      {
        id: 'first-lesson',
        title: 'Knowledge Seeker',
        description: 'Complete your first lesson',
        icon: <BookOpen className="w-5 h-5" />,
        category: 'learning',
        progress: Math.min(lessonsCompleted, 1),
        target: 1,
        xp: 100,
        completed: lessonsCompleted >= 1,
        difficulty: 'easy',
      },
      {
        id: 'dedicated-learner',
        title: 'Dedicated Learner',
        description: 'Complete 5 lessons',
        icon: <Trophy className="w-5 h-5" />,
        category: 'learning',
        progress: Math.min(lessonsCompleted, 5),
        target: 5,
        xp: 500,
        completed: lessonsCompleted >= 5,
        difficulty: 'hard',
      },

      // Streak/consistency challenges
      {
        id: 'cash-manager',
        title: 'Cash Manager',
        description: 'Keep at least 20% in cash',
        icon: <Clock className="w-5 h-5" />,
        category: 'streak',
        progress: cashBalance >= 2000 ? 1 : 0,
        target: 1,
        xp: 100,
        completed: cashBalance >= 2000,
        difficulty: 'easy',
      },
    ];
  }, [trades, holdings, portfolio, userProgress]);

  const filteredChallenges = selectedCategory === 'all' 
    ? challenges 
    : challenges.filter(c => c.category === selectedCategory);

  const totalXP = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.xp, 0);
  const completedCount = challenges.filter(c => c.completed).length;

  // Calculate level based on XP
  const level = Math.floor(totalXP / 500) + 1;
  const xpToNextLevel = (level * 500) - totalXP;
  const levelProgress = ((totalXP % 500) / 500) * 100;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const categories = [
    { id: 'all', label: 'All', icon: <Star className="w-4 h-4" /> },
    { id: 'trading', label: 'Trading', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'learning', label: 'Learning', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'streak', label: 'Consistency', icon: <Flame className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Level & Progress Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">{level}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Level {level} Investor</h3>
                <p className="text-sm text-muted-foreground">
                  {totalXP} XP earned · {completedCount}/{challenges.length} challenges
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary">
                <Zap className="w-4 h-4" />
                <span className="font-semibold">{xpToNextLevel} XP to next level</span>
              </div>
            </div>
          </div>
          <Progress value={levelProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Challenges Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Challenges
          </CardTitle>
          <CardDescription>Complete challenges to earn XP and level up</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="gap-1"
              >
                {cat.icon}
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Challenges list */}
          <div className="space-y-3">
            {filteredChallenges.map(challenge => (
              <div 
                key={challenge.id}
                className={`p-4 rounded-lg border transition-all ${
                  challenge.completed 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-card hover:bg-secondary/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    challenge.completed ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}>
                    {challenge.completed ? <CheckCircle2 className="w-5 h-5" /> : challenge.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{challenge.title}</span>
                      <Badge className={`text-xs ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </Badge>
                      {challenge.completed && (
                        <Badge className="bg-primary/20 text-primary text-xs">
                          +{challenge.xp} XP
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    
                    {!challenge.completed && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>{challenge.progress}/{challenge.target}</span>
                          <span>{Math.round((challenge.progress / challenge.target) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(challenge.progress / challenge.target) * 100} 
                          className="h-1.5" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    {!challenge.completed && (
                      <span className="text-sm font-medium text-primary">+{challenge.xp} XP</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/trade">
                <Button variant="outline" className="w-full gap-2">
                  <Briefcase className="w-4 h-4" />
                  Make a Trade
                </Button>
              </Link>
              <Link to="/learn">
                <Button variant="outline" className="w-full gap-2">
                  <BookOpen className="w-4 h-4" />
                  Learn Something
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameLayer;
