import { useState, useEffect } from 'react';
import { Moon, Sun, User, Bell, Shield, LogOut, Eye, EyeOff, Flame } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { settings, streak, updateSettings } = useSettings();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch profile settings
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, profile_public')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data as unknown as { display_name: string | null; profile_public: boolean };
    },
    enabled: !!user,
  });

  const [displayName, setDisplayName] = useState('');
  const [profilePublic, setProfilePublic] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setProfilePublic(profile.profile_public ?? true);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async ({ displayName, profilePublic }: { displayName: string; profilePublic: boolean }) => {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ 
          display_name: displayName || null,
          profile_public: profilePublic 
        })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-settings'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile settings have been saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveNotifications = async () => {
    toast({
      title: 'Settings saved',
      description: 'Your notification preferences have been updated.',
    });
  };

  const handleSaveProfile = () => {
    updateProfile.mutate({ displayName, profilePublic });
  };

  const handleToggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  const handleNotificationChange = (key: keyof typeof settings.notifications, value: boolean) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        {/* Daily Streak Card */}
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Your Daily Streak
            </CardTitle>
            <CardDescription>Stay consistent to build your streak!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">{streak.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-semibold">{streak.longestStreak}</div>
                  <div className="text-xs text-muted-foreground">Longest Streak</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-semibold">{streak.totalActiveDays}</div>
                  <div className="text-xs text-muted-foreground">Total Days</div>
                </div>
              </div>
              <div className="flex">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-sm mx-0.5 ${
                      i < streak.currentStreak % 7
                        ? 'bg-amber-500'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize how TeenVest looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={handleToggleDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This name will be shown on the leaderboard
              </p>
            </div>
            <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Manage your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {profilePublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Public Profile
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to view your profile from the leaderboard
                </p>
              </div>
              <Switch 
                checked={profilePublic} 
                onCheckedChange={(checked) => {
                  setProfilePublic(checked);
                  updateProfile.mutate({ displayName, profilePublic: checked });
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show on Leaderboard</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your ranking
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Choose what you want to be notified about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Price Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when stocks hit your target prices
                </p>
              </div>
              <Switch
                checked={settings.notifications.priceAlerts}
                onCheckedChange={(checked) => handleNotificationChange('priceAlerts', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Trade Confirmations</Label>
                <p className="text-sm text-muted-foreground">
                  Receive confirmation after each trade
                </p>
              </div>
              <Switch
                checked={settings.notifications.tradeConfirmations}
                onCheckedChange={(checked) => handleNotificationChange('tradeConfirmations', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly summary of your portfolio performance
                </p>
              </div>
              <Switch
                checked={settings.notifications.weeklyDigest}
                onCheckedChange={(checked) => handleNotificationChange('weeklyDigest', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Achievements</Label>
                <p className="text-sm text-muted-foreground">
                  Be notified when you earn new achievements
                </p>
              </div>
              <Switch
                checked={settings.notifications.achievements}
                onCheckedChange={(checked) => handleNotificationChange('achievements', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="w-5 h-5" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout}>
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
