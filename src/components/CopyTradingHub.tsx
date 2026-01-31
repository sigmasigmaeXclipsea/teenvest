import { Users, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useCopyTrading } from '@/hooks/useCopyTrading';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const CopyTradingHub = () => {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { user } = useAuth();
  const { copiedIds, isCopied, toggleCopy, getFollowerCount, currentUserFollowers, latestFollowerDelta } =
    useCopyTrading();

  const topPerformers = (leaderboard || [])
    .filter((entry) => entry.user_id !== user?.id)
    .slice(0, 5);
  const copiedEntries = copiedIds
    .map((id) => leaderboard?.find((entry) => entry.user_id === id))
    .filter((entry): entry is LeaderboardEntry => Boolean(entry));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Copy Trading
        </CardTitle>
        <CardDescription>Mirror top paper portfolios and track phantom performance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-secondary/50 p-3 flex items-center justify-between text-sm">
          <div>
            <div className="font-medium">People copying you</div>
            <div className="text-xs text-muted-foreground">Followers mirroring your paper portfolio.</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{currentUserFollowers}</div>
            {latestFollowerDelta > 0 && (
              <div className="text-xs text-primary">+{latestFollowerDelta} today</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Your Phantom Portfolios</div>
          {copiedEntries.length > 0 ? (
            <div className="space-y-2">
              {copiedEntries.map((entry) => (
                <div
                  key={entry.user_id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{entry.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.gain_percent >= 0 ? '+' : ''}
                      {entry.gain_percent.toFixed(2)}% phantom return
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.profile_public && (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/profile/${entry.user_id}`}>View</Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleCopy(entry.user_id, entry.display_name)}
                    >
                      Stop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No copied portfolios yet. Pick a top performer below to start your phantom feed.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Top performers to copy</div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading leaderboard...</div>
          ) : (
            <div className="space-y-2">
              {topPerformers.map((entry) => {
                const copied = isCopied(entry.user_id);
                return (
                  <div
                    key={entry.user_id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{entry.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.gain_percent >= 0 ? '+' : ''}
                        {entry.gain_percent.toFixed(2)}% · {getFollowerCount(entry.user_id)} copiers
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.rank <= 3 && <Badge variant="outline">Top {entry.rank}</Badge>}
                      <Button
                        size="sm"
                        variant={copied ? 'secondary' : 'outline'}
                        onClick={() => toggleCopy(entry.user_id, entry.display_name)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                );
              })}
              {topPerformers.length === 0 && (
                <div className="text-sm text-muted-foreground">No leaderboard data yet.</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CopyTradingHub;
