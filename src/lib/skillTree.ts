import type { LearningModule } from '@/hooks/useLearning';

export type SkillBranchId =
  | 'foundation'
  | 'technician'
  | 'fundamentalist'
  | 'riskManager'
  | 'psychologist';

export type SkillBranch = {
  id: SkillBranchId;
  name: string;
  focus: string;
  reward: string;
  description: string;
  moduleTitles?: string[];
};

export const skillTreeBranches: SkillBranch[] = [
  {
    id: 'foundation',
    name: 'The Foundation',
    focus: 'Market basics, order types',
    reward: 'Rookie Badge',
    description: 'Master market essentials and order mechanics.',
  },
  {
    id: 'technician',
    name: 'The Technician',
    focus: 'Chart patterns, indicators',
    reward: 'Unlock RSI & MACD Indicators',
    description: 'Specialize in technical analysis and price action.',
    moduleTitles: [
      'Trend Following',
      'Mean Reversion',
      'Breakouts',
      'Support & Resistance',
      'Entry Timing',
      'Swing Trading Basics',
      'Day Trading Basics',
      'Moving Averages',
      'Momentum Indicators',
      'RSI Strategy',
      'MACD Strategy',
      'Bollinger Bands',
      'Volume Analysis',
      'Backtesting Basics',
      'Pair Trading',
      'Advanced Chart Patterns',
      'Candlestick Patterns',
      'Fibonacci Retracements',
      'Market Breadth',
      'Market Microstructure',
    ],
  },
  {
    id: 'fundamentalist',
    name: 'The Fundamentalist',
    focus: 'Earnings, valuation, macro',
    reward: 'Unlock Comparisons + Valuation & Dividend Stats',
    description: 'Build conviction from fundamentals and macro drivers.',
    moduleTitles: [
      'Valuation Basics',
      'P/E Ratio',
      'Revenue vs Profit',
      'Balance Sheet Basics',
      'Income Statement Basics',
      'Cash Flow Basics',
      'Earnings Season Plays',
      'Earnings Quality',
      'Free Cash Flow Analysis',
      'Management Evaluation',
      'Competitive Landscape',
      'Moat Analysis',
      'News Catalysts',
      'Sector Rotation',
      'Value Screening',
      'Growth Screening',
      'Dividend Growth Strategy',
      'Small vs Large Cap',
      'Beta and Alpha',
      'Factor Investing',
      'Interest Rate Cycles',
      'Yield Curve Signals',
      'Inflation Basics',
      'Inflation Hedging',
      'Market Cycles',
      'Commodity Cycles',
      'Technical vs Fundamental',
      'Tax Loss Harvesting',
    ],
  },
  {
    id: 'riskManager',
    name: 'The Risk Manager',
    focus: 'Position sizing, stop losses',
    reward: 'Capital Guardian Title + Mentorship Access',
    description: 'Build discipline with risk controls and exit rules.',
    moduleTitles: [
      'Position Sizing',
      'Stop Losses',
      'Risk/Reward Ratio',
      'Exit Strategies',
      'Volatility',
      'Risk Tolerance',
      'Liquidity & Slippage',
      'Portfolio Risk Controls',
      'Stress Testing',
      'Risk Parity',
      'Hedging Basics',
      'Diversification by Strategy',
      'Diversifying Sectors',
      'Asset Classes',
      'Rebalancing Strategy',
      'Portfolio Optimization',
      'Sharpe Ratio',
      'Correlation Analysis',
      'Volatility Index (VIX)',
      'International Diversification',
      'Currency Risk',
      'Options Basics',
      'Covered Calls',
      'Protective Puts',
      'Credit Spreads',
      'Implied Volatility',
      'Delta, Gamma, Theta',
      'Short Selling Risks',
      'Margin & Leverage',
      'Scenario Analysis',
      'Long-Term Compounding Plan',
    ],
  },
  {
    id: 'psychologist',
    name: 'The Psychologist',
    focus: 'Emotional control, tilt',
    reward: 'Zen Master Badge + Phantom Profiles',
    description: 'Train mindset, journaling, and behavioral discipline.',
    moduleTitles: [
      'Behavioral Biases',
      'Behavioral Finance Deep Dive',
      'Strategy Journaling',
      'Time Horizon',
      'Market Cycles',
    ],
  },
];

export const getBranchById = (id: SkillBranchId) =>
  skillTreeBranches.find((branch) => branch.id === id) || skillTreeBranches[0];

export const getBranchForModule = (module: LearningModule): SkillBranchId => {
  if (module.category === 'Foundations') return 'foundation';
  const match = skillTreeBranches.find((branch) =>
    branch.moduleTitles?.includes(module.title)
  );
  return match?.id ?? 'foundation';
};

export const getBranchModules = (
  modules: LearningModule[],
  branchId: SkillBranchId
) => {
  if (branchId === 'foundation') {
    return modules.filter((module) => module.category === 'Foundations');
  }
  const branch = getBranchById(branchId);
  if (!branch.moduleTitles) return [];
  return branch.moduleTitles
    .map((title) => modules.find((module) => module.title === title))
    .filter((module): module is LearningModule => Boolean(module));
};
