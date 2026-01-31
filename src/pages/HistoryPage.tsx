import { format } from 'date-fns';
import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useTrades } from '@/hooks/useTrades';
import { getLessonForIndicators } from '@/lib/tradePredictions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorMessages';

const HistoryPage = () => {
  const { data: trades, isLoading } = useTrades();
  const { toast } = useToast();
  const [aiFeedbackByTrade, setAiFeedbackByTrade] = useState<Record<string, string>>({});
  const [aiLoadingByTrade, setAiLoadingByTrade] = useState<Record<string, boolean>>({});
  const pendingTrades = (trades || []).filter((trade) => trade.status === 'pending');
  const predictionTrades = (trades || [])
    .filter((trade) => trade.prediction_direction)
    .slice(0, 6);

  const getOutcomeForRpe = (trade: any) => {
    const outcomes = trade.prediction_outcomes || {};
    if (outcomes.close) return { label: 'Close', outcome: outcomes.close };
    if (outcomes.horizon) return { label: 'Horizon', outcome: outcomes.horizon };
    if (outcomes.immediate) return { label: 'Immediate', outcome: outcomes.immediate };
    return null;
  };

  const handleAiFeedback = async (trade: any) => {
    if (!trade?.prediction_direction || !trade?.prediction_thesis) return;
    const resolved = getOutcomeForRpe(trade);
    if (!resolved) return;
    const changePct = Number(resolved.outcome?.changePct);
    if (!Number.isFinite(changePct)) return;
    const directionCorrect =
      trade.prediction_direction === 'up' ? changePct >= 0 : changePct <= 0;
    const rpe = trade.prediction_direction === 'up' ? changePct : -changePct;

    setAiLoadingByTrade((prev) => ({ ...prev, [trade.id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('rpe-feedback-ai', {
        body: {
          symbol: trade.symbol,
          tradeType: trade.trade_type,
          predictionDirection: trade.prediction_direction,
          thesis: trade.prediction_thesis,
          indicators: trade.prediction_indicators || [],
          horizonLabel: resolved.label,
          actualChangePct: changePct,
          rpe,
          directionCorrect,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiFeedbackByTrade((prev) => ({
        ...prev,
        [trade.id]: data?.feedback || 'AI feedback unavailable.',
      }));
    } catch (error: unknown) {
      const fallback = `AI unavailable. ${trade.symbol} moved ${(changePct * 100).toFixed(2)}%. Your prediction was ${
        directionCorrect ? 'aligned' : 'off'
      }.`;
      setAiFeedbackByTrade((prev) => ({
        ...prev,
        [trade.id]: fallback,
      }));
      toast({
        title: 'AI feedback unavailable',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    } finally {
      setAiLoadingByTrade((prev) => ({ ...prev, [trade.id]: false }));
    }
  };

  const formatOutcome = (label: string, outcome?: any) => {
    if (!outcome) {
      return (
        <div className="text-xs text-muted-foreground">
          {label}: pending
        </div>
      );
    }
    const value = Number(outcome.changePct);
    const direction = value >= 0 ? 'text-emerald-500' : 'text-red-500';
    return (
      <div className={`text-xs ${direction}`}>
        {label}: {(value * 100).toFixed(2)}%
      </div>
    );
  };

  const getTradeBadgeVariant = (tradeType: string) => {
    if (tradeType === 'short') return 'destructive';
    if (tradeType === 'buy' || tradeType === 'cover') return 'default';
    if (tradeType === 'sell') return 'secondary';
    return 'outline';
  };

  const isBuySide = (tradeType: string) => tradeType === 'buy' || tradeType === 'cover';

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading trade history...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Trade History</h1>
          <p className="text-muted-foreground">View all your past trades</p>
        </div>

        {pendingTrades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTrades.map((trade) => (
                <div key={trade.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getTradeBadgeVariant(trade.trade_type)}>
                        {trade.trade_type.toUpperCase()}
                      </Badge>
                      <span className="font-semibold">{trade.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {Number(trade.shares).toFixed(2)} shares
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      ${Number(trade.limit_price ?? trade.stop_price ?? trade.price).toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Order: {trade.order_type}</span>
                    {trade.near_miss && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20" variant="outline">
                        Near Miss
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Prediction vs Reality</CardTitle>
          </CardHeader>
          <CardContent>
            {predictionTrades.length > 0 ? (
              <div className="space-y-4">
                {predictionTrades.map((trade) => {
                  const indicators = Array.isArray(trade.prediction_indicators)
                    ? trade.prediction_indicators.filter((item) => typeof item === 'string')
                    : [];
                  const lesson = getLessonForIndicators(indicators);
                  const outcomes = trade.prediction_outcomes || {};
                  const resolvedOutcome = getOutcomeForRpe(trade);
                  const aiFeedback = aiFeedbackByTrade[trade.id];
                  const aiLoading = aiLoadingByTrade[trade.id];
                  const canRequestAi = Boolean(
                    trade.prediction_thesis && resolvedOutcome && !aiLoading
                  );
                  return (
                    <div key={trade.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{trade.symbol}</span>
                            <Badge variant="outline">{trade.trade_type.toUpperCase()}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {trade.prediction_thesis || 'Prediction recorded'}
                          </p>
                        </div>
                        <Badge className={trade.prediction_direction === 'up' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'} variant="outline">
                          Predicted {trade.prediction_direction?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {formatOutcome('Immediate', outcomes.immediate)}
                        {formatOutcome('Horizon', outcomes.horizon)}
                        {formatOutcome('Close', outcomes.close)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          Outcome used for RPE: {resolvedOutcome ? resolvedOutcome.label : 'Unavailable'}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAiFeedback(trade)}
                          disabled={!canRequestAi}
                        >
                          {aiLoading ? 'Thinking...' : 'Get AI feedback'}
                        </Button>
                      </div>
                      {aiFeedback && (
                        <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">AI coaching</p>
                          <p>{aiFeedback}</p>
                        </div>
                      )}
                      {lesson && (
                        <Link to={`/learn/${lesson.id}`} className="text-xs text-primary hover:underline">
                          Review lesson: {lesson.title}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-6">
                Place a trade with a prediction to see outcomes here.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Trades ({trades?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {trades && trades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Stock</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Order</th>
                      <th className="pb-3 font-medium">Shares</th>
                      <th className="pb-3 font-medium">Price</th>
                      <th className="pb-3 font-medium">Total</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b last:border-0">
                        <td className="py-4 text-sm">
                          {format(new Date(trade.created_at), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {isBuySide(trade.trade_type) ? (
                              <ArrowDownCircle className="w-5 h-5 text-primary" />
                            ) : (
                              <ArrowUpCircle className="w-5 h-5 text-destructive" />
                            )}
                            <div>
                              <p className="font-semibold">{trade.symbol}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                                {trade.company_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant={getTradeBadgeVariant(trade.trade_type)}>
                            {trade.trade_type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline">{trade.order_type}</Badge>
                        </td>
                        <td className="py-4 font-medium">
                          {Number(trade.shares).toFixed(2)}
                        </td>
                        <td className="py-4">
                          <div className="text-sm font-medium">
                            ${Number(trade.executed_price ?? trade.price).toFixed(2)}
                          </div>
                          {trade.executed_price != null && trade.executed_price !== trade.price && (
                            <div className="text-xs text-muted-foreground">
                              req ${Number(trade.price).toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="py-4 font-semibold">
                          ${Number(trade.total_amount).toFixed(2)}
                        </td>
                        <td className="py-4">
                          {trade.status === 'completed' ? (
                            <span className="flex items-center gap-1 text-primary">
                              <CheckCircle className="w-4 h-4" />
                              Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {trade.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
                <p className="text-muted-foreground">
                  Your trade history will appear here once you make your first trade.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HistoryPage;
