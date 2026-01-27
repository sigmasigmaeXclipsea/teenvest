import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface XPContextType {
  xp: number;
  quizPoints: number;
  addXP: (amount: number) => Promise<void>;
  setXP: (amount: number) => Promise<void>;
  addQuizPoints: (amount: number) => Promise<void>;
  spendQuizPoints: (amount: number) => Promise<boolean>;
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
  const [quizPoints, setQuizPointsState] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load XP and quiz points from garden_state table
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('garden_state')
          .select('xp, quiz_points')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading XP:', error);
        } else {
          setXpState(data?.xp || 0);
          setQuizPointsState(data?.quiz_points || 0);
        }
      } catch (error) {
        console.error('Error loading XP:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
        setXpState(xp);
      }
    } catch (error) {
      console.error('Error updating XP:', error);
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
        setXpState(xp);
      }
    } catch (error) {
      console.error('Error setting XP:', error);
      setXpState(xp);
    }
  };

  const addQuizPoints = async (amount: number) => {
    if (!user) return;

    const newPoints = Math.max(0, quizPoints + amount);
    setQuizPointsState(newPoints);

    try {
      const { error } = await supabase
        .from('garden_state')
        .upsert({
          user_id: user.id,
          quiz_points: newPoints,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating quiz points:', error);
        setQuizPointsState(quizPoints);
      }
    } catch (error) {
      console.error('Error updating quiz points:', error);
      setQuizPointsState(quizPoints);
    }
  };

  const spendQuizPoints = async (amount: number): Promise<boolean> => {
    if (!user) return false;
    if (amount > quizPoints) return false;

    const newPoints = quizPoints - amount;
    setQuizPointsState(newPoints);

    try {
      const { error } = await supabase
        .from('garden_state')
        .upsert({
          user_id: user.id,
          quiz_points: newPoints,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error spending quiz points:', error);
        setQuizPointsState(quizPoints);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error spending quiz points:', error);
      setQuizPointsState(quizPoints);
      return false;
    }
  };

  const value = {
    xp,
    quizPoints,
    addXP,
    setXP,
    addQuizPoints,
    spendQuizPoints,
    loading
  };

  return (
    <XPContext.Provider value={value}>
      {children}
    </XPContext.Provider>
  );
};
