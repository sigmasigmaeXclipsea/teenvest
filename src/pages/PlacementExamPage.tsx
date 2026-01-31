import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePlacementExam } from '@/hooks/usePlacementExam';

type ExamQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

const EXAM_QUESTIONS: ExamQuestion[] = [
  // Q1-3: Everyone can answer
  {
    prompt: 'What does a stock represent?',
    options: ['A loan to a company', 'Ownership in a company', 'A guaranteed return', 'A tax refund'],
    correctIndex: 1,
  },
  {
    prompt: 'Which order executes immediately at the best available price?',
    options: ['Limit order', 'Stop order', 'Market order', 'Trailing stop'],
    correctIndex: 2,
  },
  {
    prompt: 'Diversification primarily reduces:',
    options: ['Fees', 'Risk', 'Taxes', 'Time'],
    correctIndex: 1,
  },
  // Q4-10: Foundations
  {
    prompt: 'What is a limit order?',
    options: ['Buy/sell at any price', 'Buy/sell at your chosen price or better', 'Auto-exit at a loss', 'Guaranteed fill'],
    correctIndex: 1,
  },
  {
    prompt: 'Bid-ask spread is the difference between:',
    options: ['Open and close', 'Buyers and sellers prices', 'High and low', 'Volume and price'],
    correctIndex: 1,
  },
  {
    prompt: 'A stop loss is used to:',
    options: ['Increase profits', 'Limit downside', 'Guarantee gains', 'Avoid taxes'],
    correctIndex: 1,
  },
  {
    prompt: 'Which statement best describes dollar-cost averaging?',
    options: ['Buy only at market lows', 'Invest a fixed amount on a schedule', 'Sell after every gain', 'Use leverage every trade'],
    correctIndex: 1,
  },
  {
    prompt: 'Market cycles are typically described as:',
    options: ['Bull and bear phases', 'Flat only', 'Always rising', 'Always falling'],
    correctIndex: 0,
  },
  {
    prompt: 'Risk tolerance refers to:',
    options: ['Your tax bracket', 'Your comfort with volatility', 'Your broker fees', 'Your leverage limit'],
    correctIndex: 1,
  },
  {
    prompt: 'An ETF is:',
    options: ['A single stock', 'A basket of assets that trades like a stock', 'A loan', 'A dividend payment'],
    correctIndex: 1,
  },
  // Q11-20: Technician level
  {
    prompt: 'In an uptrend, higher highs and higher lows indicate:',
    options: ['Trend continuation', 'Trend reversal', 'Sideways market', 'No pattern'],
    correctIndex: 0,
  },
  {
    prompt: 'A moving average is used to:',
    options: ['Predict earnings', 'Smooth price data', 'Set taxes', 'Find company debt'],
    correctIndex: 1,
  },
  {
    prompt: 'RSI above 70 often suggests:',
    options: ['Oversold', 'Overbought', 'Low volume', 'Low volatility'],
    correctIndex: 1,
  },
  {
    prompt: 'A breakout strategy typically enters when price:',
    options: ['Hits support', 'Leaves a range with momentum', 'Falls 50%', 'Is unchanged'],
    correctIndex: 1,
  },
  {
    prompt: 'MACD cross is a signal based on:',
    options: ['Two moving averages', 'Volume only', 'Earnings only', 'Dividends only'],
    correctIndex: 0,
  },
  {
    prompt: 'Support is best described as:',
    options: ['Price floor where buyers step in', 'Price ceiling where sellers step in', 'Random noise', 'Market cap'],
    correctIndex: 0,
  },
  {
    prompt: 'Resistance is best described as:',
    options: ['Price floor where buyers step in', 'Price ceiling where sellers step in', 'Dividend yield', 'P/E ratio'],
    correctIndex: 1,
  },
  {
    prompt: 'Trend following most often aligns with:',
    options: ['Buying strength', 'Selling winners early', 'Avoiding trends', 'Ignoring price'],
    correctIndex: 0,
  },
  {
    prompt: 'A candlestick with a long lower wick can indicate:',
    options: ['Buying pressure after a selloff', 'No buyers', 'Guaranteed reversal', 'Earnings miss'],
    correctIndex: 0,
  },
  {
    prompt: 'Volume analysis is used to:',
    options: ['Confirm price moves', 'Replace price data', 'Measure taxes', 'Set dividends'],
    correctIndex: 0,
  },
  // Q21-30: Fundamentalist + Risk Manager
  {
    prompt: 'Risk/reward compares:',
    options: ['Potential gain vs potential loss', 'Fees vs taxes', 'Time vs price', 'Speed vs volume'],
    correctIndex: 0,
  },
  {
    prompt: 'Position sizing is used to:',
    options: ['Increase leverage always', 'Control risk per trade', 'Avoid stop losses', 'Predict earnings'],
    correctIndex: 1,
  },
  {
    prompt: 'A balance sheet shows:',
    options: ['Revenue and profit', 'Assets, liabilities, equity', 'Only cash flow', 'Only dividends'],
    correctIndex: 1,
  },
  {
    prompt: 'Free cash flow is:',
    options: ['Cash after expenses and investment', 'Revenue only', 'Debt only', 'Taxes only'],
    correctIndex: 0,
  },
  {
    prompt: 'An earnings surprise often impacts price because it:',
    options: ['Changes expectations', 'Reduces volume', 'Guarantees gains', 'Eliminates risk'],
    correctIndex: 0,
  },
  {
    prompt: 'Correlation matters for risk because:',
    options: ['It shows how assets move together', 'It sets taxes', 'It guarantees profit', 'It removes volatility'],
    correctIndex: 0,
  },
  {
    prompt: 'A stop loss should be set based on:',
    options: ['Risk tolerance and setup invalidation', 'Random price', 'Hope', 'FOMO'],
    correctIndex: 0,
  },
  {
    prompt: 'P/E ratio compares price to:',
    options: ['Earnings', 'Revenue', 'Debt', 'Dividends'],
    correctIndex: 0,
  },
  {
    prompt: 'Diversification by strategy aims to:',
    options: ['Reduce dependence on one approach', 'Increase fees', 'Avoid risk controls', 'Eliminate losses'],
    correctIndex: 0,
  },
  {
    prompt: 'Liquidity & slippage describe:',
    options: ['Execution quality and fill cost', 'Tax rates', 'Revenue growth', 'Dividends'],
    correctIndex: 0,
  },
  // Q31-40: Technical analysis + day trading
  {
    prompt: 'A day trade typically means:',
    options: ['Hold for months', 'Open and close within a day', 'Only buy ETFs', 'Avoid volume'],
    correctIndex: 1,
  },
  {
    prompt: 'VWAP is commonly used intraday to:',
    options: ['Compare price to average trade price', 'Replace volume', 'Predict earnings', 'Set taxes'],
    correctIndex: 0,
  },
  {
    prompt: 'A false breakout is:',
    options: ['Price briefly breaks a level then reverses', 'A guaranteed trend', 'A dividend event', 'A split'],
    correctIndex: 0,
  },
  {
    prompt: 'Scalping relies on:',
    options: ['Small, quick moves', 'Long-term trends', 'Quarterly earnings', 'Dividends'],
    correctIndex: 0,
  },
  {
    prompt: 'Level 2 data shows:',
    options: ['Order book depth', 'Company balance sheet', 'Revenue growth', 'Dividend yield'],
    correctIndex: 0,
  },
  {
    prompt: 'A tight stop in day trading helps:',
    options: ['Limit losses quickly', 'Guarantee profits', 'Avoid all risk', 'Increase taxes'],
    correctIndex: 0,
  },
  {
    prompt: 'RSI divergence can signal:',
    options: ['Momentum shift', 'Guaranteed reversal', 'No change', 'Higher fees'],
    correctIndex: 0,
  },
  {
    prompt: 'A gap-and-go setup is typically:',
    options: ['A gap with continuation momentum', 'A dividend strategy', 'A bond trade', 'A long-term hold'],
    correctIndex: 0,
  },
  {
    prompt: 'A trading journal is used to:',
    options: ['Review decisions and outcomes', 'Hide mistakes', 'Avoid discipline', 'Replace a plan'],
    correctIndex: 0,
  },
  {
    prompt: 'During high volatility, a day trader should:',
    options: ['Reduce size and tighten risk', 'Double size', 'Ignore stops', 'Trade less liquid names'],
    correctIndex: 0,
  },
];

const TIER_CONFIG = [
  { id: 1, start: 1, end: 3, label: 'Baseline', placementIndex: 1 },
  { id: 2, start: 4, end: 10, label: 'Foundation', placementIndex: 6 },
  { id: 3, start: 11, end: 20, label: 'Technician', placementIndex: 11 },
  { id: 4, start: 21, end: 30, label: 'Fundamentalist + Risk Manager', placementIndex: 15 },
  { id: 5, start: 31, end: 40, label: 'Technical + Day Trading', placementIndex: 20 },
] as const;

const PASS_THRESHOLD = 0.7;

const PlacementExamPage = () => {
  const { result, saveResult, clearResult } = usePlacementExam();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const totalQuestions = EXAM_QUESTIONS.length;
  const currentScore = useMemo(() => {
    return EXAM_QUESTIONS.reduce((total, question, index) => {
      return total + (answers[index] === question.correctIndex ? 1 : 0);
    }, 0);
  }, [answers]);

  const scorePercent = Math.round((currentScore / totalQuestions) * 100);
  const tierResults = useMemo(() => {
    return TIER_CONFIG.map((tier) => {
      const indices = Array.from({ length: tier.end - tier.start + 1 }, (_, i) => tier.start + i - 1);
      const correct = indices.filter((index) => answers[index] === EXAM_QUESTIONS[index]?.correctIndex).length;
      const total = indices.length;
      const ratio = total > 0 ? correct / total : 0;
      return {
        ...tier,
        correct,
        total,
        ratio,
        passed: ratio >= PASS_THRESHOLD,
      };
    });
  }, [answers]);

  const highestTierPassed = useMemo(() => {
    const passed = tierResults.filter((tier) => tier.passed);
    return passed.length > 0 ? passed[passed.length - 1] : null;
  }, [tierResults]);

  const placementIndex = highestTierPassed?.placementIndex ?? 1;
  const recommendedHref = `/learn/local-lesson-${placementIndex}`;

  const handleSubmit = () => {
    setSubmitted(true);
    saveResult({
      placementIndex,
      score: currentScore,
      total: totalQuestions,
      highestTierPassed: highestTierPassed?.id ?? 0,
      passedTiers: tierResults.filter((tier) => tier.passed).map((tier) => tier.id),
      completedAt: new Date().toISOString(),
    });
  };

  const resetExam = () => {
    setSubmitted(false);
    setAnswers({});
    setCurrentQuestionIndex(0);
    clearResult();
  };

  const currentQuestion = EXAM_QUESTIONS[currentQuestionIndex];
  const hasAnsweredCurrent = answers[currentQuestionIndex] !== undefined;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/learn">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Learn
            </Button>
          </Link>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card/60">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              Placement Exam
            </CardTitle>
            <CardDescription>
              Take a short exam to find your best starting lesson. You can retake it anytime.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Exam Progress</CardTitle>
              <Badge variant="outline">{Object.keys(answers).length}/{totalQuestions}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={(Object.keys(answers).length / totalQuestions) * 100} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {currentQuestion && (
            <Card key={currentQuestion.prompt} className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </CardTitle>
                <CardDescription>{currentQuestion.prompt}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[currentQuestionIndex]?.toString()}
                  onValueChange={(value) =>
                    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: Number(value) }))
                  }
                  className="space-y-2"
                >
                  {currentQuestion.options.map((option, optionIndex) => (
                    <div key={option} className="flex items-center space-x-3">
                      <RadioGroupItem
                        value={optionIndex.toString()}
                        id={`q${currentQuestionIndex}-${optionIndex}`}
                      />
                      <Label htmlFor={`q${currentQuestionIndex}-${optionIndex}`} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}
          {!submitted && (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  disabled={!hasAnsweredCurrent}
                >
                  Next
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={!hasAnsweredCurrent || Object.keys(answers).length < totalQuestions}
                  onClick={handleSubmit}
                >
                  Submit Exam
                </Button>
              )}
            </div>
          )}
        </div>

        {submitted && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Placement Result
              </CardTitle>
              <CardDescription>
                You scored {currentScore}/{totalQuestions} ({scorePercent}%).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Recommended start: Lesson {placementIndex}
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                {tierResults.map((tier) => (
                  <div key={tier.id} className="flex items-center justify-between">
                    <span>{tier.label}</span>
                    <span className={tier.passed ? 'text-emerald-600' : 'text-muted-foreground'}>
                      {tier.correct}/{tier.total} • {Math.round(tier.ratio * 100)}% {tier.passed ? 'passed' : 'not passed'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to={recommendedHref}>
                  <Button variant="default">Go to Lesson {placementIndex}</Button>
                </Link>
                <Button variant="outline" onClick={resetExam}>
                  Retake Exam
                </Button>
              </div>
              {result && (
                <p className="text-xs text-muted-foreground">
                  Last saved placement: Lesson {result.placementIndex}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PlacementExamPage;
