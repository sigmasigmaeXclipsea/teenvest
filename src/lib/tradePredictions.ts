import { localLearningModules } from '@/data/learningLocal';

export type PredictionDirection = 'up' | 'down';

export const predictionIndicatorOptions = [
  'RSI Divergence',
  'MACD Cross',
  'Moving Average Trend',
  'Support/Resistance',
  'Volume Spike',
  'News Catalyst',
  'Earnings Momentum',
  'Chart Pattern',
];

export const predictionHorizonOptions = [
  { value: '1h', label: '1 hour', hours: 1 },
  { value: '4h', label: '4 hours', hours: 4 },
  { value: '1d', label: '1 day', hours: 24 },
  { value: '1w', label: '1 week', hours: 24 * 7 },
  { value: '1m', label: '1 month', hours: 24 * 30 },
];

export const getPredictionHorizonAt = (value: string) => {
  const option = predictionHorizonOptions.find((item) => item.value === value);
  if (!option) return null;
  return new Date(Date.now() + option.hours * 60 * 60 * 1000).toISOString();
};

const indicatorToLessonTitle: Record<string, string> = {
  'RSI Divergence': 'RSI Strategy',
  'MACD Cross': 'MACD Strategy',
  'Moving Average Trend': 'Moving Averages',
  'Support/Resistance': 'Support & Resistance',
  'Volume Spike': 'Volume Analysis',
  'Chart Pattern': 'Candlestick Patterns',
  'News Catalyst': 'Trend Following',
  'Earnings Momentum': 'Trend Following',
};

export const getLessonForIndicators = (indicators: string[]) => {
  const titles = indicators
    .map((indicator) => indicatorToLessonTitle[indicator])
    .filter(Boolean);

  if (titles.length === 0) return null;

  const lesson = localLearningModules.find(
    (module) => module.title === titles[0]
  );

  if (!lesson) return null;

  return { id: lesson.id, title: lesson.title };
};
