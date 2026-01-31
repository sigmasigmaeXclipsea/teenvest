import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDisciplineScore } from '@/hooks/useDisciplineScore';

const getScoreTone = (score: number) => {
  if (score >= 80) return 'text-primary';
  if (score >= 50) return 'text-amber-500';
  return 'text-destructive';
};

const getScoreMessage = (score: number) => {
  if (score >= 80) return "Disciplined and consistent. Keep it up.";
  if (score >= 50) return 'Solid foundation. Clean up a few habits to level up.';
  return 'Discipline is low. Focus on exits, sizing, and reset your cadence.';
};

const DisciplineScoreCard = () => {
  const { score, breakdown, isAtRisk, loading } = useDisciplineScore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Discipline Meter
        </CardTitle>
        <CardDescription>Plan adherence, revenge trading, and position sizing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-secondary/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Discipline Score</span>
            <span className={`text-lg font-bold ${getScoreTone(score)}`}>
              {loading ? '—' : `${score}/100`}
            </span>
          </div>
          <Progress value={loading ? 0 : score} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {loading ? 'Calculating your recent discipline data...' : getScoreMessage(score)}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan adherence</span>
            <span>
              {breakdown.plannedExits === 0
                ? 'No plans yet'
                : `${Math.round(breakdown.planAdherenceRate * 100)}% (${breakdown.adheredExits}/${breakdown.plannedExits})`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Revenge trades</span>
            <span>{breakdown.revengeTrades}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Over-leveraged trades</span>
            <span>{breakdown.overLeverageTrades}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Based on {breakdown.tradeSample} completed trades.
          </div>
        </div>

        {isAtRisk && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <span>
              Pro features stay locked below 50. Stabilize exits and sizing to regain access.
            </span>
          </div>
        )}

        {!isAtRisk && (
          <Badge variant="outline" className="text-xs">
            Pro access stable
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default DisciplineScoreCard;
