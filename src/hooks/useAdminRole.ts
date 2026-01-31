import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const OWNER_EMAIL = '2landonl10@gmail.com';

export const useAdminRole = () => {
  const { user } = useAuth();
  const isOwner = user?.email === OWNER_EMAIL;

  return useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      if (isOwner) return true;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (error) return false;
      return data === true;
    },
    enabled: !!user,
  });
};
