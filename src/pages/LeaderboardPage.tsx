import { Trophy, Medal, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';

const LeaderboardPage = () => {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { user } = useAuth();

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/20';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/20';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/10 to-amber-600/5 border-amber-600/20';
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
          {leaderboard?.slice(0, 3).map((entry, index) => (
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
                <p className="font-semibold text-lg truncate">{entry.display_name}</p>
                <p className="text-2xl font-bold text-primary">
                  ${entry.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Portfolio Value</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>All Rankings</CardTitle>
            <CardDescription>Top 10 performers by portfolio gain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard?.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 rounded-lg border ${getRankBg(entry.rank)} transition-colors hover:bg-secondary/50`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <p className="font-semibold">{entry.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${entry.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 font-semibold ${entry.gain_percent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {entry.gain_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {entry.gain_percent >= 0 ? '+' : ''}{entry.gain_percent.toFixed(2)}%
                  </div>
                </div>
              ))}

              {(!leaderboard || leaderboard.length === 0) && (
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