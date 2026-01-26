import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Lock, DollarSign, ArrowLeft, Shield, UserPlus, Trash2, Crown, Loader2,
  Users, TrendingUp, BarChart3, RefreshCw, Search, Award, Activity,
  BookOpen, Briefcase, ArrowUpRight, ArrowDownRight, Sprout, Coins, Zap
} from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMessages';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const OWNER_EMAIL = '2landonl10@gmail.com';

type RecentTradeRow = {
  id: string;
  user_email?: string | null;
  user_name?: string | null;
  symbol?: string | null;
  trade_type?: string | null;
  shares?: number | null;
  price?: number | null;
  total_amount?: number | null;
  created_at: string;
};

type RecentTrade = {
  id: string;
  user_email: string;
  user_name: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  shares: number;
  price: number;
  total_amount: number;
  created_at: string;
};

type AchievementOption = {
  id: string;
  name: string;
  icon: string;
  description?: string | null;
};

type AdminEntry = {
  user_id: string;
  email: string;
  created_at: string;
};

type LookupUser = {
  found: boolean;
  display_name?: string | null;
  email?: string | null;
  created_at?: string | null;
  cash_balance?: number | null;
  starting_balance?: number | null;
  holdings_count?: number | null;
  trades_count?: number | null;
  total_invested?: number | null;
  lessons_completed?: number | null;
  achievements_earned?: number | null;
};

type AdminResult = {
  success?: boolean;
  error?: string;
};

type ResetPortfolioResult = AdminResult & {
  reset_balance?: number;
};

type GrantAchievementResult = AdminResult & {
  achievement?: string;
};

type StartingBalanceResult = AdminResult & {
  new_balance?: number;
};

type CashBalanceResult = AdminResult & {
  new_balance?: number;
};

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: portfolio } = usePortfolio();
  
  const [newCashBalance, setNewCashBalance] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [achievementEmail, setAchievementEmail] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState('');
  const [startingBalanceEmail, setStartingBalanceEmail] = useState('');
  const [newStartingBalance, setNewStartingBalance] = useState('');
  const [cashBalanceEmail, setCashBalanceEmail] = useState('');
  const [newCashBalanceForUser, setNewCashBalanceForUser] = useState('');
  
  // Garden money management state
  const [gardenMoneyEmail, setGardenMoneyEmail] = useState('');
  const [newGardenMoney, setNewGardenMoney] = useState('');
  const [gardenXpEmail, setGardenXpEmail] = useState('');
  const [newGardenXp, setNewGardenXp] = useState('');
  const [currentGardenMoney, setCurrentGardenMoney] = useState(0);
  const [currentGardenXp, setCurrentGardenXp] = useState(0);

  // Load current admin garden state
  const { data: adminGardenState, refetch: refetchAdminGarden } = useQuery({
    queryKey: ['admin-garden-state', user?.id],
    queryFn: async () => {
      // @ts-ignore - Function exists but types haven't been generated yet
      const { data, error } = await supabase.rpc('admin_get_garden_state', { 
        _user_id: user?.id 
      });
      if (error) throw error;
      return data?.[0] || { money: 0, xp: 0 };
    },
    enabled: !!user && hasAdminRole === true,
  });

  // Update current garden state when data loads
  useEffect(() => {
    if (adminGardenState) {
      setCurrentGardenMoney(adminGardenState.money || 0);
      setCurrentGardenXp(adminGardenState.xp || 0);
    }
  }, [adminGardenState]);
  
  const isOwner = user?.email === OWNER_EMAIL;

  // Check if user has admin role
  const { data: hasAdminRole, isLoading: checkingRole } = useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      if (isOwner) return true;
      
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (error) return false;
      return data === true;
    },
    enabled: !!user,
  });

  // Platform statistics
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_platform_stats');
      if (error) throw error;
      return data as {
        total_users: number;
        total_trades: number;
        total_trades_today: number;
        total_buy_orders: number;
        total_sell_orders: number;
        total_volume: number;
        active_holdings: number;
        unique_stocks_traded: number;
        avg_portfolio_value: number;
        completed_lessons: number;
      };
    },
    enabled: hasAdminRole === true,
  });

  // Recent platform trades with pagination
  const [tradesLimit, setTradesLimit] = useState(50);
  
  const { data: recentTrades, isLoading: loadingTrades, error: tradesError, refetch: refetchTrades } = useQuery({
    queryKey: ['recent-platform-trades', tradesLimit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_platform_trades', { _limit: tradesLimit });
      if (error) {
        console.error('Recent trades error:', error);
        throw error;
      }
      // Ensure data is an array and has all required fields
      const trades = Array.isArray(data) ? (data as RecentTradeRow[]) : [];
      return trades.map((trade): RecentTrade => ({
        id: trade.id,
        user_email: trade.user_email || 'unknown',
        user_name: trade.user_name || trade.user_email || 'Unknown User',
        symbol: trade.symbol || '',
        trade_type: trade.trade_type === 'sell' ? 'sell' : 'buy',
        shares: Number(trade.shares) || 0,
        price: Number(trade.price) || 0,
        total_amount: Number(trade.total_amount ?? (Number(trade.shares) || 0) * (Number(trade.price) || 0)) || 0,
        created_at: trade.created_at,
      }));
    },
    enabled: hasAdminRole === true,
    retry: 1,
  });

  // All achievements for dropdown
  const { data: achievements } = useQuery({
    queryKey: ['all-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_achievements');
      if (error) throw error;
      return (data as AchievementOption[]) || [];
    },
    enabled: hasAdminRole === true,
  });

  // Admins list (owner only)
  const { data: admins, isLoading: loadingAdmins } = useQuery({
    queryKey: ['all-admins'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_admins');
      if (error) return [];
      return (data as AdminEntry[]) || [];
    },
    enabled: isOwner,
  });

  // User lookup state
  const [lookedUpUser, setLookedUpUser] = useState<LookupUser | null>(null);

  // Mutations
  const addAdminMutation = useMutation<AdminResult, Error, string>({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('add_admin_by_email', { _email: email });
      if (error) throw error;
      return data as AdminResult;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success('Admin added successfully');
        setNewAdminEmail('');
        queryClient.invalidateQueries({ queryKey: ['all-admins'] });
      } else {
        toast.error(data?.error || 'Failed to add admin');
      }
    },
    onError: (error: unknown) => toast.error(getUserFriendlyError(error)),
  });

  const removeAdminMutation = useMutation<AdminResult, Error, string>({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('remove_admin_by_email', { _email: email });
      if (error) throw error;
      return data as AdminResult;
    },
    onSuccess: () => {
      toast.success('Admin removed');
      queryClient.invalidateQueries({ queryKey: ['all-admins'] });
    },
    onError: (error: unknown) => toast.error(getUserFriendlyError(error)),
  });

  const resetPortfolioMutation = useMutation<ResetPortfolioResult, Error, string>({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('admin_reset_portfolio', { _target_email: email });
      if (error) throw error;
      return data as ResetPortfolioResult;
    },
    onSuccess: (data) => {
      if (data?.success) {
        const resetBalance = data.reset_balance ?? 0;
        toast.success(`Portfolio reset to $${resetBalance.toLocaleString()}`);
        setResetEmail('');
        queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        refetchStats();
      } else {
        toast.error(data?.error || 'Failed to reset portfolio');
      }
    },
    onError: (error: unknown) => toast.error(getUserFriendlyError(error)),
  });

  const grantAchievementMutation = useMutation<GrantAchievementResult, Error, { email: string; achievement: string }>({
    mutationFn: async ({ email, achievement }: { email: string; achievement: string }) => {
      const { data, error } = await supabase.rpc('admin_grant_achievement', { 
        _email: email, 
        _achievement_name: achievement 
      });
      if (error) throw error;
      return data as GrantAchievementResult;
    },
    onSuccess: (data) => {
      if (data?.success) {
        const achievementName = data.achievement ?? 'Achievement';
        toast.success(`Achievement "${achievementName}" granted!`);
        setAchievementEmail('');
        setSelectedAchievement('');
      } else {
        toast.error(data?.error || 'Failed to grant achievement');
      }
    },
    onError: (error: unknown) => toast.error(getUserFriendlyError(error)),
  });

  const setStartingBalanceMutation = useMutation<StartingBalanceResult, Error, { email: string; balance: number }>({
    mutationFn: async ({ email, balance }: { email: string; balance: number }) => {
      const { data, error } = await supabase.rpc('admin_set_starting_balance', { 
        _email: email, 
        _new_balance: balance 
      });
      if (error) throw error;
      return data as StartingBalanceResult;
    },
    onSuccess: (data) => {
      if (data?.success) {
        const newBalance = data.new_balance ?? 0;
        toast.success(`Starting balance set to $${newBalance.toLocaleString()}`);
        setStartingBalanceEmail('');
        setNewStartingBalance('');
      } else {
        toast.error(data?.error || 'Failed to update starting balance');
      }
    },
    onError: (error: unknown) => toast.error(getUserFriendlyError(error)),
  });

  const updateCashBalanceMutation = useMutation<CashBalanceResult, Error, { email: string; balance: number }>({
    mutationFn: async ({ email, balance }: { email: string; balance: number }) => {
      // Get user ID from email first
      const { data: userId, error: lookupError } = await supabase.rpc('get_user_id_by_email', { 
        _email: email 
      });
      if (lookupError || !userId) throw new Error('User not found');
      
      // Update cash balance
      // @ts-ignore - Function exists but types haven't been generated yet
      const { data, error } = await supabase.rpc('admin_update_cash_balance', { 
        _user_id: userId, 
        _new_balance: balance 
      });
      if (error) throw error;
      return data as CashBalanceResult;
    },
    onSuccess: (data, variables) => {
      toast.success(`Updated cash balance for ${variables.email} to $${variables.balance.toLocaleString()}`);
      setNewCashBalanceForUser('');
      queryClient.invalidateQueries({ queryKey: ['user-lookup', lookupEmail] });
    },
    onError: (error: unknown) => toast.error(getUserFriendlyError(error)),
  });

  const updateGardenMoneyMutation = useMutation<any, Error, { email: string; money: number }>({
    mutationFn: async ({ email, money }: { email: string; money: number }) => {
      // Get user ID from email first
      const { data: userId, error: lookupError } = await supabase.rpc('get_user_id_by_email', { 
        _email: email 
      });
      if (lookupError || !userId) throw new Error('User not found');
      
      // Update garden money
      // @ts-ignore - Function exists but types haven't been generated yet
      const { data, error } = await supabase.rpc('admin_update_garden_money', { 
        _user_id: userId, 
        _new_money: money 
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Updated garden money for ${variables.email} to ${variables.money} coins`);
      setNewGardenMoney('');
      queryClient.invalidateQueries({ queryKey: ['user-lookup', gardenMoneyEmail] });
    },
    onError: (error: unknown) => toast.error(getUserFriendlyError(error)),
  });

  const updateGardenXpMutation = useMutation<any, Error, { email: string; xp: number }>({
    mutationFn: async ({ email, xp }: { email: string; xp: number }) => {
      // Get user ID from email first
      const { data: userId, error: lookupError } = await supabase.rpc('get_user_id_by_email', { 
        _email: email 
      });
      if (lookupError || !userId) throw new Error('User not found');
      
      // Update garden XP
      // @ts-ignore - Function exists but types haven't been generated yet
      const { data, error } = await supabase.rpc('admin_update_garden_xp', { 
        _user_id: userId, 
        _new_xp: xp 
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Updated garden XP for ${variables.email} to ${variables.xp} XP`);
      setNewGardenXp('');
      queryClient.invalidateQueries({ queryKey: ['user-lookup', gardenXpEmail] });
    },
    onError: (error: unknown) => toast.error(getUserFriendlyError(error)),
  });

  const updateCurrentUserGardenMutation = useMutation<any, Error, { money: number; xp: number }>({
    mutationFn: async ({ money, xp }: { money: number; xp: number }) => {
      // Update current user's garden state directly
      // @ts-ignore - Function exists but types haven't been generated yet
      const { data, error } = await supabase.rpc('admin_update_garden_state', { 
        _user_id: user?.id, 
        _new_money: money, 
        _new_xp: xp 
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Updated your garden: ${variables.money} coins, ${variables.xp} XP`);
      setCurrentGardenMoney(variables.money);
      setCurrentGardenXp(variables.xp);
      refetchAdminGarden(); // Refresh the garden state
    },
    onError: (error: unknown) => toast.error(getUserFriendlyError(error)),
  });

  const handleUpdateCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cashValue = parseFloat(newCashBalance);
    if (isNaN(cashValue) || cashValue < 0) {
      toast.error('Please enter a valid cash amount');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('portfolios')
        .update({ cash_balance: cashValue })
        .eq('user_id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success(`Cash balance updated to $${cashValue.toLocaleString()}`);
      setNewCashBalance('');
    } catch (error: unknown) {
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLookupUser = async (e?: React.FormEvent | { preventDefault: () => void }) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!lookupEmail.trim()) return;

    try {
      const { data, error } = await supabase.rpc('admin_lookup_user', { _email: lookupEmail.trim() });
      if (error) throw error;
      const userData = data as LookupUser | null;
      setLookedUpUser(userData);
      if (!userData?.found) {
        toast.error('User not found');
      }
    } catch (error: unknown) {
      toast.error(getUserFriendlyError(error));
    }
  };

  // Loading state
  if (checkingRole) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Access denied
  if (!hasAdminRole) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the admin panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              {isOwner ? (
                <span className="flex items-center gap-1">
                  <Crown className="w-4 h-4 text-primary" />
                  Owner Access
                </span>
              ) : (
                'Admin Access'
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchTrades(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '...' : stats?.total_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '...' : stats?.total_trades || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.total_trades_today || 0} today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trading Volume</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${loadingStats ? '...' : Number(stats?.total_volume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lessons Completed</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '...' : stats?.completed_lessons || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            {isOwner && <TabsTrigger value="admins">Admins</TabsTrigger>}
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Platform Trades</CardTitle>
                  <CardDescription>Showing {recentTrades?.length || 0} trades across all users</CardDescription>
                </div>
                <Select value={tradesLimit.toString()} onValueChange={(v) => setTradesLimit(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">Last 25</SelectItem>
                    <SelectItem value="50">Last 50</SelectItem>
                    <SelectItem value="100">Last 100</SelectItem>
                    <SelectItem value="250">Last 250</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {loadingTrades ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : tradesError ? (
                  <div className="text-center py-8">
                    <p className="font-medium text-destructive mb-2">Error loading trades</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {(tradesError as Error)?.message || 'Unknown error'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      This may be a database function issue. Check Supabase logs.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetchTrades()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : recentTrades && recentTrades.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-2">
                      {recentTrades.map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary/70 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`p-2 rounded-lg ${trade.trade_type === 'buy' ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                              {trade.trade_type === 'buy' ? (
                                <ArrowUpRight className="w-5 h-5 text-primary" />
                              ) : (
                                <ArrowDownRight className="w-5 h-5 text-destructive" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-lg">{trade.symbol}</p>
                                <Badge variant={trade.trade_type === 'buy' ? 'default' : 'destructive'} className="text-xs">
                                  {trade.trade_type.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm font-semibold text-foreground">{trade.user_name || trade.user_email}</p>
                              <p className="text-xs text-muted-foreground">{trade.user_email}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(trade.created_at).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm text-muted-foreground mb-1">Shares</p>
                            <p className="font-semibold text-base">{Number(trade.shares).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground mt-2 mb-1">Price</p>
                            <p className="font-semibold text-base">${Number(trade.price).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground mt-2 mb-1">Total</p>
                            <p className="font-bold text-lg text-primary">
                              ${Number(trade.total_amount || (trade.shares * trade.price)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No trades yet</p>
                )}
              </CardContent>
            </Card>

            {/* More Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Buy Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">{stats?.total_buy_orders || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sell Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-destructive">{stats?.total_sell_orders || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Unique Stocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats?.unique_stocks_traded || 0}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* User Lookup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  User Lookup
                </CardTitle>
                <CardDescription>Search for a user by email to view their details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLookupUser} className="flex gap-2">
                  <Input
                    type="email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="flex-1"
                  />
                  <Button type="submit">Lookup</Button>
                </form>

                {lookedUpUser?.found && (
                  <div className="p-4 rounded-lg bg-secondary/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{lookedUpUser.display_name}</p>
                        <p className="text-sm text-muted-foreground">{lookedUpUser.email}</p>
                      </div>
                      <Badge variant="outline">
                        Joined {new Date(lookedUpUser.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Cash Balance</p>
                        <p className="font-semibold">${Number(lookedUpUser.cash_balance).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Starting Balance</p>
                        <p className="font-semibold">${Number(lookedUpUser.starting_balance).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Holdings</p>
                        <p className="font-semibold">{lookedUpUser.holdings_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Trades</p>
                        <p className="font-semibold">{lookedUpUser.trades_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Invested</p>
                        <p className="font-semibold">${Number(lookedUpUser.total_invested).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lessons Done</p>
                        <p className="font-semibold">{lookedUpUser.lessons_completed}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Achievements</p>
                        <p className="font-semibold">{lookedUpUser.achievements_earned}</p>
                      </div>
                    </div>
                    
                    {/* Update Cash Balance */}
                    <div className="pt-4 border-t border-border/50">
                      <Label className="text-sm font-semibold mb-2 block">Update Cash Balance</Label>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          updateCashBalanceMutation.mutate({ 
                            email: lookupEmail.trim(), 
                            balance: parseFloat(newCashBalanceForUser) 
                          });
                        }} 
                        className="flex gap-2"
                      >
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newCashBalanceForUser}
                            onChange={(e) => setNewCashBalanceForUser(e.target.value)}
                            placeholder="10000.00"
                            className="pl-9"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          disabled={updateCashBalanceMutation.isPending || !newCashBalanceForUser}
                        >
                          {updateCashBalanceMutation.isPending ? 'Updating...' : 'Update Cash'}
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* My Cash Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    My Cash Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-xl font-bold text-primary">
                      ${portfolio?.cash_balance?.toLocaleString() ?? '0'}
                    </p>
                  </div>
                  <form onSubmit={handleUpdateCash} className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newCashBalance}
                        onChange={(e) => setNewCashBalance(e.target.value)}
                        placeholder="10000.00"
                        className="pl-9"
                      />
                    </div>
                    <Button type="submit" disabled={isUpdating || !newCashBalance}>
                      {isUpdating ? 'Updating...' : 'Update'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Reset Portfolio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Reset User Portfolio
                  </CardTitle>
                  <CardDescription>Delete all trades & holdings, reset to starting balance</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); resetPortfolioMutation.mutate(resetEmail); }} className="flex gap-2">
                    <Input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      variant="destructive"
                      disabled={resetPortfolioMutation.isPending || !resetEmail.trim()}
                    >
                      Reset
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Grant Achievement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Grant Achievement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="email"
                    value={achievementEmail}
                    onChange={(e) => setAchievementEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                  <Select value={selectedAchievement} onValueChange={setSelectedAchievement}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select achievement" />
                    </SelectTrigger>
                    <SelectContent>
                      {achievements?.map((a) => (
                        <SelectItem key={a.id} value={a.name}>
                          {a.icon} {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => grantAchievementMutation.mutate({ email: achievementEmail, achievement: selectedAchievement })}
                    disabled={grantAchievementMutation.isPending || !achievementEmail || !selectedAchievement}
                    className="w-full"
                  >
                    Grant Achievement
                  </Button>
                </CardContent>
              </Card>

              {/* Set Starting Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Set Starting Balance
                  </CardTitle>
                  <CardDescription>Change a user's baseline for gain/loss calculation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="email"
                    value={startingBalanceEmail}
                    onChange={(e) => setStartingBalanceEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newStartingBalance}
                      onChange={(e) => setNewStartingBalance(e.target.value)}
                      placeholder="10000.00"
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={() => setStartingBalanceMutation.mutate({ 
                      email: startingBalanceEmail, 
                      balance: parseFloat(newStartingBalance) 
                    })}
                    disabled={setStartingBalanceMutation.isPending || !startingBalanceEmail || !newStartingBalance}
                    className="w-full"
                  >
                    Update Starting Balance
                  </Button>
                </CardContent>
              </Card>

              {/* Garden Money Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-green-600" />
                    My Garden State
                  </CardTitle>
                  <CardDescription>Update your own garden money and XP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground">Current Money</p>
                      <p className="text-xl font-bold text-green-600">
                        {adminGardenState ? adminGardenState.money.toLocaleString() : '...'} coins
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground">Current XP</p>
                      <p className="text-xl font-bold text-purple-600">
                        {adminGardenState ? adminGardenState.xp.toLocaleString() : '...'} XP
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        value={newGardenMoney}
                        onChange={(e) => setNewGardenMoney(e.target.value)}
                        placeholder="1000"
                        className="pl-9"
                      />
                    </div>
                    <div className="relative">
                      <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        value={newGardenXp}
                        onChange={(e) => setNewGardenXp(e.target.value)}
                        placeholder="500"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => updateCurrentUserGardenMutation.mutate({ 
                      money: parseInt(newGardenMoney) || (adminGardenState?.money || 0), 
                      xp: parseInt(newGardenXp) || (adminGardenState?.xp || 0)
                    })}
                    disabled={updateCurrentUserGardenMutation.isPending}
                    className="w-full"
                  >
                    {updateCurrentUserGardenMutation.isPending ? 'Updating...' : 'Update My Garden'}
                  </Button>
                </CardContent>
              </Card>

              {/* Set User Garden Money */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-green-600" />
                    Set User Garden Money
                  </CardTitle>
                  <CardDescription>Update any user's garden money balance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="email"
                    value={gardenMoneyEmail}
                    onChange={(e) => setGardenMoneyEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      value={newGardenMoney}
                      onChange={(e) => setNewGardenMoney(e.target.value)}
                      placeholder="1000"
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={() => updateGardenMoneyMutation.mutate({ 
                      email: gardenMoneyEmail, 
                      money: parseInt(newGardenMoney) 
                    })}
                    disabled={updateGardenMoneyMutation.isPending || !gardenMoneyEmail || !newGardenMoney}
                    className="w-full"
                  >
                    {updateGardenMoneyMutation.isPending ? 'Updating...' : 'Update Garden Money'}
                  </Button>
                </CardContent>
              </Card>

              {/* Set User Garden XP */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Set User Garden XP
                  </CardTitle>
                  <CardDescription>Update any user's garden XP level</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="email"
                    value={gardenXpEmail}
                    onChange={(e) => setGardenXpEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      value={newGardenXp}
                      onChange={(e) => setNewGardenXp(e.target.value)}
                      placeholder="500"
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={() => updateGardenXpMutation.mutate({ 
                      email: gardenXpEmail, 
                      xp: parseInt(newGardenXp) 
                    })}
                    disabled={updateGardenXpMutation.isPending || !gardenXpEmail || !newGardenXp}
                    className="w-full"
                  >
                    {updateGardenXpMutation.isPending ? 'Updating...' : 'Update Garden XP'}
                  </Button>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Admins Tab - Owner Only */}
          {isOwner && (
            <TabsContent value="admins">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    Admin Management
                  </CardTitle>
                  <CardDescription>Add or remove admin access for other users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={(e) => { e.preventDefault(); addAdminMutation.mutate(newAdminEmail.trim().toLowerCase()); }} className="flex gap-2">
                    <Input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="flex-1"
                    />
                    <Button type="submit" disabled={addAdminMutation.isPending || !newAdminEmail.trim()}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Admin
                    </Button>
                  </form>

                  <div className="space-y-2">
                    <Label>Current Admins</Label>
                    {loadingAdmins ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : admins && admins.length > 0 ? (
                      <div className="space-y-2">
                        {admins.map((admin) => (
                          <div key={admin.user_id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <div>
                              <p className="font-medium">{admin.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Added {new Date(admin.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeAdminMutation.mutate(admin.email)}
                              disabled={removeAdminMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No admins added yet. You (the owner) always have access.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPage;