import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface XPContextType {
  xp: number;
  addXP: (amount: number) => Promise<void>;
  setXP: (amount: number) => Promise<void>;
  loading: boolean;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

export const useXP = () => {
  const context = useContext(XPContext);
  if (context === undefined) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return context;
};

interface XPProviderProps {
  children: ReactNode;
}

export const XPProvider: React.FC<XPProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [xp, setXpState] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load XP from garden_state table
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadXP = async () => {
      try {
        const { data, error } = await supabase
          .from('garden_state')
          .select('xp')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading XP:', error);
        } else {
          setXpState(data?.xp || 0);
        }
      } catch (error) {
        console.error('Error loading XP:', error);
      } finally {
        setLoading(false);
      }
    };

    loadXP();
  }, [user]);

  const addXP = async (amount: number) => {
    if (!user) return;

    const newXP = Math.max(0, xp + amount);
    setXpState(newXP);

    try {
      const { error } = await supabase
        .from('garden_state')
        .upsert({
          user_id: user.id,
          xp: newXP,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating XP:', error);
        // Revert on error
        setXpState(xp);
      }
    } catch (error) {
      console.error('Error updating XP:', error);
      // Revert on error
      setXpState(xp);
    }
  };

  const setXP = async (amount: number) => {
    if (!user) return;

    const newXP = Math.max(0, amount);
    setXpState(newXP);

    try {
      const { error } = await supabase
        .from('garden_state')
        .upsert({
          user_id: user.id,
          xp: newXP,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error setting XP:', error);
        // Revert on error
        setXpState(xp);
      }
    } catch (error) {
      console.error('Error setting XP:', error);
      // Revert on error
      setXpState(xp);
    }
  };

  const value = {
    xp,
    addXP,
    setXP,
    loading
  };

  return (
    <XPContext.Provider value={value}>
      {children}
    </XPContext.Provider>
  );
};
