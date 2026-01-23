import { useParams } from 'react-router-dom';
import { Trophy, Award, TrendingUp, Clock, Briefcase, BookOpen, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PublicProfile {
  display_name: string;
  avatar_url: string | null;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned_at: string;
  }>;
  stats: {
    total_trades: number;
    total_holdings: number;
    lessons_completed: number;
  };
  member_since: string;
  error?: string;
}

const ProfilePage = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  
  const isOwnProfile = !userId || userId === user?.id;
  
  // Fetch own profile data
  const { data: allAchievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();
  
  // Fetch public profile if viewing someone else
  const { data: publicProfile, isLoading: loadingPublic } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_profile', { _user_id: userId });
      if (error) throw error;
      return data as unknown as PublicProfile;
    },
    enabled: !isOwnProfile && !!userId,
  });
  
  // Fetch own profile info
  const { data: ownProfile } = useQuery({
    queryKey: ['own-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isOwnProfile && !!user,
  });
  
  // Get own stats
  const { data: ownStats } = useQuery({
    queryKey: ['own-stats', user?.id],
    queryFn: async () => {
      const [trades, holdings, lessons] = await Promise.all([
        supabase.from('trades').select('id', { count: 'exact' }).eq('user_id', user!.id),
        supabase.from('holdings').select('id', { count: 'exact' }).eq('user_id', user!.id),
        supabase.from('user_progress').select('id', { count: 'exact' }).eq('user_id', user!.id).eq('completed', true),
      ]);
      return {
        total_trades: trades.count || 0,
        total_holdings: holdings.count || 0,
        lessons_completed: lessons.count || 0,
      };
    },
    enabled: isOwnProfile && !!user,
  });

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      Trophy, Award, TrendingUp, Briefcase, BookOpen,
    };
    return icons[iconName] || Award;
  };

  // Render for viewing someone else's public profile
  if (!isOwnProfile) {
    if (loadingPublic) {
      return (
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading profile...</div>
          </div>
        </DashboardLayout>
      );
    }

    if (publicProfile?.error) {
      return (
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <User className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground">This profile is private</p>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={publicProfile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {publicProfile?.display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{publicProfile?.display_name}</h1>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Member since {publicProfile?.member_since ? format(new Date(publicProfile.member_since), 'MMMM yyyy') : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{publicProfile?.stats?.total_trades || 0}</p>
                <p className="text-muted-foreground">Total Trades</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{publicProfile?.stats?.total_holdings || 0}</p>
                <p className="text-muted-foreground">Current Holdings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{publicProfile?.stats?.lessons_completed || 0}</p>
                <p className="text-muted-foreground">Lessons Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Achievements
              </CardTitle>
              <CardDescription>
                {publicProfile?.achievements?.length || 0} achievements earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {publicProfile?.achievements?.map((achievement) => {
                  const IconComponent = getIconComponent(achievement.icon);
                  return (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  );
                })}
                {(!publicProfile?.achievements || publicProfile.achievements.length === 0) && (
                  <p className="text-muted-foreground col-span-2 text-center py-4">
                    No achievements earned yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Render for own profile
  const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  const earnedAchievements = allAchievements?.filter(a => earnedAchievementIds.has(a.id)) || [];
  const lockedAchievements = allAchievements?.filter(a => !earnedAchievementIds.has(a.id)) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={ownProfile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {ownProfile?.display_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{ownProfile?.display_name || 'Your Profile'}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4" />
                  Member since {ownProfile?.created_at ? format(new Date(ownProfile.created_at), 'MMMM yyyy') : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <Briefcase className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{ownStats?.total_trades || 0}</p>
              <p className="text-muted-foreground">Total Trades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{ownStats?.total_holdings || 0}</p>
              <p className="text-muted-foreground">Current Holdings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{ownStats?.lessons_completed || 0}</p>
              <p className="text-muted-foreground">Lessons Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Earned Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Your Achievements
            </CardTitle>
            <CardDescription>
              {earnedAchievements.length} of {allAchievements?.length || 0} achievements earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress 
              value={(earnedAchievements.length / (allAchievements?.length || 1)) * 100} 
              className="mb-4"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {earnedAchievements.map((achievement) => {
                const IconComponent = getIconComponent(achievement.icon);
                const earnedAt = userAchievements?.find(ua => ua.achievement_id === achievement.id)?.earned_at;
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      {earnedAt && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Earned {format(new Date(earnedAt), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Award className="w-5 h-5" />
                Locked Achievements
              </CardTitle>
              <CardDescription>Keep trading and learning to unlock these</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {lockedAchievements.map((achievement) => {
                  const IconComponent = getIconComponent(achievement.icon);
                  return (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border opacity-60"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
