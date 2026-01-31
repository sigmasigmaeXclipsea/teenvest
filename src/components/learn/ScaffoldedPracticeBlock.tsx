import { useMemo, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useScaffoldingLevel } from '@/hooks/useScaffoldingLevel';
import { useScaffoldProgress } from '@/hooks/useScaffoldProgress';
import LessonVideoBlock from '@/components/learn/LessonVideoBlock';

export type ScaffoldedPracticeLabel = 'I Do' | 'We Do' | 'You Do';

export type ScaffoldTradeScenario = {
  symbol: string;
  setup: string;
  entryPrice: number;
  stopLossPrice?: number;
  targetPrice?: number;
  direction: 'long' | 'short';
};

export type ScaffoldedPracticeStep =
  | {
      id: string;
      label: ScaffoldedPracticeLabel;
      kind: 'video';
      title: string;
      description?: string;
      videoUrl?: string;
      posterUrl?: string;
      durationSeconds?: number;
      transcript?: string;
    }
  | {
      id: string;
      label: ScaffoldedPracticeLabel;
      kind: 'guided_prompt';
      prompt: string;
      helperText?: string;
      ctaLabel?: string;
    }
  | {
      id: string;
      label: ScaffoldedPracticeLabel;
      kind: 'reflection';
      prompt: string;
      placeholder?: string;
      ctaLabel?: string;
    }
  | {
      id: string;
      label: ScaffoldedPracticeLabel;
      kind: 'guided_trade';
      scenario: ScaffoldTradeScenario;
      ctaLabel?: string;
      highlightLabel?: string;
      autoStopLoss?: number;
    }
  | {
      id: string;
      label: ScaffoldedPracticeLabel;
      kind: 'independent_trade';
      scenario: ScaffoldTradeScenario;
      ctaLabel?: string;
      requireStopLoss?: boolean;
      stopLossHint?: string;
    };

type ScaffoldedPracticeBlockProps = {
  title: string;
  subtitle?: string;
  moduleId?: string;
  steps: ScaffoldedPracticeStep[];
};

const ScaffoldedPracticeBlock = ({
  title,
  subtitle,
  moduleId,
  steps,
}: ScaffoldedPracticeBlockProps) => {
  const scaffoldingLevel = useScaffoldingLevel(moduleId);
  const { isStepComplete, markStepComplete } = useScaffoldProgress(moduleId);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [stopLossInputs, setStopLossInputs] = useState<Record<string, string>>({});
  const [blownUpSteps, setBlownUpSteps] = useState<Record<string, boolean>>({});

  const visibleLabels = useMemo(() => {
    if (scaffoldingLevel === 'independent') return ['You Do'] as ScaffoldedPracticeLabel[];
    if (scaffoldingLevel === 'partial') return ['We Do', 'You Do'] as ScaffoldedPracticeLabel[];
    return ['I Do', 'We Do', 'You Do'] as ScaffoldedPracticeLabel[];
  }, [scaffoldingLevel]);

  const visibleSteps = useMemo(
    () => steps.filter((step) => visibleLabels.includes(step.label)),
    [steps, visibleLabels]
  );

  const renderScenarioDetails = (scenario: ScaffoldTradeScenario) => (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{scenario.symbol}</Badge>
        <Badge variant={scenario.direction === 'short' ? 'destructive' : 'default'}>
          {scenario.direction === 'short' ? 'Short setup' : 'Long setup'}
        </Badge>
      </div>
      <p className="mt-2 text-muted-foreground">{scenario.setup}</p>
      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <span>Entry: ${scenario.entryPrice.toFixed(2)}</span>
        {scenario.targetPrice && <span>Target: ${scenario.targetPrice.toFixed(2)}</span>}
        {scenario.stopLossPrice && <span>Stop: ${scenario.stopLossPrice.toFixed(2)}</span>}
      </div>
    </div>
  );

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">Scaffolding: {scaffoldingLevel}</Badge>
          <span>Fades as you level up</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleSteps.map((step, index) => {
          const completed = isStepComplete(step.id);
          const stepNumber = index + 1;

          if (step.kind === 'video') {
            return (
              <div key={step.id} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {stepNumber}
                  </span>
                  {step.label}
                  {completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <LessonVideoBlock
                  title={step.title}
                  description={step.description}
                  videoUrl={step.videoUrl}
                  posterUrl={step.posterUrl}
                  durationSeconds={step.durationSeconds}
                  transcript={step.transcript}
                  onComplete={() => markStepComplete(step.id)}
                />
              </div>
            );
          }

          if (step.kind === 'guided_prompt') {
            return (
              <Card key={step.id} className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {step.label}
                    {completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </CardTitle>
                  {step.helperText && <CardDescription>{step.helperText}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{step.prompt}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant={completed ? 'outline' : 'default'}
                    onClick={() => markStepComplete(step.id)}
                    disabled={completed}
                  >
                    {completed ? 'Completed' : step.ctaLabel ?? 'Confirm'}
                  </Button>
                </CardContent>
              </Card>
            );
          }

          if (step.kind === 'reflection') {
            return (
              <Card key={step.id} className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {step.label}
                    {completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </CardTitle>
                  <CardDescription>{step.prompt}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder={step.placeholder}
                    value={responses[step.id] || ''}
                    onChange={(event) =>
                      setResponses((prev) => ({ ...prev, [step.id]: event.target.value }))
                    }
                    rows={3}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={completed ? 'outline' : 'default'}
                    onClick={() => {
                      const value = (responses[step.id] || '').trim();
                      if (value.length < 4) return;
                      markStepComplete(step.id);
                    }}
                    disabled={completed || (responses[step.id] || '').trim().length < 4}
                  >
                    {completed ? 'Completed' : step.ctaLabel ?? 'Submit response'}
                  </Button>
                </CardContent>
              </Card>
            );
          }

          if (step.kind === 'guided_trade') {
            return (
              <Card key={step.id} className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {step.label}
                    {completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </CardTitle>
                  <CardDescription>
                    Follow the setup with guardrails turned on.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {renderScenarioDetails(step.scenario)}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Auto stop-loss</Badge>
                    {step.autoStopLoss && (
                      <span>Stop set at ${step.autoStopLoss.toFixed(2)}</span>
                    )}
                    <span>Confirm to place the short</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className={!completed ? 'ring-2 ring-primary ring-offset-2' : ''}
                    onClick={() => markStepComplete(step.id)}
                    disabled={completed}
                  >
                    {step.ctaLabel ?? step.highlightLabel ?? 'Confirm Short'}
                  </Button>
                </CardContent>
              </Card>
            );
          }

          if (step.kind === 'independent_trade') {
            const stopLossValue = stopLossInputs[step.id] || '';
            const needsStopLoss = step.requireStopLoss !== false;
            const blownUp = blownUpSteps[step.id];

            return (
              <Card key={step.id} className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {step.label}
                    {completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </CardTitle>
                  <CardDescription>
                    Try it without rails. You decide the stop loss.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {renderScenarioDetails(step.scenario)}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Set your stop loss {step.stopLossHint ? `(${step.stopLossHint})` : ''}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Stop loss price"
                      value={stopLossValue}
                      onChange={(event) =>
                        setStopLossInputs((prev) => ({ ...prev, [step.id]: event.target.value }))
                      }
                    />
                  </div>

                  {blownUp && !completed && (
                    <Alert variant="destructive">
                      <AlertTitle>Simulated blow-up</AlertTitle>
                      <AlertDescription>
                        No stop loss set. The position moved against you and wiped out the account.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant={completed ? 'outline' : 'default'}
                    onClick={() => {
                      const hasStopLoss = Number(stopLossValue) > 0;
                      if (needsStopLoss && !hasStopLoss) {
                        setBlownUpSteps((prev) => ({ ...prev, [step.id]: true }));
                        return;
                      }
                      setBlownUpSteps((prev) => ({ ...prev, [step.id]: false }));
                      markStepComplete(step.id);
                    }}
                    disabled={completed}
                  >
                    {completed ? 'Completed' : step.ctaLabel ?? 'Place Short'}
                  </Button>
                </CardContent>
              </Card>
            );
          }

          return null;
        })}

        {visibleSteps.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Scaffolding steps are hidden at your current level. Jump to the next challenge to keep progressing.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScaffoldedPracticeBlock;
