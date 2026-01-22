import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lock, DollarSign, ArrowLeft, Shield, UserPlus, Trash2, Crown, Loader2 } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMessages';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const OWNER_EMAIL = '2landonl10@gmail.com';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: portfolio } = usePortfolio();
  
  const [newCashBalance, setNewCashBalance] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Check if current user is owner
  const isOwner = user?.email === OWNER_EMAIL;

  // Check if user has admin role (owner is always admin)
  const { data: hasAdminRole, isLoading: checkingRole } = useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      // Owner always has access
      if (isOwner) return true;
      
      // Check user_roles table via RPC
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (error) {
        console.error('Error checking role:', error);
        return false;
      }
      
      return data === true;
    },
    enabled: !!user,
  });

  // Fetch all admins (only owner can see this)
  const { data: admins, isLoading: loadingAdmins } = useQuery({
    queryKey: ['all-admins'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_admins');
      if (error) {
        console.error('Error fetching admins:', error);
        return [];
      }
      return data || [];
    },
    enabled: isOwner,
  });

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('add_admin_by_email', {
        _email: email
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success('Admin added successfully');
        setNewAdminEmail('');
        queryClient.invalidateQueries({ queryKey: ['all-admins'] });
      } else {
        toast.error(data?.error || 'Failed to add admin');
      }
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('remove_admin_by_email', {
        _email: email
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Admin removed');
      queryClient.invalidateQueries({ queryKey: ['all-admins'] });
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  const handleUpdateCash = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

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
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      
      toast.success(`Cash balance updated to $${cashValue.toLocaleString()}`);
      setNewCashBalance('');
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    addAdminMutation.mutate(newAdminEmail.trim().toLowerCase());
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
                Contact the owner to request admin access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
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
      <div className="max-w-2xl mx-auto space-y-6">
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
        </div>

        {/* Cash Balance Management */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Balance</CardTitle>
            <CardDescription>
              Manage your account cash balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">Current Cash Balance</p>
              <p className="text-2xl font-bold text-primary">
                ${portfolio?.cash_balance?.toLocaleString() ?? '0'}
              </p>
            </div>

            <form onSubmit={handleUpdateCash} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newCash">New Cash Balance</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="newCash"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCashBalance}
                    onChange={(e) => setNewCashBalance(e.target.value)}
                    placeholder="10000.00"
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isUpdating || !newCashBalance}>
                {isUpdating ? 'Updating...' : 'Update Cash Balance'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin Management - Owner Only */}
        {isOwner && (
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Admin Management
            </CardTitle>
              <CardDescription>
                Add or remove admin access for other users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Admin Form */}
              <form onSubmit={handleAddAdmin} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={addAdminMutation.isPending || !newAdminEmail.trim()}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Admin
                </Button>
              </form>

              {/* Current Admins List */}
              <div className="space-y-2">
                <Label>Current Admins</Label>
                {loadingAdmins ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : admins && admins.length > 0 ? (
                  <div className="space-y-2">
                    {admins.map((admin: any) => (
                      <div
                        key={admin.user_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPage;