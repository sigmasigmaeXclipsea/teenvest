import type { InteractiveBlock } from '@/components/learn/InteractiveBlockRenderer';
import type { ScaffoldedPracticeStep } from '@/components/learn/ScaffoldedPracticeBlock';

export type LocalLearningModule = {
  id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  duration_minutes: number;
  created_at: string;
  category?: 'Foundations' | 'Strategy' | 'Advanced';
  interactive_blocks?: InteractiveBlock[];
};

export type LocalQuizQuestion = {
  id: string;
  module_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  order_index: number;
};

const now = new Date().toISOString();

type LessonSeed = {
  title: string;
  description: string;
  definition: string;
  category: 'Foundations' | 'Strategy' | 'Advanced';
};

const categoryMeta = {
  Foundations: {
    why: 'This builds your base so you can make smart, low-risk decisions about {topic}.',
    mistakes: ['Skipping the basics and chasing hype', 'Ignoring fees, risk, or time horizon'],
    exercise: 'Write one sentence explaining {topic} in your own words.',
  },
  Strategy: {
    why: 'This helps you turn ideas about {topic} into repeatable trading decisions.',
    mistakes: ['Overtrading without a plan', 'Ignoring risk controls and exit rules'],
    exercise: 'Draft a simple rule for when you would use {topic}.',
  },
  Advanced: {
    why: 'This deepens your edge on {topic} and improves professional-level analysis.',
    mistakes: ['Overfitting signals to the past', 'Ignoring liquidity, regime, or macro context'],
    exercise: 'List one metric or signal that strengthens {topic} analysis.',
  },
} as const;

const keyPointSets = [
  [
    'What {topic} means and when it applies.',
    'How {topic} affects risk, return, or cost.',
    'A simple rule of thumb for {topic}.',
  ],
  [
    'The core idea behind {topic}.',
    'Inputs or signals commonly used with {topic}.',
    'How to apply {topic} in a basic decision.',
  ],
  [
    'Benefits and trade-offs of {topic}.',
    'A quick example of {topic} in action.',
    'One thing to monitor when using {topic}.',
  ],
];

<<<<<<< HEAD
const fillTemplate = (template: string, topic: string) => template.replace(/{topic}/g, topic);
=======
const fillTemplate = (template: string, topic: string) => template.split('{topic}').join(topic);
>>>>>>> a398009a4477ed85581aae27611f08e45fdfc99c

const ensureSentence = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const lastChar = trimmed[trimmed.length - 1];
  return ['.', '!', '?'].includes(lastChar) ? trimmed : `${trimmed}.`;
};

const buildFoundationsContent = (seed: LessonSeed, orderIndex: number) => {
  const topic = seed.title.toLowerCase();
  const meta = categoryMeta.Foundations;
  const points = keyPointSets[orderIndex % keyPointSets.length].map((point) =>
    ensureSentence(fillTemplate(point, topic))
  );
  const mistakes = meta.mistakes.map((mistake) => ensureSentence(mistake));
  const whySentence = ensureSentence(fillTemplate(meta.why, topic));
  const exerciseSentence = ensureSentence(fillTemplate(meta.exercise, topic));
  const overviewSentences = [
    ensureSentence(seed.definition),
    ensureSentence(`This concept underpins disciplined decision-making and clarifies why ${topic} is important`),
    whySentence,
    ensureSentence('It also clarifies the trade-off between optionality today and compounding tomorrow'),
    ensureSentence(`You will revisit ${topic} whenever a decision carries uncertainty or time pressure`),
  ];
  const deepDiveSentences = [
    ensureSentence(`A useful mental model is to treat ${topic} as a set of constraints, not a single rule`),
    ensureSentence('Those constraints force you to weigh opportunity cost, risk, and liquidity before acting'),
    ensureSentence('When you do this consistently, your process becomes repeatable instead of reactive'),
    ensureSentence('Over time, the quality of your process becomes the real source of compounding advantage'),
    ensureSentence('A second model is to separate what you can control from what you cannot'),
    ensureSentence('This separation prevents you from confusing noise with information'),
    ensureSentence('It also pushes you to define thresholds before acting, which reduces impulsive trades'),
    ensureSentence('The more explicit the thresholds, the easier it is to audit your decisions later'),
  ];
  const applicationSentences = [
    ensureSentence(`In real portfolios, ${topic} shows up in position size, time horizon, and the structure of your rules`),
    ensureSentence(`A small change in ${topic} can cascade into different risk outcomes, so document your assumptions`),
    ensureSentence('Keep a short note on why your choice aligns with your goals, not just current market mood'),
  ];
  const measurementSentences = [
    ensureSentence(`Track one or two measurable inputs so you can see if ${topic} is working`),
    ensureSentence('If the inputs drift, adjust the process rather than chasing a single outcome'),
  ];
  const checklist = [
    ensureSentence('Define the decision you are trying to make'),
    ensureSentence('Specify your time horizon and the downside you are willing to accept'),
    ensureSentence('Write the rule you will follow if conditions change'),
  ];

  return `**Overview**
${overviewSentences[0]}
${overviewSentences[1]}
${overviewSentences[2]}
${overviewSentences[3]}
${overviewSentences[4]}

**Deep dive**
${deepDiveSentences[0]}
${deepDiveSentences[1]}
${deepDiveSentences[2]}
${deepDiveSentences[3]}
${deepDiveSentences[4]}
${deepDiveSentences[5]}
${deepDiveSentences[6]}
${deepDiveSentences[7]}

**Applied perspective**
${applicationSentences[0]}
${applicationSentences[1]}
${applicationSentences[2]}

**Measurement**
${measurementSentences[0]}
${measurementSentences[1]}

**Key points**
- ${points[0]}
- ${points[1]}
- ${points[2]}

**Practical checklist**
- ${checklist[0]}
- ${checklist[1]}
- ${checklist[2]}

**Common mistakes**
- ${mistakes[0]}
- ${mistakes[1]}

**Mini exercise**
- ${exerciseSentence}`;
};

const buildStrategyContent = (seed: LessonSeed, orderIndex: number) => {
  const topic = seed.title.toLowerCase();
  const meta = categoryMeta.Strategy;
  const points = keyPointSets[orderIndex % keyPointSets.length].map((point) =>
    ensureSentence(fillTemplate(point, topic))
  );
  const mistakes = meta.mistakes.map((mistake) => ensureSentence(mistake));
  const whySentence = ensureSentence(fillTemplate(meta.why, topic));
  const exerciseSentence = ensureSentence(fillTemplate(meta.exercise, topic));

  const overviewSentences = [
    ensureSentence(seed.definition),
    ensureSentence(`This strategy focuses on translating ${topic} into a repeatable decision system`),
    whySentence,
    ensureSentence(`Understanding ${topic} helps you execute with discipline instead of emotion`),
    ensureSentence(`You will use ${topic} whenever market conditions match your predefined criteria`),
  ];

  const setupSentences = [
    ensureSentence(`Define the market condition where ${topic} historically performs best`),
    ensureSentence('Clarify the signal you will act on and the timeframe it applies to'),
    ensureSentence('Write down the exact trigger so you are not improvising under pressure'),
    ensureSentence('Back-test the setup on historical data to gauge win rate and drawdown'),
  ];

  const signalSentences = [
    ensureSentence('Use one confirming input to reduce false signals'),
    ensureSentence('If the confirmation fails, stand down and wait for the next setup'),
    ensureSentence('Track the percentage of times confirmation improved your entries'),
    ensureSentence('Avoid stacking too many filters, which can eliminate valid trades'),
  ];

  const riskSentences = [
    ensureSentence('Decide your stop level before entry and size the position to that stop'),
    ensureSentence('Target a reward that justifies the risk and matches the expected move'),
    ensureSentence('Never move your stop further away once the trade is live'),
    ensureSentence('Log the risk/reward ratio for every trade to spot patterns'),
  ];

  const psychologySentences = [
    ensureSentence('Accept that not every trade will win; focus on process over outcome'),
    ensureSentence('Review losing trades without blame to extract lessons'),
    ensureSentence('Maintain a checklist to reduce impulsive decisions'),
  ];

  return `**Overview**
${overviewSentences[0]}
${overviewSentences[1]}
${overviewSentences[2]}
${overviewSentences[3]}
${overviewSentences[4]}

**Strategy setup**
${setupSentences[0]}
${setupSentences[1]}
${setupSentences[2]}
${setupSentences[3]}

**Signal & confirmation**
${signalSentences[0]}
${signalSentences[1]}
${signalSentences[2]}
${signalSentences[3]}

**Risk plan**
${riskSentences[0]}
${riskSentences[1]}
${riskSentences[2]}
${riskSentences[3]}

**Trading psychology**
${psychologySentences[0]}
${psychologySentences[1]}
${psychologySentences[2]}

**Key points**
- ${points[0]}
- ${points[1]}
- ${points[2]}

**Execution checklist**
- ${ensureSentence('Confirm trend, catalyst, or range condition')}
- ${ensureSentence('Set entry, stop, and target levels')}
- ${ensureSentence('Record the trade rationale and exit rule')}
- ${ensureSentence('Review outcome and update journal')}

**Common mistakes**
- ${mistakes[0]}
- ${mistakes[1]}

**Mini exercise**
- ${exerciseSentence}`;
};

const buildAdvancedContent = (seed: LessonSeed, orderIndex: number) => {
  const topic = seed.title.toLowerCase();
  const meta = categoryMeta.Advanced;
  const points = keyPointSets[orderIndex % keyPointSets.length].map((point) =>
    ensureSentence(fillTemplate(point, topic))
  );
  const mistakes = meta.mistakes.map((mistake) => ensureSentence(mistake));
  const whySentence = ensureSentence(fillTemplate(meta.why, topic));
  const exerciseSentence = ensureSentence(fillTemplate(meta.exercise, topic));

  const overviewSentences = [
    ensureSentence(seed.definition),
    ensureSentence(`${seed.title} sits at the intersection of theory and real-world market dynamics`),
    whySentence,
    ensureSentence(`Mastering ${topic} differentiates advanced practitioners from casual participants`),
    ensureSentence(`This concept requires both quantitative understanding and contextual judgment`),
  ];

  const theorySentences = [
    ensureSentence(`The academic foundation of ${topic} comes from portfolio theory and econometrics`),
    ensureSentence('Researchers identified patterns that persist across markets and time periods'),
    ensureSentence('However, real markets have frictions, so textbook formulas need adjustment'),
    ensureSentence('Develop intuition for when models break down due to regime shifts'),
  ];

  const applicationSentences = [
    ensureSentence(`Apply ${topic} by integrating it into your existing decision framework`),
    ensureSentence('Start with small position sizes until you verify edge in live conditions'),
    ensureSentence('Document every hypothesis and its outcome to build an evidence base'),
    ensureSentence('Iterate quickly; discard ideas that do not survive out-of-sample testing'),
  ];

  const edgeCases = [
    ensureSentence('Liquidity crises can invalidate normal relationships'),
    ensureSentence('Correlations shift during stress, reducing diversification benefits'),
    ensureSentence('Crowded trades unwind violently when sentiment reverses'),
  ];

  const integrationSentences = [
    ensureSentence(`Combine ${topic} with macro context for a fuller picture`),
    ensureSentence('Cross-check signals from multiple timeframes before acting'),
    ensureSentence('Use scenario analysis to stress-test assumptions'),
  ];

  return `**Overview**
${overviewSentences[0]}
${overviewSentences[1]}
${overviewSentences[2]}
${overviewSentences[3]}
${overviewSentences[4]}

**Theoretical foundation**
${theorySentences[0]}
${theorySentences[1]}
${theorySentences[2]}
${theorySentences[3]}

**Practical application**
${applicationSentences[0]}
${applicationSentences[1]}
${applicationSentences[2]}
${applicationSentences[3]}

**Edge cases & regime shifts**
${edgeCases[0]}
${edgeCases[1]}
${edgeCases[2]}

**Integrating with your process**
${integrationSentences[0]}
${integrationSentences[1]}
${integrationSentences[2]}

**Key points**
- ${points[0]}
- ${points[1]}
- ${points[2]}

**Advanced checklist**
- ${ensureSentence('Verify data quality before running analysis')}
- ${ensureSentence('Check for look-ahead bias in any back-test')}
- ${ensureSentence('Monitor position for regime changes post-entry')}
- ${ensureSentence('Update thesis if fundamentals shift materially')}

**Common mistakes**
- ${mistakes[0]}
- ${mistakes[1]}

**Mini exercise**
- ${exerciseSentence}`;
};

const SHORT_SELLING_TITLE = 'Short Selling Risks';
const MARKET_ORDER_TITLE = 'Market Orders';

const buildScaffoldedTranscript = (seed: LessonSeed) => {
  const topic = seed.title.toLowerCase();
  const sentences = [
    ensureSentence(seed.definition),
    ensureSentence(`Here is the core idea behind ${topic} and how it changes risk`),
    ensureSentence(`Watch how the setup, trigger, and exit work together for ${topic}`),
    ensureSentence('Next, you will practice with guidance and then run it solo'),
  ];
  return sentences.join(' ');
};

const buildShortSellingTranscript = () =>
  [
    'Short selling means borrowing shares to sell now and buy back later at a lower price.',
    'The risk is asymmetric because losses can grow if price rises.',
    'A protective stop loss caps the damage and keeps the lesson survivable.',
    'Watch the setup, then practice the short with and without guardrails.',
  ]
    .map((sentence) => ensureSentence(sentence))
    .join(' ');

const buildScaffoldedSteps = (seed: LessonSeed, moduleId: string): ScaffoldedPracticeStep[] => {
  if (seed.title === SHORT_SELLING_TITLE) {
    return [
      {
        id: `${moduleId}-i-do`,
        label: 'I Do',
        kind: 'video',
        title: 'Short selling in 60 seconds',
        description: 'Watch a quick walkthrough of a short sale with a stop loss.',
        durationSeconds: 60,
        transcript: buildShortSellingTranscript(),
      },
      {
        id: `${moduleId}-we-do`,
        label: 'We Do',
        kind: 'guided_trade',
        scenario: {
          symbol: 'TEENV',
          setup: 'Price breaks below support with heavy volume after weak guidance.',
          entryPrice: 102,
          stopLossPrice: 105.5,
          targetPrice: 96,
          direction: 'short',
        },
        ctaLabel: 'Confirm short',
        highlightLabel: 'Sell',
        autoStopLoss: 105.5,
      },
      {
        id: `${moduleId}-you-do`,
        label: 'You Do',
        kind: 'independent_trade',
        scenario: {
          symbol: 'TEENV',
          setup: 'Bearish reversal candle forms near the prior highs.',
          entryPrice: 108,
          targetPrice: 100,
          direction: 'short',
        },
        requireStopLoss: true,
        stopLossHint: 'Try 3-5% above entry',
        ctaLabel: 'Place short',
      },
    ];
  }

  return [
    {
      id: `${moduleId}-i-do`,
      label: 'I Do',
      kind: 'video',
      title: `${seed.title} in 60 seconds`,
      description: 'Watch the core idea before you practice.',
      durationSeconds: 60,
      transcript: buildScaffoldedTranscript(seed),
    },
    {
      id: `${moduleId}-we-do`,
      label: 'We Do',
      kind: 'guided_prompt',
      prompt: `Follow along as we apply ${seed.title} to a simple decision.`,
      helperText: 'We highlight the key signal and the rule you will follow.',
      ctaLabel: 'Confirm setup',
    },
    {
      id: `${moduleId}-you-do`,
      label: 'You Do',
      kind: 'reflection',
      prompt: `In one sentence, when would you use ${seed.title}?`,
      placeholder: `I would use ${seed.title.toLowerCase()} when...`,
      ctaLabel: 'Save response',
    },
  ];
};

const shouldAttachScaffold = (seed: LessonSeed) => {
  if (seed.title === MARKET_ORDER_TITLE) return false;
  if (seed.title === SHORT_SELLING_TITLE) return true;
  return seed.category === 'Foundations' || seed.category === 'Strategy';
};

const buildLessonContent = (seed: LessonSeed, orderIndex: number) => {
  if (seed.category === 'Foundations') {
    return buildFoundationsContent(seed, orderIndex);
  }
  if (seed.category === 'Strategy') {
    return buildStrategyContent(seed, orderIndex);
  }
  if (seed.category === 'Advanced') {
    return buildAdvancedContent(seed, orderIndex);
  }

  // Fallback to Foundations style
  return buildFoundationsContent(seed, orderIndex);
};

const foundationsSeeds: LessonSeed[] = [
  { title: 'Investing Basics', description: 'What investing is and why it matters.', definition: 'Investing is putting money into assets expected to grow over time.', category: 'Foundations' },
  { title: 'Stocks vs. Bonds', description: 'Ownership versus lending.', definition: 'Stocks represent ownership while bonds are loans that pay interest.', category: 'Foundations' },
  { title: 'Risk & Diversification', description: 'Reduce downside by spreading exposure.', definition: 'Diversification lowers risk by spreading investments across assets.', category: 'Foundations' },
  { title: 'Order Types', description: 'Market, limit, and stop orders.', definition: 'Order types control how and when trades are executed.', category: 'Foundations' },
  { title: 'Compound Interest', description: 'Returns build on themselves.', definition: 'Compounding is earning returns on your original money and prior returns.', category: 'Foundations' },
  { title: 'Inflation Basics', description: 'Why prices rise over time.', definition: 'Inflation reduces purchasing power as prices rise.', category: 'Foundations' },
  { title: 'Budgeting for Investors', description: 'Make room to invest regularly.', definition: 'Budgeting helps you consistently allocate money to investing.', category: 'Foundations' },
  { title: 'Emergency Fund', description: 'Cash buffer before investing.', definition: 'An emergency fund protects you from selling investments at bad times.', category: 'Foundations' },
  { title: 'Risk Tolerance', description: 'How much volatility you can handle.', definition: 'Risk tolerance is your comfort with portfolio ups and downs.', category: 'Foundations' },
  { title: 'Asset Classes', description: 'Stocks, bonds, and cash.', definition: 'Asset classes are groups of investments with different risk/return.', category: 'Foundations' },
  { title: 'Index Funds', description: 'Simple diversification.', definition: 'Index funds track a market index for low-cost diversification.', category: 'Foundations' },
  { title: 'ETFs Explained', description: 'Funds that trade like stocks.', definition: 'ETFs are diversified funds that trade throughout the day.', category: 'Foundations' },
  { title: 'Fees & Expense Ratios', description: 'Small fees add up.', definition: 'Expense ratios are annual fees charged by funds.', category: 'Foundations' },
  { title: 'Dividends', description: 'Shareholder payouts.', definition: 'Dividends are company payments to shareholders from profits.', category: 'Foundations' },
  { title: 'Market Orders', description: 'Fast execution.', definition: 'Market orders execute immediately at the best available price.', category: 'Foundations' },
  { title: 'Limit Orders', description: 'Control your price.', definition: 'Limit orders execute only at your chosen price or better.', category: 'Foundations' },
  { title: 'Bid vs Ask', description: 'Understand the spread.', definition: 'Bid is what buyers pay, ask is what sellers accept.', category: 'Foundations' },
  { title: 'Dollar-Cost Averaging', description: 'Investing on a schedule.', definition: 'DCA is investing a fixed amount regularly to reduce timing risk.', category: 'Foundations' },
  { title: 'Market Cycles', description: 'Bull vs bear markets.', definition: 'Markets move through rising and falling cycles over time.', category: 'Foundations' },
  { title: 'Time Horizon', description: 'Match time to risk.', definition: 'Time horizon is how long you can keep money invested.', category: 'Foundations' },
  { title: 'Diversifying Sectors', description: 'Spread across industries.', definition: "Sector diversification reduces exposure to one industry's risks.", category: 'Foundations' },
  { title: 'Valuation Basics', description: 'Price vs value.', definition: "Valuation compares a stock's price to business fundamentals.", category: 'Foundations' },
  { title: 'P/E Ratio', description: 'Price to earnings.', definition: 'P/E is price divided by earnings per share.', category: 'Foundations' },
  { title: 'Revenue vs Profit', description: 'Top line vs bottom line.', definition: 'Revenue is total sales; profit is what remains after costs.', category: 'Foundations' },
  { title: 'Balance Sheet Basics', description: 'Assets, liabilities, equity.', definition: 'A balance sheet shows what a company owns and owes.', category: 'Foundations' },
  { title: 'Income Statement Basics', description: 'How companies earn money.', definition: 'An income statement shows revenue, expenses, and profit.', category: 'Foundations' },
  { title: 'Cash Flow Basics', description: 'Why cash matters.', definition: 'Cash flow tracks money moving in and out of a business.', category: 'Foundations' },
  { title: 'Volatility', description: 'Why prices swing.', definition: 'Volatility measures how much prices move up and down.', category: 'Foundations' },
  { title: 'Behavioral Biases', description: 'Common investor mistakes.', definition: 'Behavioral biases are emotional errors like fear or greed.', category: 'Foundations' },
  { title: 'Build Your First Portfolio', description: 'A simple starter plan.', definition: 'A starter portfolio is a diversified mix aligned to your goals.', category: 'Foundations' },
];

const strategySeeds: LessonSeed[] = [
  { title: 'Trend Following', description: 'Ride sustained price moves.', definition: 'Trend following buys strength and exits when trend weakens.', category: 'Strategy' },
  { title: 'Mean Reversion', description: 'Prices return to average.', definition: 'Mean reversion bets that prices move back toward historical averages.', category: 'Strategy' },
  { title: 'Breakouts', description: 'Trading new highs/lows.', definition: 'Breakout strategies enter when price leaves a range.', category: 'Strategy' },
  { title: 'Support & Resistance', description: 'Key price levels.', definition: 'Support and resistance are levels where price often stalls.', category: 'Strategy' },
  { title: 'News Catalysts', description: 'Trading around events.', definition: 'News catalysts move price through surprises or guidance.', category: 'Strategy' },
  { title: 'Position Sizing', description: 'Control risk per trade.', definition: 'Position sizing limits loss by scaling how much you buy.', category: 'Strategy' },
  { title: 'Stop Losses', description: 'Predefined exits.', definition: 'Stop losses cut losses if price moves against you.', category: 'Strategy' },
  { title: 'Risk/Reward Ratio', description: 'Reward vs risk.', definition: 'Risk/reward compares potential gain to potential loss.', category: 'Strategy' },
  { title: 'Entry Timing', description: 'When to open a trade.', definition: 'Entry timing uses signals to open positions with an edge.', category: 'Strategy' },
  { title: 'Exit Strategies', description: 'When to take profits.', definition: 'Exit strategies define how and when to close trades.', category: 'Strategy' },
  { title: 'Swing Trading Basics', description: 'Hold for days to weeks.', definition: 'Swing trading targets multi-day price moves.', category: 'Strategy' },
  { title: 'Day Trading Basics', description: 'Intraday trades.', definition: 'Day trading opens and closes positions within a day.', category: 'Strategy' },
  { title: 'Momentum Indicators', description: 'Speed of price movement.', definition: 'Momentum indicators measure the strength of price moves.', category: 'Strategy' },
  { title: 'Moving Averages', description: 'Trend smoothing.', definition: 'Moving averages smooth price to identify trend direction.', category: 'Strategy' },
  { title: 'RSI Strategy', description: 'Overbought/oversold signals.', definition: 'RSI signals when price may be stretched too far.', category: 'Strategy' },
  { title: 'MACD Strategy', description: 'Trend and momentum.', definition: 'MACD shows momentum shifts via moving average crossovers.', category: 'Strategy' },
  { title: 'Bollinger Bands', description: 'Volatility bands.', definition: 'Bollinger Bands show price relative to volatility.', category: 'Strategy' },
  { title: 'Volume Analysis', description: 'Confirm price moves.', definition: 'Volume confirms whether a price move is strong or weak.', category: 'Strategy' },
  { title: 'Sector Rotation', description: 'Shift with cycles.', definition: 'Sector rotation shifts exposure as the economy changes.', category: 'Strategy' },
  { title: 'Earnings Season Plays', description: 'Trading quarterly reports.', definition: 'Earnings plays trade around results and guidance.', category: 'Strategy' },
  { title: 'Diversification by Strategy', description: 'Mix strategy styles.', definition: 'Strategy diversification reduces dependence on one method.', category: 'Strategy' },
  { title: 'Hedging Basics', description: 'Reduce downside.', definition: 'Hedging offsets risk with positions that move opposite.', category: 'Strategy' },
  { title: 'Pair Trading', description: 'Long/short relative value.', definition: 'Pair trading bets on relative performance between two stocks.', category: 'Strategy' },
  { title: 'Value Screening', description: 'Find undervalued stocks.', definition: 'Value screens filter stocks by cheap valuations.', category: 'Strategy' },
  { title: 'Growth Screening', description: 'Find fast growers.', definition: 'Growth screens filter stocks with high revenue or earnings growth.', category: 'Strategy' },
  { title: 'Dividend Growth Strategy', description: 'Income that grows.', definition: 'Dividend growth focuses on companies raising payouts over time.', category: 'Strategy' },
  { title: 'Rebalancing Strategy', description: 'Maintain target mix.', definition: 'Rebalancing keeps portfolio weights aligned with goals.', category: 'Strategy' },
  { title: 'Portfolio Optimization', description: 'Maximize risk-adjusted return.', definition: 'Optimization balances expected return against risk.', category: 'Strategy' },
  { title: 'Backtesting Basics', description: 'Test strategies on history.', definition: 'Backtesting evaluates strategies using past data.', category: 'Strategy' },
  { title: 'Strategy Journaling', description: 'Track decisions and results.', definition: 'A trading journal documents trades to improve discipline.', category: 'Strategy' },
];

const expertSeeds: LessonSeed[] = [
  { title: 'Advanced Chart Patterns', description: 'Complex price structures.', definition: 'Advanced patterns identify multi-step market structures.', category: 'Advanced' },
  { title: 'Candlestick Patterns', description: 'Price action signals.', definition: 'Candlesticks show buyer and seller pressure within a period.', category: 'Advanced' },
  { title: 'Fibonacci Retracements', description: 'Measure pullbacks.', definition: 'Fibonacci levels estimate likely retracement zones.', category: 'Advanced' },
  { title: 'Market Breadth', description: 'How many stocks participate.', definition: 'Breadth measures how broad a market move is.', category: 'Advanced' },
  { title: 'Volatility Index (VIX)', description: 'Market fear gauge.', definition: 'The VIX reflects expected market volatility.', category: 'Advanced' },
  { title: 'Correlation Analysis', description: 'How assets move together.', definition: 'Correlation measures how two assets move relative to each other.', category: 'Advanced' },
  { title: 'Beta and Alpha', description: 'Market exposure and excess return.', definition: 'Beta measures market sensitivity; alpha is excess return.', category: 'Advanced' },
  { title: 'Sharpe Ratio', description: 'Risk-adjusted return.', definition: 'Sharpe ratio compares return to volatility.', category: 'Advanced' },
  { title: 'Risk Parity', description: 'Balance risk contributions.', definition: 'Risk parity allocates so each asset contributes similar risk.', category: 'Advanced' },
  { title: 'Factor Investing', description: 'Style-based returns.', definition: 'Factor investing targets traits like value or momentum.', category: 'Advanced' },
  { title: 'Small vs Large Cap', description: 'Size effects.', definition: 'Company size affects risk, growth, and volatility.', category: 'Advanced' },
  { title: 'International Diversification', description: 'Global exposure.', definition: 'International investing spreads risk across countries.', category: 'Advanced' },
  { title: 'Currency Risk', description: 'FX impact on returns.', definition: 'Currency moves can amplify or reduce foreign returns.', category: 'Advanced' },
  { title: 'Interest Rate Cycles', description: 'Rates and markets.', definition: 'Rate changes influence valuations and sector performance.', category: 'Advanced' },
  { title: 'Yield Curve Signals', description: 'Economic expectations.', definition: 'Yield curves can signal growth or recession expectations.', category: 'Advanced' },
  { title: 'Inflation Hedging', description: 'Protect purchasing power.', definition: 'Hedges aim to offset losses from rising inflation.', category: 'Advanced' },
  { title: 'Commodity Cycles', description: 'Supply and demand swings.', definition: 'Commodities move in cycles tied to global demand.', category: 'Advanced' },
  { title: 'Technical vs Fundamental', description: 'Two analysis lenses.', definition: 'Technical focuses on price; fundamental on business value.', category: 'Advanced' },
  { title: 'Earnings Quality', description: 'Sustainable profits.', definition: 'Quality earnings are repeatable and cash-backed.', category: 'Advanced' },
  { title: 'Free Cash Flow Analysis', description: 'Cash after expenses.', definition: 'Free cash flow measures cash available after investments.', category: 'Advanced' },
  { title: 'Moat Analysis', description: 'Competitive advantages.', definition: 'A moat is a durable edge protecting profits.', category: 'Advanced' },
  { title: 'Competitive Landscape', description: 'Industry positioning.', definition: 'Landscape analysis compares rivals and market power.', category: 'Advanced' },
  { title: 'Management Evaluation', description: 'Leadership quality.', definition: 'Management quality affects execution and capital allocation.', category: 'Advanced' },
  { title: 'Insider Trading Signals', description: 'Inside ownership activity.', definition: 'Insider buys can signal confidence; sells can be neutral.', category: 'Advanced' },
  { title: 'Options Basics', description: 'Calls and puts.', definition: 'Options give the right to buy or sell at a set price.', category: 'Advanced' },
  { title: 'Covered Calls', description: 'Income on holdings.', definition: 'Covered calls sell call options against owned shares.', category: 'Advanced' },
  { title: 'Protective Puts', description: 'Insurance for positions.', definition: 'Protective puts limit downside on owned shares.', category: 'Advanced' },
  { title: 'Credit Spreads', description: 'Defined-risk options.', definition: 'Credit spreads sell one option and buy another for protection.', category: 'Advanced' },
  { title: 'Implied Volatility', description: "Market's expected moves.", definition: 'Implied volatility is the market forecast of future moves.', category: 'Advanced' },
  { title: 'Delta, Gamma, Theta', description: 'Options risk measures.', definition: 'Greeks measure sensitivity to price, time, and volatility.', category: 'Advanced' },
  { title: 'Liquidity & Slippage', description: 'Execution quality.', definition: 'Low liquidity can cause worse fills via slippage.', category: 'Advanced' },
  { title: 'Market Microstructure', description: 'How orders flow.', definition: 'Microstructure studies how trades form prices.', category: 'Advanced' },
  { title: 'Short Selling Risks', description: 'Losses can be unlimited.', definition: 'Shorting borrows shares to profit from declines but adds risk.', category: 'Advanced' },
  { title: 'Margin & Leverage', description: 'Borrowed capital.', definition: 'Leverage amplifies gains and losses using borrowed funds.', category: 'Advanced' },
  { title: 'Tax Loss Harvesting', description: 'Offset gains with losses.', definition: 'Harvesting uses losses to reduce taxable gains.', category: 'Advanced' },
  { title: 'Behavioral Finance Deep Dive', description: 'Psychology in markets.', definition: 'Behavioral finance studies how bias affects decisions.', category: 'Advanced' },
  { title: 'Scenario Analysis', description: 'Plan for outcomes.', definition: 'Scenario analysis tests outcomes under different assumptions.', category: 'Advanced' },
  { title: 'Stress Testing', description: 'Extreme risk checks.', definition: 'Stress tests evaluate performance under extreme events.', category: 'Advanced' },
  { title: 'Portfolio Risk Controls', description: 'Limit drawdowns.', definition: 'Risk controls set limits on losses and exposure.', category: 'Advanced' },
  { title: 'Long-Term Compounding Plan', description: 'Capstone investing plan.', definition: 'A compounding plan automates contributions and reviews.', category: 'Advanced' },
];

const lessonSeeds = [...foundationsSeeds, ...strategySeeds, ...expertSeeds];

const interactiveBlocksByOrder: Record<number, InteractiveBlock[]> = {
  1: [
    {
      type: 'mini_quiz',
      prompt: 'What is the biggest advantage of starting early?',
      options: ['Lower taxes', 'Compound growth', 'Guaranteed gains', 'Free money'],
      correctIndex: 1,
      feedback: {
        correct: 'Correct. Compound growth accelerates over time.',
        incorrect: 'Not quite. The big advantage is compound growth.',
      },
    },
    {
      type: 'interactive_chart',
      title: 'Compounding Over Time',
      sliderLabel: 'Years invested',
      sliderRange: { min: 1, max: 30, step: 1 },
      seriesFormula: 'compound',
    },
  ],
  3: [
    {
      type: 'mini_quiz',
      prompt: 'Diversification primarily reduces:',
      options: ['Fees', 'Risk', 'Taxes', 'Time'],
      correctIndex: 1,
      feedback: {
        correct: 'Yes. Diversification reduces risk by spreading exposure.',
        incorrect: 'Not quite. It reduces risk, not fees or taxes.',
      },
    },
  ],
  12: [
    {
      type: 'interactive_chart',
      title: 'ETF Cost vs. Time',
      sliderLabel: 'Years invested',
      sliderRange: { min: 1, max: 25, step: 1 },
      seriesFormula: 'compound',
    },
  ],
  35: [
    {
      type: 'trade_sim',
      symbol: 'TEENV',
      startPrice: 100,
      volatility: 0.015,
      steps: 60,
      headline: 'TeenVest beats earnings expectations',
      summary: 'Revenue grew 18% year-over-year with strong user growth.',
      stat: 'EPS +22% • Guidance raised',
      sentiment: 'bullish',
      biasStrength: 0.25,
      newsImpactPrompted: true,
    },
  ],
  45: [
    {
      type: 'mini_quiz',
      prompt: 'Which indicator often signals overbought conditions?',
      options: ['RSI', 'P/E ratio', 'Dividend yield', 'Revenue growth'],
      correctIndex: 0,
      feedback: {
        correct: 'Yes. RSI often signals overbought/oversold conditions.',
        incorrect: 'RSI is the indicator most commonly used here.',
      },
    },
  ],
  65: [
    {
      type: 'interactive_chart',
      title: 'Volatility Scenarios',
      sliderLabel: 'Risk level',
      sliderRange: { min: 1, max: 10, step: 1 },
      seriesFormula: 'linear',
    },
  ],
  85: [
    {
      type: 'mini_quiz',
      prompt: 'Options give you the right to:',
      options: ['Buy or sell at a set price', 'Guarantee profits', 'Avoid taxes', 'Skip risk'],
      correctIndex: 0,
      feedback: {
        correct: 'Correct. Options give the right, not obligation, to trade.',
        incorrect: 'Options are rights to buy or sell at a set price.',
      },
    },
  ],
};

const buildMiniQuizBlock = (seed: LessonSeed, orderIndex: number, variant: 'definition' | 'application') => {
  const topic = seed.title.toLowerCase();
  if (variant === 'application') {
    return {
      type: 'mini_quiz' as const,
      prompt: `Which action best applies ${seed.title}?`,
      options: [
        `Use ${topic} to guide a decision with risk and time in mind`,
        'Follow hype and ignore risk limits',
        'Assume outcomes are guaranteed',
        'Avoid planning and react later',
      ],
      correctIndex: 0,
      feedback: {
        correct: `Correct. ${seed.title} is about applying a disciplined process.`,
        incorrect: `Not quite. ${seed.title} works best with a clear, disciplined process.`,
      },
    };
  }

  return {
    type: 'mini_quiz' as const,
    prompt: `What best defines ${seed.title}?`,
    options: [
      seed.definition,
      'A guaranteed profit strategy',
      'A tax rule unrelated to investing',
      'A brokerage fee charged per trade',
    ],
    correctIndex: 0,
    feedback: {
      correct: `Correct. ${seed.definition}`,
      incorrect: `Not quite. ${seed.definition}`,
    },
  };
};

const buildChartBlock = (seed: LessonSeed, orderIndex: number): InteractiveBlock => {
  const chartLabel = seed.category === 'Foundations' ? 'Years invested' : 'Risk level';
<<<<<<< HEAD
  const seriesFormula = (seed.category === 'Foundations' ? 'compound' : 'linear') as 'compound' | 'linear';
=======
  const seriesFormula: 'compound' | 'linear' = seed.category === 'Foundations' ? 'compound' : 'linear';
>>>>>>> a398009a4477ed85581aae27611f08e45fdfc99c
  return {
    type: 'interactive_chart' as const,
    title: `${seed.title} in action`,
    sliderLabel: chartLabel,
    sliderRange: { min: 1, max: chartLabel === 'Years invested' ? 30 : 10, step: 1 },
    seriesFormula,
  };
};

const buildTradeSimBlock = (seed: LessonSeed) => ({
  type: 'trade_sim' as const,
  symbol: 'TEENV',
  startPrice: 100,
  volatility: 0.02,
  steps: 50,
  headline: `Setup focus: ${seed.title}`,
  summary: 'Price reacts to a catalyst; manage entry, stop, and target.',
  stat: 'Volatility spike • Trend shift',
  sentiment: 'neutral' as const,
  biasStrength: 0.2,
  newsImpactPrompted: false,
});

const buildStrategyChartBlock = (seed: LessonSeed) => ({
  type: 'interactive_chart' as const,
  title: `${seed.title} risk map`,
  sliderLabel: 'Risk level',
  sliderRange: { min: 1, max: 10, step: 1 },
  seriesFormula: 'linear' as const,
});

const buildStrategyInteractiveBlocks = (seed: LessonSeed, orderIndex: number): InteractiveBlock[] | null => {
  const mod = orderIndex % 5;
  if (mod === 1) return [buildMiniQuizBlock(seed, orderIndex, 'definition')];
  if (mod === 2) return [buildStrategyChartBlock(seed)];
  if (mod === 4) return [buildTradeSimBlock(seed)];
  if (mod === 0) return [buildMiniQuizBlock(seed, orderIndex, 'application')];
  return null;
};

const buildAutoInteractiveBlocks = (seed: LessonSeed, orderIndex: number): InteractiveBlock[] | null => {
  if (interactiveBlocksByOrder[orderIndex]) {
    return interactiveBlocksByOrder[orderIndex];
  }

  if (seed.category === 'Strategy') {
    return buildStrategyInteractiveBlocks(seed, orderIndex);
  }

  const mod = orderIndex % 5;
  if (mod === 1) {
    return [buildMiniQuizBlock(seed, orderIndex, 'definition')];
  }
  if (mod === 3) {
    return [buildChartBlock(seed, orderIndex)];
  }
  if (mod === 4) {
<<<<<<< HEAD
    if (orderIndex % 10 === 4) {
=======
    if ((seed.category as string) === 'Strategy' && orderIndex % 10 === 4) {
>>>>>>> a398009a4477ed85581aae27611f08e45fdfc99c
      return [buildTradeSimBlock(seed)];
    }
    return [buildMiniQuizBlock(seed, orderIndex, 'application')];
  }

  return null;
};

export const localLearningModules: LocalLearningModule[] = lessonSeeds.map((seed, index) => {
  const orderIndex = index + 1;
  const moduleId = `local-lesson-${orderIndex}`;
  const base: LocalLearningModule = {
    id: moduleId,
    title: seed.title,
    description: seed.description,
    content: buildLessonContent(seed, orderIndex),
    order_index: orderIndex,
    duration_minutes: seed.category === 'Advanced' ? 7 : 6,
    created_at: now,
    category: seed.category,
  };

  const blocks = buildAutoInteractiveBlocks(seed, orderIndex) ?? [];
  const scaffoldBlock: InteractiveBlock | null = shouldAttachScaffold(seed)
    ? {
        type: 'scaffolded_practice',
        title: `${seed.title} practice`,
        subtitle: 'I Do, We Do, You Do',
        moduleId,
        steps: buildScaffoldedSteps(seed, moduleId),
      }
    : null;

  const mergedBlocks = scaffoldBlock ? [scaffoldBlock, ...blocks] : blocks;
  if (mergedBlocks.length > 0) {
    base.interactive_blocks = mergedBlocks;
  }
  return base;
});

const placeCorrectOption = (options: string[], correctIndex: number, targetIndex: number) => {
  const next = [...options];
  const [correct] = next.splice(correctIndex, 1);
  next.splice(targetIndex, 0, correct);
  return {
    options: next,
    correctIndex: targetIndex,
  };
};

const buildQuizQuestionsForLesson = (seed: LessonSeed, orderIndex: number): LocalQuizQuestion[] => {
  const moduleId = `local-lesson-${orderIndex}`;
  const topic = seed.title.toLowerCase();
  const why = fillTemplate(categoryMeta[seed.category].why, topic);

  const definitionQuestion = {
    question: `Which statement best defines ${seed.title}?`,
    correct: seed.definition,
    distractors: [
      'A guaranteed profit strategy',
      'A tax rule unrelated to investing',
      'A brokerage fee charged per trade',
    ],
  };

  const scenarioQuestion = {
    question: `Which scenario is the best example of ${seed.title}?`,
    correct: `Applying ${topic} to guide a decision based on risk, time, and goals`,
    distractors: [
      'Buying any stock after a social media tip',
      'Ignoring costs and assuming returns are guaranteed',
      'Trading without a plan or exit strategy',
    ],
  };

  const whyQuestion = {
    question: `Why does ${seed.title} matter for investors?`,
    correct: why,
    distractors: [
      'It guarantees profits in every market cycle',
      'It eliminates the need for diversification',
      'It replaces the need to manage risk',
    ],
  };

  const questions = [definitionQuestion, scenarioQuestion, whyQuestion];

  return questions.map((item, index) => {
    const options = [item.correct, ...item.distractors];
    const targetIndex = (orderIndex + index) % options.length;
    const placed = placeCorrectOption(options, 0, targetIndex);
    return {
      id: `local-q${orderIndex}-${index + 1}`,
      module_id: moduleId,
      question: item.question,
      options: placed.options,
      correct_answer: placed.correctIndex,
      explanation: item.correct,
      order_index: index + 1,
    };
  });
};

export const localQuizQuestions: LocalQuizQuestion[] = lessonSeeds.flatMap((seed, index) =>
  buildQuizQuestionsForLesson(seed, index + 1)
);
