import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lock, DollarSign, ArrowLeft, AlertTriangle } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorMessages';

/**
 * ⚠️ SECURITY WARNING ⚠️
 * This admin panel uses a client-side hardcoded password which is NOT secure.
 * The password is visible in the source code and can be bypassed via browser dev tools.
 * This implementation was explicitly requested by the user for development/testing purposes.
 * 
 * For production use, implement proper role-based access control:
 * 1. Store admin roles in a separate database table
 * 2. Validate admin status server-side via RLS policies or edge functions
 * 3. Never use hardcoded passwords in client-side code
 */
const ADMIN_PASSWORD = 'ie_!so1o!2011';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: portfolio } = usePortfolio();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [newCashBalance, setNewCashBalance] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      toast.success('Admin access granted');
    } else {
      toast.error('Incorrect password');
    }
  };

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

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      
      toast.success(`Cash balance updated to $${cashValue.toLocaleString()}`);
      setNewCashBalance('');
    } catch (error: any) {
      // Sanitize error message
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter the admin password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              <Button type="submit" className="w-full">
                Access Admin Panel
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
            Lock Panel
          </Button>
        </div>

        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Development Tool</span>
            </div>
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>
              Manage your account settings. Changes take effect immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Balance Display */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">Current Cash Balance</p>
              <p className="text-2xl font-bold text-primary">
                ${portfolio?.cash_balance?.toLocaleString() ?? '0'}
              </p>
            </div>

            {/* Update Cash Form */}
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
      </div>
    </div>
  );
};

export default AdminPage;
