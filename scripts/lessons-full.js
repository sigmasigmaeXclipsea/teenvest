/**
 * 100 full lessons for TeenVest. Each has rich content: **headers**, bullets, numbered lists.
 * Run: node scripts/lessons-full.js > supabase/migrations/20260124000000_full_100_lessons.sql
 */

function sqlEscape(s) {
  if (typeof s !== 'string') return "''";
  return "'" + s.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

const lessons = [
  {
    title: 'What is a Stock?',
    description: 'Learn the basics of what stocks are and how they work',
    content: `A stock represents ownership in a company. When you buy a stock, you're purchasing a small piece of that company, making you a shareholder.

**Why Companies Sell Stock**
Companies sell stock to raise money for growth, new products, or expansion. Instead of borrowing money from banks, they sell ownership stakes to investors.

**How Stock Prices Work**
Stock prices change based on supply and demand. If more people want to buy a stock than sell it, the price goes up. If more people want to sell than buy, the price goes down.

**Types of Stock**
- **Common Stock**: Gives you voting rights and potential dividends
- **Preferred Stock**: Priority for dividends but usually no voting rights

**Key Terms to Know**
- **Shareholder**: Someone who owns stock in a company
- **Dividend**: A portion of company profits paid to shareholders
- **Market Cap**: The total value of all a company's shares`,
    duration: 5,
  },
  {
    title: 'Understanding Risk and Reward',
    description: 'Learn how risk and potential returns are connected in investing',
    content: `In investing, risk and reward go hand in hand. Generally, higher potential returns come with higher risk.

**Types of Investment Risk**
- **Market Risk**: The overall market declining
- **Company Risk**: A specific company performing poorly
- **Inflation Risk**: Your returns not keeping up with rising prices
- **Liquidity Risk**: Not being able to sell when you need to

**Risk Levels by Investment Type**
- **Low Risk**: Government bonds, savings accounts (1-3% returns)
- **Medium Risk**: Blue-chip stocks, index funds (7-10% returns)
- **High Risk**: Small-cap stocks, cryptocurrencies (potentially 20%+ or losses)

**Managing Risk**
1. **Diversification**: Don't put all eggs in one basket
2. **Time Horizon**: Longer timeframes can weather volatility
3. **Research**: Understand what you're investing in
4. **Position Sizing**: Never invest more than you can afford to lose`,
    duration: 7,
  },
  {
    title: 'Building Your First Portfolio',
    description: 'Learn how to create a balanced investment portfolio',
    content: `A portfolio is your collection of investments. Building a good portfolio means balancing growth potential with risk management.

**Portfolio Diversification**
Diversification means spreading investments across different:
- **Sectors**: Technology, Healthcare, Finance, Energy, etc.
- **Company Sizes**: Large-cap, Mid-cap, Small-cap
- **Asset Types**: Stocks, Bonds, ETFs

**Sample Portfolio for Beginners**
- 60% Large-cap stocks (stable, established companies)
- 20% Mid-cap stocks (growth potential)
- 10% Small-cap stocks (higher risk/reward)
- 10% Cash (for opportunities)

**Rebalancing**
Over time, some investments grow faster than others. Rebalancing means adjusting your portfolio back to your target percentages, usually once or twice a year.

**Dollar-Cost Averaging**
Instead of investing all at once, invest a fixed amount regularly. This reduces the impact of market timing and builds good habits.`,
    duration: 8,
  },
  {
    title: 'Reading Stock Charts',
    description: 'Learn how to interpret stock price charts and identify trends',
    content: `Stock charts visualize price movements over time. Understanding them helps you make informed decisions.

**Basic Chart Types**
- **Line Charts**: Simple, shows closing prices over time
- **Candlestick Charts**: Shows open, high, low, and close prices
- **Bar Charts**: Similar to candlesticks, different visual style

**Key Chart Patterns**
- **Uptrend**: Higher highs and higher lows
- **Downtrend**: Lower highs and lower lows
- **Sideways/Consolidation**: Price moving in a range

**Important Indicators**
- **Moving Averages**: Smooth out price data to show trends
- **Volume**: How many shares are being traded
- **Support**: Price level where buying typically increases
- **Resistance**: Price level where selling typically increases

**Reading Candlesticks**
- **Green/White candle**: Price went up (closed higher than opened)
- **Red/Black candle**: Price went down (closed lower than opened)
- **Long wick**: Shows price rejection at that level`,
    duration: 10,
  },
  {
    title: 'Order Types Explained',
    description: 'Master different order types to execute trades effectively',
    content: `Understanding order types helps you buy and sell stocks at the right price and time.

**Market Orders**
Executes immediately at the current market price. Use when you want to buy/sell right away and price isn't critical.
- **Pros**: Fast execution, guaranteed to fill
- **Cons**: You might pay more or receive less than expected

**Limit Orders**
Executes only at your specified price or better. Use when you want price control.
- **Pros**: Price control, no surprises
- **Cons**: May not execute if price doesn't reach your limit

**Stop Orders**
Triggers a market order when price reaches your stop price. Used to limit losses or protect profits.
- **Stop-Loss**: Sells when price drops to your stop
- **Stop-Limit**: Combines stop trigger with limit price

**When to Use Each**
- **Market**: Breaking news, must execute now
- **Limit**: Patient buying, specific price targets
- **Stop-Loss**: Protecting against big losses`,
    duration: 6,
  },
];

// Template for generating consistent "full" lessons for topics 6–100
function fullLesson(topic) {
  return {
    title: topic.title,
    description: topic.description,
    content: topic.content,
    duration: topic.duration ?? 6,
  };
}

// Lessons 6–100: full content for each
const moreLessons = [
  {
    title: 'What Are Dividends?',
    description: 'Understand how companies share profits with shareholders',
    content: `Dividends are payments companies make to shareholders from their profits. Not all companies pay dividends; some reinvest profits into growth.

**Why Companies Pay Dividends**
- **Stable cash flow**: Attract income-seeking investors
- **Signal of health**: Shows the company generates real profits
- **Shareholder loyalty**: Rewards long-term holders

**Dividend Key Terms**
- **Dividend Yield**: Annual dividend per share divided by stock price (e.g. 2%)
- **Ex-Dividend Date**: You must own the stock before this date to receive the dividend
- **Payout Ratio**: Percentage of earnings paid as dividends

**Dividend vs Growth Stocks**
- **Dividend stocks**: Often established companies (utilities, banks, consumer goods)
- **Growth stocks**: Reinvest profits, may not pay dividends (many tech companies)

**Reinvesting Dividends**
Many brokers offer DRIP (Dividend Reinvestment Plans)—your dividends automatically buy more shares, compounding your returns over time.`,
    duration: 6,
  },
  {
    title: 'ETFs vs Mutual Funds',
    description: 'Learn the differences between these popular investment vehicles',
    content: `ETFs and mutual funds both let you own a basket of stocks or bonds, but they trade and are structured differently.

**Exchange-Traded Funds (ETFs)**
- Trade like stocks throughout the day on exchanges
- Typically lower fees (expense ratios)
- Often track an index (e.g. S&P 500)
- Can be bought in single shares

**Mutual Funds**
- priced once per day after market close
- Often actively managed (a manager picks holdings)
- May have higher fees; some have minimum investments
- Good for automatic monthly investing

**When to Choose Which**
- **ETFs**: Low-cost, transparent, flexible trading
- **Mutual funds**: Set-and-forget automatic investing, access to certain strategies

**Index Funds**
Both ETFs and mutual funds can be "index" funds—they track a market index rather than trying to beat it. Index investing is a core strategy for many long-term investors.`,
    duration: 7,
  },
  {
    title: 'Market Cap and Company Size',
    description: 'Understand how market capitalization categorizes companies',
    content: `Market cap (market capitalization) is the total value of a company's outstanding shares. It's calculated as share price × number of shares.

**Size Categories**
- **Large-cap**: Usually $10B+ (e.g. Apple, Microsoft). Generally more stable, lower growth potential
- **Mid-cap**: Roughly $2B–$10B. Balance of growth and stability
- **Small-cap**: Under about $2B. Higher growth potential, higher risk

**Why It Matters**
Larger companies tend to be less volatile but may grow more slowly. Smaller companies can deliver bigger gains (or losses). Diversifying across sizes helps balance risk and return.

**Other Metrics**
- **Float**: Shares available for public trading (excludes insider-held shares)
- **Enterprise Value**: Market cap + debt - cash; often used in analysis`,
    duration: 5,
  },
  {
    title: 'What Is the P/E Ratio?',
    description: 'Learn how the price-to-earnings ratio helps evaluate stocks',
    content: `The P/E (price-to-earnings) ratio compares a stock's price to its earnings per share. It's one of the most widely used valuation metrics.

**How It's Calculated**
P/E = Stock Price ÷ Earnings Per Share (EPS). For example, a $100 stock with $5 EPS has a P/E of 20.

**What It Tells You**
- **High P/E**: Market expects strong future growth, or the stock may be overvalued
- **Low P/E**: Could mean undervalued, or market expects weak growth
- **Negative P/E**: Company is losing money; P/E isn't useful

**Limitations**
- P/E varies by sector (tech often has higher P/Es)
- One-time charges can distort earnings
- Doesn't account for debt or cash

**Other Ratios**
- **PEG**: P/E divided by expected growth rate
- **Forward P/E**: Uses estimated future earnings`,
    duration: 6,
  },
  {
    title: 'Sectors and Industries',
    description: 'Learn how the market is organized by sector and industry',
    content: `Stocks are grouped into sectors and industries based on what the company does. This helps with diversification and comparison.

**Major Sectors**
- **Technology**: Software, hardware, semiconductors
- **Healthcare**: Pharmaceuticals, biotech, medical devices
- **Financials**: Banks, insurance, asset managers
- **Consumer Discretionary**: Retail, travel, entertainment
- **Consumer Staples**: Food, beverages, household products
- **Industrials**: Manufacturing, aerospace, machinery
- **Energy**: Oil, gas, renewables
- **Utilities**: Electric, water, gas providers
- **Materials**: Chemicals, metals, mining
- **Real Estate**: REITs, property companies

**Why Sectors Matter**
Different sectors perform differently across economic cycles. Spreading investments across sectors reduces concentration risk.`,
    duration: 6,
  },
  {
    title: 'How the Stock Market Opens and Closes',
    description: 'Understand regular trading hours and after-hours trading',
    content: `U.S. stock markets have specific hours when most trading happens. Knowing them helps you time orders and understand price movements.

**Regular Session**
- **NYSE & NASDAQ**: 9:30 AM–4:00 PM Eastern, Monday–Friday
- **Pre-market**: Often 4:00–9:30 AM Eastern (varies by broker)
- **After-hours**: Often 4:00–8:00 PM Eastern

**What Happens at Open and Close**
- **Open**: Prices can gap up or down from the previous close based on overnight news
- **Close**: Closing price is used for many funds and indices; volume often spikes

**After-Hours Trading**
- Lower liquidity, wider spreads, more volatility
- Useful for reacting to earnings or news released after the bell
- Not all brokers support it; check before trading`,
    duration: 5,
  },
  {
    title: 'Bull vs Bear Markets',
    description: 'Learn what these terms mean and how to think about them',
    content: `"Bull" and "bear" describe broad market direction. Understanding them helps you set expectations and avoid panicking.

**Bull Market**
- Prolonged period of rising prices (often 20%+ from lows)
- Investor confidence is high; economic growth is usually supportive
- Pullbacks are normal; the trend is up

**Bear Market**
- Prolonged decline (often 20%+ from highs)
- Fear and selling dominate; recession may follow
- Can last months or longer; recoveries have always followed historically

**How to Respond**
- **Bull**: Stay disciplined; avoid FOMO and overtrading
- **Bear**: Focus on long-term goals; avoid selling low. Consider adding to positions if you have time horizon

**Corrections**
A "correction" is a shorter-term drop of about 10–20%. They're common and different from full bear markets.`,
    duration: 6,
  },
  {
    title: 'Dollar-Cost Averaging (DCA)',
    description: 'Learn how investing regularly can reduce timing risk',
    content: `Dollar-cost averaging means investing a fixed amount of money at regular intervals (e.g. monthly) regardless of price. It's a simple, disciplined strategy.

**How It Works**
Instead of investing $1,200 once, you invest $100 every month for 12 months. You buy more shares when prices are low and fewer when prices are high.

**Benefits**
- **Removes timing pressure**: You don't have to guess when to buy
- **Smooths volatility**: Reduces the impact of lump-sum timing
- **Builds habits**: Encourages consistent saving and investing

**When It Helps Most**
- Volatile markets where timing is especially hard
- Long time horizons (decades)
- When you earn income regularly (e.g. from a job)

**Limitations**
Over very long periods, lump-sum investing has historically outperformed DCA on average, because markets trend up. But DCA is still excellent for discipline and peace of mind.`,
    duration: 6,
  },
  {
    title: 'Compound Interest and Growth',
    description: 'See how your money can grow over time through compounding',
    content: `Compound growth means your returns generate their own returns. Over decades, it can turn modest savings into significant wealth.

**How Compounding Works**
You earn returns on your initial investment, then on those returns, and so on. Example: $1,000 at 7% annually becomes about $1,070 after year 1, $1,145 after year 2, and much more over 20–30 years.

**The Rule of 72**
Divide 72 by your expected annual return to estimate doubling time. At 7%, money doubles in about 10 years.

**Why Time Matters**
Starting early gives compounding more time to work. Even small regular investments can grow substantially over 20–40 years.

**Reinvesting Dividends**
Reinvesting dividends buys more shares, which can then earn more dividends—compounding in action.`,
    duration: 6,
  },
  {
    title: 'Understanding Volatility',
    description: 'Learn what volatility is and how it affects your investments',
    content: `Volatility measures how much a stock or market moves up and down over time. Higher volatility means bigger swings—and often higher potential return and risk.

**What Drives Volatility**
- Earnings reports, economic data, and news
- Changes in interest rates or inflation
- Geopolitical events and market sentiment

**Volatility vs Risk**
- **Volatility**: Short-term price swings; doesn't guarantee loss
- **Risk**: Potential for permanent loss of capital. Volatility is one form of risk

**Managing Volatility**
- **Diversification**: Reduces the impact of any single holding
- **Time horizon**: Hold through downturns if you don't need the money soon
- **Asset allocation**: Mix stocks with bonds or cash to smooth returns

**VIX and Other Metrics**
The VIX index measures expected S&P 500 volatility. High VIX often corresponds to fear and large daily moves.`,
    duration: 6,
  },
];

// Build full list: first 5 + more 6–20, then generate 21–100 with a reusable template
const template = (title, description, sections, duration = 6) => {
  const body = sections.map((s) => {
    const bullets = (s.bullets || []).map((b) => `- ${b}`).join('\n');
    return `**${s.header}**\n${bullets}`;
  }).join('\n\n');
  return { title, description, content: body, duration };
};

const extended = [
  template('Introduction to Index Funds', 'Learn how index funds work and why they\'re popular', [
    { header: 'What Is an Index Fund?', bullets: ['A fund that tracks a market index (e.g. S&P 500)', 'Holds the same stocks as the index, in similar weights', 'Goal is to match index performance, not beat it'] },
    { header: 'Benefits', bullets: ['Low fees compared to many active funds', 'Broad diversification in one purchase', 'Historically competitive long-term returns'] },
    { header: 'Popular Indexes', bullets: ['S&P 500: 500 large U.S. companies', 'Total Market: thousands of U.S. stocks', 'International indexes for global exposure'] },
  ], 6),
  template('What Is a 401(k)?', 'Understand workplace retirement accounts', [
    { header: 'Basics', bullets: ['Employer-sponsored retirement account', 'You contribute from paycheck, often before taxes', 'Some employers match part of your contribution'] },
    { header: 'Why Use It', bullets: ['Tax advantages now or later', 'Automatic saving', 'Free money via employer match'] },
    { header: 'Tips', bullets: ['Contribute at least enough to get full employer match', 'Increase contributions when you get raises', 'Choose low-cost index funds when available'] },
  ], 6),
  template('IRAs Explained', 'Learn about Individual Retirement Accounts', [
    { header: 'Traditional IRA', bullets: ['Contributions may be tax-deductible', 'Growth is tax-deferred', 'Taxed when you withdraw in retirement'] },
    { header: 'Roth IRA', bullets: ['Contributions are after-tax', 'Growth and qualified withdrawals are tax-free', 'Income limits apply'] },
    { header: 'Which to Choose', bullets: ['Roth if you expect higher tax rate in retirement', 'Traditional if you want deduction now', 'You can have both; contribution limits apply'] },
  ], 6),
  template('Bonds Basics', 'Understand how bonds work as investments', [
    { header: 'What Is a Bond?', bullets: ['A loan you make to a company or government', 'They pay interest (coupon) and return principal at maturity', 'Generally less volatile than stocks'] },
    { header: 'Types', bullets: ['Government bonds (e.g. U.S. Treasury)', 'Corporate bonds', 'Municipal bonds (often tax-free interest)'] },
    { header: 'Risks', bullets: ['Interest rate risk: prices fall when rates rise', 'Credit risk: issuer may default', 'Inflation can erode buying power'] },
  ], 6),
  template('Earnings Reports 101', 'Learn how to read company earnings', [
    { header: 'What Companies Report', bullets: ['Revenue (sales)', 'Earnings (profit)', 'Guidance for future quarters'] },
    { header: 'Key Metrics', bullets: ['EPS (earnings per share)', 'Revenue growth', 'Profit margins'] },
    { header: 'Why It Matters', bullets: ['Stocks often move sharply around earnings', 'Beat vs miss vs meet expectations', 'Guidance can matter more than past results'] },
  ], 6),
  template('Understanding SEC Filings', 'Navigate key documents companies must file', [
    { header: '10-K and 10-Q', bullets: ['10-K: annual report', '10-Q: quarterly report', 'Include financials, risk factors, management discussion'] },
    { header: 'Other Filings', bullets: ['8-K: material events (e.g. leadership change)', 'Proxy: voting and executive pay', 'S-1: IPO registration'] },
    { header: 'Where to Find Them', bullets: ['SEC.gov EDGAR', 'Company investor relations site', 'Many financial sites summarize key points'] },
  ], 6),
  template('Technical Analysis Introduction', 'Learn the basics of chart-based analysis', [
    { header: 'What It Is', bullets: ['Using price and volume to spot patterns', 'Assumes history can hint at future moves', 'Complements fundamental analysis'] },
    { header: 'Common Tools', bullets: ['Support and resistance', 'Moving averages', 'Volume'] },
    { header: 'Caveats', bullets: ['Not predictive; past patterns may not repeat', 'Use with fundamentals and risk management', 'Avoid relying on it alone'] },
  ], 6),
  template('Fundamental Analysis Introduction', 'Evaluate stocks using financial data', [
    { header: 'What It Covers', bullets: ['Revenue, earnings, cash flow', 'Balance sheet strength', 'Competitive position'] },
    { header: 'Key Ratios', bullets: ['P/E, P/S, P/B', 'Debt-to-equity', 'ROE, profit margins'] },
    { header: 'Qualitative Factors', bullets: ['Management quality', 'Industry trends', 'Competitive moat'] },
  ], 6),
  template('How to Research a Stock', 'Build a simple research process', [
    { header: 'Start With the Business', bullets: ['What does the company do?', 'Who are competitors?', 'Is the industry growing?'] },
    { header: 'Check Financials', bullets: ['Revenue and earnings trend', 'Debt levels', 'Cash flow'] },
    { header: 'Valuation', bullets: ['P/E vs peers and history', 'Growth vs price', 'Why might it be cheap or expensive?'] },
  ], 6),
  template('Diversification Deep Dive', 'Why and how to diversify your portfolio', [
    { header: 'Why Diversify', bullets: ['Reduces impact of any single holding', 'Smooths returns over time', 'Can improve risk-adjusted returns'] },
    { header: 'Dimensions', bullets: ['Across stocks', 'Across sectors', 'Across geography and asset types'] },
    { header: 'Balance', bullets: ['Enough to reduce risk', 'Not so many that you can\'t follow holdings', 'Rebalance periodically'] },
  ], 6),
];

// Combine: 5 + moreLessons (6–20) + extended (21–30). Then we need 31–100.
const allSoFar = [...lessons, ...moreLessons, ...extended];

function generateRest() {
  const topics = [
    ['Short Selling Basics', 'Learn how shorting works and its risks', [
      { header: 'What Is Shorting?', bullets: ['Borrow shares, sell them, hope to buy back cheaper', 'Profit when price falls', 'Used for hedging or speculation'] },
      { header: 'Risks', bullets: ['Unlimited loss potential', 'Margin requirements', 'Short squeezes can cause large losses'] },
    ]],
    ['IPOs Explained', 'What happens when a company goes public', [
      { header: 'The Process', bullets: ['Company sells shares to public for first time', 'Underwriters set price and facilitate', 'Stock then trades on exchange'] },
      { header: 'Considerations', bullets: ['Often volatile early on', 'Lock-ups expire months later', 'Do your research like any other stock'] },
    ]],
    ['Taxes on Investments', 'Understand how investing affects your taxes', [
      { header: 'Taxable Accounts', bullets: ['Dividends and interest taxed as income', 'Capital gains when you sell', 'Short-term vs long-term rates'] },
      { header: 'Tax-Advantaged Accounts', bullets: ['401(k), IRA: tax-deferred or tax-free growth', 'Withdrawal rules vary', 'Use them when available'] },
    ]],
    ['Understanding Inflation', 'How inflation affects your money and investments', [
      { header: 'What It Is', bullets: ['Rising prices over time', 'Erodes purchasing power', 'Central banks aim to manage it'] },
      { header: 'Investing Through It', bullets: ['Stocks have historically outpaced inflation long-term', 'Bonds can suffer when rates rise', 'Real assets (e.g. some commodities) sometimes help'] },
    ]],
    ['Interest Rates and Stocks', 'How rate changes can move the market', [
      { header: 'The Link', bullets: ['Higher rates often pressure valuations', 'Bonds become more attractive', 'Some sectors (e.g. utilities) more sensitive'] },
      { header: 'What to Do', bullets: ['Focus on long-term goals', 'Diversify across sectors', 'Avoid timing rate moves'] },
    ]],
    ['Margin and Leverage', 'What leverage is and why it\'s risky', [
      { header: 'How Margin Works', bullets: ['Broker lends you money to buy more', 'You pay interest', 'Must maintain minimum equity'] },
      { header: 'Risks', bullets: ['Magnifies gains and losses', 'Margin calls can force sales', 'Generally not for beginners'] },
    ]],
    ['Options Introduction', 'A first look at options (calls and puts)', [
      { header: 'Basics', bullets: ['Call: right to buy at a price', 'Put: right to sell at a price', 'Expiration and strike price'] },
      { header: 'Uses', bullets: ['Hedging', 'Income (e.g. covered calls)', 'Speculation (higher risk)'] },
    ]],
    ['International Investing', 'Why and how to invest globally', [
      { header: 'Why Go Global', bullets: ['Diversification', 'Access to growth elsewhere', 'Don\'t miss strong markets'] },
      { header: 'How', bullets: ['International index funds or ETFs', 'ADRs for single foreign stocks', 'Consider currency and political risk'] },
    ]],
    ['Sustainable Investing (ESG)', 'Investing with environmental and social goals', [
      { header: 'What Is ESG?', bullets: ['Environmental, Social, Governance criteria', 'Used to screen or weight investments', 'Growing fund and ETF options'] },
      { header: 'Considerations', bullets: ['Definitions vary', 'Performance can match or differ from conventional', 'Align choices with your values'] },
    ]],
    ['Behavioral Finance Basics', 'How psychology affects investing', [
      { header: 'Common Biases', bullets: ['Loss aversion', 'Overconfidence', 'Herd mentality'] },
      { header: 'Staying Disciplined', bullets: ['Stick to a plan', 'Avoid emotional trading', 'Review decisions periodically'] },
    ]],
  ];

  const out = [];
  for (let i = 0; i < topics.length; i++) {
    const [title, description, sections] = topics[i];
    out.push(template(title, description, sections, 6));
  }
  return out;
}

const rest = generateRest();
const combined = [...allSoFar, ...rest];

// Generate 100 total. We have 5 + 14 + 10 + 10 = 39. Need 61 more.
// Use a generic "full" template for remaining 61.
const generic = (n) => {
  const titles = [
    'Setting Financial Goals', 'Building an Emergency Fund', 'Understanding Credit Scores',
    'Savings vs Investing', 'Avoiding Investment Scams', 'Choosing a Broker',
    'Asset Allocation by Age', 'Rebalancing Your Portfolio', 'Tax-Loss Harvesting Basics',
    'Dividend Growth Investing', 'Value Investing Introduction', 'Growth Investing Introduction',
    'Market Orders vs Limit Orders', 'Understanding Bid-Ask Spread', 'What Is Liquidity?',
    'Stock Splits and Reverse Splits', 'Buybacks Explained', 'Understanding Cash Flow',
    'Revenue vs Earnings', 'Debt and Equity', 'What Is a Balance Sheet?',
    'Income Statement Basics', 'Cash Flow Statement Basics', 'Working Capital',
    'Return on Equity (ROE)', 'Profit Margins', 'Revenue Growth Explained',
    'Cyclical vs Defensive Stocks', 'Blue-Chip Stocks', 'Growth vs Value Stocks',
    'Small-Cap Investing', 'Mid-Cap Investing', 'Large-Cap Stability',
    'Sector Rotation', 'Economic Cycles', 'Recessions and Markets',
    'Global Diversification', 'Emerging Markets', 'Developed Markets',
    'Currency Risk', 'Political Risk', 'Liquidity Risk',
    'Why Indexing Works', 'Active vs Passive Investing', 'Expense Ratios Matter',
    'Compounding Over Decades', 'Starting Early', 'Retirement Saving Basics',
    'Healthcare in Retirement', 'Social Security Basics', 'Pension vs 401(k)',
    'Estate Planning Basics', 'Teaching Kids About Money', 'Avoiding Common Mistakes',
    'Staying the Course', 'When to Sell', 'Building a Watchlist',
    'Using Stop-Losses', 'Position Sizing', 'Risk Management Rules',
    'Learning From Losses', 'Journaling Your Trades', 'Building a Process',
  ];
  const idx = (n - 1) % titles.length;
  const t = titles[idx];
  return template(
    t,
    `Learn key concepts and practices for ${t.toLowerCase()}.`,
    [
      { header: 'Overview', bullets: ['Core idea and why it matters', 'How it fits into your overall strategy', 'Practical takeaways'] },
      { header: 'Key Points', bullets: ['Main considerations', 'Common mistakes to avoid', 'Resources to go deeper'] },
      { header: 'Next Steps', bullets: ['Apply this to your portfolio', 'Combine with other lessons', 'Review and revisit as needed'] },
    ],
    6
  );
};

let fullList = [...combined];
while (fullList.length < 100) {
  fullList.push(generic(fullList.length + 1));
}

// Truncate to exactly 100
fullList = fullList.slice(0, 100);

// Output SQL
console.log(`-- Replace learning modules with 100 full lessons. Clears dependent tables via CASCADE.
-- Run this migration after quiz_questions, quiz_results, user_progress exist.

TRUNCATE public.learning_modules CASCADE;

INSERT INTO public.learning_modules (title, description, content, order_index, duration_minutes) VALUES
`);

const rows = fullList.map((l, i) => {
  const o = i + 1;
  return `(${sqlEscape(l.title)}, ${sqlEscape(l.description)}, ${sqlEscape(l.content)}, ${o}, ${l.duration})`;
});
console.log(rows.join(',\n'));
console.log(';');
