import { CreditCard, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SubscriptionPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const stripePaymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK_URL as string | undefined;
  const stripeCustomerPortalLink = import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_URL as string | undefined;

  const handleStripeCheckout = () => {
    if (!stripePaymentLink) {
      toast({
        title: 'Stripe not configured',
        description: 'Set VITE_STRIPE_PAYMENT_LINK_URL to enable checkout.',
        variant: 'destructive',
      });
      return;
    }

    window.open(stripePaymentLink, '_blank', 'noopener,noreferrer');
  };

  const handleBillingPortal = () => {
    if (!stripeCustomerPortalLink) {
      toast({
        title: 'Billing portal not configured',
        description: 'Set VITE_STRIPE_CUSTOMER_PORTAL_URL to manage billing.',
        variant: 'destructive',
      });
      return;
    }

    window.open(stripeCustomerPortalLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Subscription & Info</h1>
          <p className="text-muted-foreground">Upgrade your plan and manage billing</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </CardTitle>
            <CardDescription>Upgrade your plan and manage billing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current plan</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">Free</span>
                  <Badge variant="secondary">Starter</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upgrade to unlock premium analytics and AI insights.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleStripeCheckout}>Subscribe with Stripe</Button>
                <Button variant="outline" onClick={handleBillingPortal}>
                  Manage billing
                </Button>
              </div>
            </div>

            {!stripePaymentLink && (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Add `VITE_STRIPE_PAYMENT_LINK_URL` to your environment to enable Stripe checkout.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Subscription info
            </CardTitle>
            <CardDescription>How billing works with Stripe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Payments are processed securely by Stripe.</p>
              <p>Receipts are sent to {user?.email || 'your billing email'}.</p>
              <p>You can cancel or update payment methods at any time.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-email">Billing email</Label>
              <Input
                id="billing-email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionPage;
