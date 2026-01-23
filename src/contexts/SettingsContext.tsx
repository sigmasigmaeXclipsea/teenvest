import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  advancedMode: boolean;
  darkMode: boolean;
  notifications: {
    priceAlerts: boolean;
    tradeConfirmations: boolean;
    weeklyDigest: boolean;
    achievements: boolean;
  };
}

interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActivityDate: string | null;
}

interface SettingsContextType {
  settings: UserSettings;
  streak: DailyStreak;
  loading: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  toggleAdvancedMode: () => Promise<void>;
  refreshStreak: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  advancedMode: false,
  darkMode: false,
  notifications: {
    priceAlerts: true,
    tradeConfirmations: true,
    weeklyDigest: false,
    achievements: true,
  },
};

const defaultStreak: DailyStreak = {
  currentStreak: 0,
  longestStreak: 0,
  totalActiveDays: 0,
  lastActivityDate: null,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [streak, setStreak] = useState<DailyStreak>(defaultStreak);
  const [loading, setLoading] = useState(true);

  // Load settings from database or localStorage
  const loadSettings = useCallback(async () => {
    if (!user) {
      // Load from localStorage for unauthenticated state
      const saved = localStorage.getItem('teenvest_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse saved settings:', e);
        }
      }
      setLoading(false);
      return;
    }

    try {
      // Fetch settings from database
      const { data: dbSettings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (dbSettings) {
        setSettings({
          advancedMode: dbSettings.advanced_mode,
          darkMode: dbSettings.dark_mode,
          notifications: {
            priceAlerts: dbSettings.notifications_price_alerts,
            tradeConfirmations: dbSettings.notifications_trade_confirmations,
            weeklyDigest: dbSettings.notifications_weekly_digest,
            achievements: dbSettings.notifications_achievements,
          },
        });
      } else {
        // Create default settings in database
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            advanced_mode: defaultSettings.advancedMode,
            dark_mode: defaultSettings.darkMode,
            notifications_price_alerts: defaultSettings.notifications.priceAlerts,
            notifications_trade_confirmations: defaultSettings.notifications.tradeConfirmations,
            notifications_weekly_digest: defaultSettings.notifications.weeklyDigest,
            notifications_achievements: defaultSettings.notifications.achievements,
          });

        if (insertError) console.error('Failed to create settings:', insertError);
      }

      // Update daily streak
      await refreshStreak();

    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshStreak = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('update_daily_streak', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data) {
        const streakData = data as {
          current_streak: number;
          longest_streak: number;
          is_new_day: boolean;
          total_active_days: number;
        };
        
        setStreak({
          currentStreak: streakData.current_streak,
          longestStreak: streakData.longest_streak,
          totalActiveDays: streakData.total_active_days,
          lastActivityDate: new Date().toISOString().split('T')[0],
        });

        // Show streak notification on new day
        if (streakData.is_new_day && streakData.current_streak > 1) {
          toast({
            title: `🔥 ${streakData.current_streak} Day Streak!`,
            description: "You're on fire! Keep up the great work.",
          });
        }
      }
    } catch (err) {
      console.error('Failed to update streak:', err);
    }
  }, [user, toast]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Save to localStorage for immediate persistence
    localStorage.setItem('teenvest_settings', JSON.stringify(updated));

    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          advanced_mode: updated.advancedMode,
          dark_mode: updated.darkMode,
          notifications_price_alerts: updated.notifications.priceAlerts,
          notifications_trade_confirmations: updated.notifications.tradeConfirmations,
          notifications_weekly_digest: updated.notifications.weeklyDigest,
          notifications_achievements: updated.notifications.achievements,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, [settings, user]);

  const toggleAdvancedMode = useCallback(async () => {
    await updateSettings({ advancedMode: !settings.advancedMode });
  }, [settings.advancedMode, updateSettings]);

  // Apply dark mode to document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [settings.darkMode]);

  // Load settings on mount and when user changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Initialize theme from localStorage on first load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setSettings(prev => ({ ...prev, darkMode: true }));
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      streak,
      loading,
      updateSettings,
      toggleAdvancedMode,
      refreshStreak,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
