import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Award, TrendingUp, Clock, Briefcase, BookOpen, User, Camera, Loader2, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isOwnProfile = !userId || userId === user?.id;
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
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

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (displayName: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName || null })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['own-profile'] });
      toast.success('Display name updated!');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL (add cache buster)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['own-profile'] });
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleStartEditing = () => {
    setEditDisplayName(ownProfile?.display_name || '');
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editDisplayName);
  };

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
        {/* Profile Header with Edit */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {/* Avatar with upload button */}
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={ownProfile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {ownProfile?.display_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{ownProfile?.display_name || 'Your Profile'}</h1>
                      <Button size="icon" variant="ghost" onClick={handleStartEditing}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      Member since {ownProfile?.created_at ? format(new Date(ownProfile.created_at), 'MMMM yyyy') : 'Unknown'}
                    </p>
                  </>
                )}
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
