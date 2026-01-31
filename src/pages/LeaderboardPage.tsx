import { useState } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, User, Eye, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useRankLeaderboard, type RankLeaderboardEntry } from '@/hooks/useRankLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ENTRIES_PER_PAGE = 10;

const LeaderboardPage = () => {
  const [mode, setMode] = useState<'portfolio' | 'rank'>('portfolio');

  const { data: portfolioLeaderboard, isLoading: portfolioLoading, error: portfolioError } = useLeaderboard();
  const { data: rankLeaderboard, isLoading: rankLoading, error: rankError } = useRankLeaderboard();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  const leaderboard = mode === 'portfolio' ? portfolioLeaderboard : rankLeaderboard;
  const isLoading = mode === 'portfolio' ? portfolioLoading : rankLoading;
  const error = mode === 'portfolio' ? portfolioError : rankError;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-primary" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-accent-foreground" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser && rank > 10) return 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/40';
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

  const renderRankEntry = (entry: RankLeaderboardEntry, showSeparator = false) => (
    <div key={entry.rank}>
      {showSeparator && (
        <div className="flex items-center gap-2 my-3 text-muted-foreground text-sm">
          <div className="flex-1 border-t border-dashed" />
          <span>Your Ranking</span>
          <div className="flex-1 border-t border-dashed" />
        </div>
      )}
      <div
        className={`flex items-center justify-between p-4 rounded-lg border ${getRankBg(entry.rank, entry.is_current_user)} transition-colors hover:bg-secondary/50`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            {getRankIcon(entry.rank)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{entry.display_name}</p>
              {entry.is_current_user && (
                <Badge variant="outline" className="text-xs gap-1 border-primary text-primary">
                  <Star className="w-3 h-3" />
                  You
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{entry.rank_name} · {entry.xp.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {entry.profile_public && !entry.is_current_user && (
            <Link to={`/profile/${entry.user_id}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <User className="w-4 h-4" />
                View
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-destructive">Unable to load leaderboard</div>
          <div className="text-sm text-muted-foreground">Please try again later</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Trophy className="w-12 h-12 text-muted-foreground" />
          <div className="text-lg font-semibold">No leaderboard data yet</div>
          <div className="text-sm text-muted-foreground">Start trading to appear on the leaderboard!</div>
          <Button asChild>
            <Link to="/trade">Start Trading</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const enrichedLeaderboard = (leaderboard || []).map((entry: any) => ({
    ...entry,
    is_current_user: entry.is_current_user || entry.user_id === user?.id,
  }));

  // Separate top 3 for featured cards
  const top3 = enrichedLeaderboard.filter((entry) => entry.rank <= 3);
  
  // Get current user entry for special handling
  const currentUserEntry = enrichedLeaderboard.find((entry) => entry.is_current_user);
  
  // Get all ranked entries (excluding current user if they're outside top 100)
  const allRankedEntries = enrichedLeaderboard.filter((entry) => entry.rank <= 100);
  
  // Pagination logic
  const totalPages = Math.ceil(allRankedEntries.length / ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
  const endIndex = startIndex + ENTRIES_PER_PAGE;
  const currentPageEntries = allRankedEntries.slice(startIndex, endIndex);
  
  // Check if current user is outside top 100
  const isUserOutsideTop100 = !!currentUserEntry && currentUserEntry.rank > 100;

  const renderPortfolioEntry = (entry: LeaderboardEntry, showSeparator = false) => (
    <div key={entry.rank}>
      {showSeparator && (
        <div className="flex items-center gap-2 my-3 text-muted-foreground text-sm">
          <div className="flex-1 border-t border-dashed" />
          <span>Your Ranking</span>
          <div className="flex-1 border-t border-dashed" />
        </div>
      )}
      <div
        className={`flex items-center justify-between p-4 rounded-lg border ${getRankBg(entry.rank, entry.is_current_user)} transition-colors hover:bg-secondary/50`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            {getRankIcon(entry.rank)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{entry.display_name}</p>
              {entry.is_current_user && (
                <Badge variant="outline" className="text-xs gap-1 border-primary text-primary">
                  <Star className="w-3 h-3" />
                  You
                </Badge>
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
          {entry.profile_public && !entry.is_current_user && (
            <Link to={`/profile/${entry.user_id}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <User className="w-4 h-4" />
                View
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

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

        <div className="flex gap-2">
          <Button
            variant={mode === 'portfolio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('portfolio')}
          >
            Portfolio Value
          </Button>
          <Button
            variant={mode === 'rank' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('rank')}
          >
            Rank
          </Button>
        </div>

        {/* Top 3 Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {top3.map((entry) => (
            <Card key={entry.rank} className={`${getRankBg(entry.rank, entry.is_current_user)} border`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  {getRankIcon(entry.rank)}
                  {mode === 'portfolio' ? (
                    <Badge variant={entry.gain_percent >= 0 ? 'default' : 'destructive'} className="gap-1">
                      {entry.gain_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {entry.gain_percent >= 0 ? '+' : ''}{Number(entry.gain_percent).toFixed(2)}%
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      {entry.rank_name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg truncate">{entry.display_name}</p>
                      {entry.is_current_user && (
                        <Badge variant="outline" className="text-xs border-primary text-primary">You</Badge>
                      )}
                    </div>
                    {mode === 'portfolio' ? (
                      <>
                        <p className="text-2xl font-bold text-primary">
                          ${Number(entry.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Portfolio Value</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-primary">{Number(entry.xp).toLocaleString()} XP</p>
                        <p className="text-xs text-muted-foreground mt-1">{entry.rank_name}</p>
                      </>
                    )}
                  </div>
                  {entry.profile_public && !entry.is_current_user && (
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
            <CardDescription>
              {isUserOutsideTop100 && currentUserEntry
                ? `Top 100 performers + your rank (#${currentUserEntry.rank})`
                : `Top 100 performers (Page ${currentPage} of ${totalPages || 1})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentPageEntries.map((entry) => (
                mode === 'portfolio' ? renderPortfolioEntry(entry) : renderRankEntry(entry)
              ))}
              
              {isUserOutsideTop100 && currentUserEntry && currentPage === totalPages && (
                mode === 'portfolio' ? renderPortfolioEntry(currentUserEntry, true) : renderRankEntry(currentUserEntry, true)
              )}

              {(!enrichedLeaderboard || enrichedLeaderboard.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No rankings yet. Start trading to appear on the leaderboard!</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <span className="px-3 text-muted-foreground">...</span>
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LeaderboardPage;