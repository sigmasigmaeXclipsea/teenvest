import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorMessages';
import { predictionHorizonOptions, predictionIndicatorOptions, type PredictionDirection } from '@/lib/tradePredictions';

const defaultIndicators: string[] = [];

const RpeSimulationCard = () => {
  const { toast } = useToast();
  const [symbol, setSymbol] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell' | 'short' | 'cover'>('buy');
  const [predictionDirection, setPredictionDirection] = useState<PredictionDirection>('up');
  const [horizonValue, setHorizonValue] = useState(predictionHorizonOptions[2]?.value || '1d');
  const [thesis, setThesis] = useState('');
  const [indicators, setIndicators] = useState<string[]>(defaultIndicators);
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [changePct, setChangePct] = useState('');
  const [hasSimulated, setHasSimulated] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const horizonLabel = useMemo(() => {
    return predictionHorizonOptions.find((option) => option.value === horizonValue)?.label || 'Custom';
  }, [horizonValue]);

  const simulation = useMemo(() => {
    const entry = Number(entryPrice);
    const exit = Number(exitPrice);
    const changeValue = Number(changePct);
    const hasEntry = entryPrice.trim() !== '' && Number.isFinite(entry) && entry > 0;
    const hasExit = exitPrice.trim() !== '' && Number.isFinite(exit) && exit > 0;
    const hasChange = changePct.trim() !== '' && Number.isFinite(changeValue);
    const isValid = hasEntry && (hasExit || hasChange);

    if (!isValid) {
      return { isValid, message: 'Enter a valid entry price and exit price or % change.' };
    }

    const actualChangePct = hasExit ? (exit - entry) / entry : changeValue / 100;
    const impliedExit = hasExit ? exit : entry * (1 + actualChangePct);
    const directionCorrect =
      predictionDirection === 'up' ? actualChangePct >= 0 : actualChangePct <= 0;
    const rpe = predictionDirection === 'up' ? actualChangePct : -actualChangePct;
    const absRpe = Math.abs(rpe);
    const intensity =
      absRpe < 0.005 ? 'Low' : absRpe < 0.02 ? 'Medium' : 'High';
    const valence = rpe >= 0 ? 'Positive' : 'Negative';
    const feedback =
      rpe >= 0
        ? `Outcome aligned with your prediction. ${symbol || 'The stock'} moved ${(actualChangePct * 100).toFixed(2)}%.`
        : `Outcome violated your prediction. ${symbol || 'The stock'} moved ${(actualChangePct * 100).toFixed(2)}% against your thesis.`;

    return {
      isValid,
      entry,
      actualChangePct,
      impliedExit,
      directionCorrect,
      rpe,
      absRpe,
      intensity,
      valence,
      feedback,
    };
  }, [entryPrice, exitPrice, changePct, predictionDirection, symbol]);

  const handleIndicatorChange = (indicator: string, checked: boolean | 'indeterminate') => {
    setIndicators((prev) => {
      if (checked === true) {
        return prev.includes(indicator) ? prev : [...prev, indicator];
      }
      return prev.filter((item) => item !== indicator);
    });
  };

  const handleSimulate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSimulated(true);
    setAiFeedback(null);
  };

  const handleReset = () => {
    setSymbol('');
    setTradeType('buy');
    setPredictionDirection('up');
    setHorizonValue(predictionHorizonOptions[2]?.value || '1d');
    setThesis('');
    setIndicators(defaultIndicators);
    setEntryPrice('');
    setExitPrice('');
    setChangePct('');
    setHasSimulated(false);
    setAiFeedback(null);
  };

  const handleAiFeedback = async () => {
    if (!simulation.isValid || !hasThesis) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rpe-feedback-ai', {
        body: {
          symbol: symbol.trim(),
          tradeType,
          predictionDirection,
          thesis: thesis.trim(),
          indicators,
          horizonLabel,
          actualChangePct: simulation.actualChangePct,
          rpe: simulation.rpe,
          directionCorrect: simulation.directionCorrect,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiFeedback(data?.feedback || 'AI feedback unavailable.');
    } catch (error: unknown) {
      if (simulation.isValid) {
        setAiFeedback(`${simulation.feedback} (AI unavailable)`);
      }
      toast({
        title: 'AI feedback unavailable',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const hasThesis = thesis.trim().length > 0;
  const canSimulate = hasThesis && simulation.isValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle>RPE Simulation</CardTitle>
        <CardDescription>
          Simulate prediction errors and see the feedback loop before shipping it to users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSimulate} className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rpe-symbol">Symbol (optional)</Label>
              <Input
                id="rpe-symbol"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                placeholder="AAPL"
              />
            </div>
            <div className="space-y-2">
              <Label>Trade type</Label>
              <Select value={tradeType} onValueChange={(value) => setTradeType(value as typeof tradeType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="cover">Cover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prediction direction</Label>
              <Select
                value={predictionDirection}
                onValueChange={(value) => setPredictionDirection(value as PredictionDirection)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="up">Up</SelectItem>
                  <SelectItem value="down">Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prediction horizon</Label>
              <Select value={horizonValue} onValueChange={setHorizonValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select horizon" />
                </SelectTrigger>
                <SelectContent>
                  {predictionHorizonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rpe-thesis">Reasoning / Thesis</Label>
            <Textarea
              id="rpe-thesis"
              value={thesis}
              onChange={(event) => setThesis(event.target.value)}
              placeholder="I expect a breakout because RSI divergence is forming..."
            />
            {!hasThesis && (
              <p className="text-xs text-muted-foreground">
                Add a thesis to unlock the simulation output.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Indicators referenced</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {predictionIndicatorOptions.map((indicator) => (
                <label key={indicator} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={indicators.includes(indicator)}
                    onCheckedChange={(checked) => handleIndicatorChange(indicator, checked)}
                  />
                  <span>{indicator}</span>
                </label>
              ))}
            </div>
            {indicators.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {indicators.map((indicator) => (
                  <Badge key={indicator} variant="outline">
                    {indicator}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rpe-entry">Entry price</Label>
              <Input
                id="rpe-entry"
                type="number"
                min="0"
                step="0.01"
                value={entryPrice}
                onChange={(event) => setEntryPrice(event.target.value)}
                placeholder="100.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpe-exit">Exit price</Label>
              <Input
                id="rpe-exit"
                type="number"
                min="0"
                step="0.01"
                value={exitPrice}
                onChange={(event) => setExitPrice(event.target.value)}
                placeholder="110.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpe-change">Outcome change %</Label>
              <Input
                id="rpe-change"
                type="number"
                step="0.01"
                value={changePct}
                onChange={(event) => setChangePct(event.target.value)}
                placeholder="5.0"
              />
            </div>
          </div>

          {!simulation.isValid && (
            <p className="text-xs text-muted-foreground">{simulation.message}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canSimulate}>
              Simulate RPE
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAiFeedback}
              disabled={!hasSimulated || !canSimulate || aiLoading}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting feedback...
                </>
              ) : (
                'Get AI Feedback'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>

        {hasSimulated && simulation.isValid && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={simulation.valence === 'Positive' ? 'default' : 'destructive'}>
                {simulation.valence} RPE
              </Badge>
              <Badge variant="outline">{simulation.intensity} intensity</Badge>
              <Badge variant="secondary">
                {tradeType.toUpperCase()} · {predictionDirection.toUpperCase()} · {horizonLabel}
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-muted-foreground">Actual change</p>
                <p className="font-semibold">
                  {(simulation.actualChangePct * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Implied exit</p>
                <p className="font-semibold">${simulation.impliedExit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Direction correct</p>
                <p className="font-semibold">
                  {simulation.directionCorrect ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Feedback</p>
              <p>{simulation.feedback}</p>
            </div>
            {aiFeedback && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">AI coaching</p>
                <p>{aiFeedback}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RpeSimulationCard;
