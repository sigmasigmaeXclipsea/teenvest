import { Trophy, Medal, TrendingUp, TrendingDown, User, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const LeaderboardPage = () => {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { user } = useAuth();

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-primary" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-accent-foreground" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-primary/20 to-primary/5 border-primary/30';
    if (rank === 2) return 'bg-gradient-to-r from-muted to-muted/50 border-muted-foreground/20';
    if (rank === 3) return 'bg-gradient-to-r from-accent/30 to-accent/10 border-accent/30';
    return 'bg-card';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading leaderboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Type the leaderboard data properly
  const typedLeaderboard = leaderboard as LeaderboardEntry[] | undefined;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-primary" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">See how you rank against other teen investors</p>
        </div>

        {/* Top 3 Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {typedLeaderboard?.slice(0, 3).map((entry) => (
            <Card key={entry.rank} className={`${getRankBg(entry.rank)} border`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  {getRankIcon(entry.rank)}
                  <Badge variant={entry.gain_percent >= 0 ? 'default' : 'destructive'} className="gap-1">
                    {entry.gain_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {entry.gain_percent >= 0 ? '+' : ''}{entry.gain_percent.toFixed(2)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg truncate">{entry.display_name}</p>
                    <p className="text-2xl font-bold text-primary">
                      ${entry.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Cash Balance</p>
                  </div>
                  {entry.profile_public && entry.user_id !== user?.id && (
                    <Link to={`/profile/${entry.user_id}`}>
                      <Button variant="ghost" size="icon" title="View Profile">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>All Rankings</CardTitle>
            <CardDescription>Top 10 performers by cash growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {typedLeaderboard?.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 rounded-lg border ${getRankBg(entry.rank)} transition-colors hover:bg-secondary/50`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{entry.display_name}</p>
                        {entry.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${entry.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 font-semibold ${entry.gain_percent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {entry.gain_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {entry.gain_percent >= 0 ? '+' : ''}{entry.gain_percent.toFixed(2)}%
                    </div>
                    {entry.profile_public && entry.user_id !== user?.id && (
                      <Link to={`/profile/${entry.user_id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <User className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}

              {(!typedLeaderboard || typedLeaderboard.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No rankings yet. Start trading to appear on the leaderboard!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LeaderboardPage;
