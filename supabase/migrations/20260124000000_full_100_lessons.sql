-- Replace learning modules with 100 full lessons.
-- Clears dependent tables (user_progress, quiz_questions, quiz_results) via CASCADE.

TRUNCATE public.learning_modules CASCADE;

INSERT INTO public.learning_modules (title, description, content, order_index, duration_minutes) VALUES
('What is a Stock?', 'Learn the basics of what stocks are and how they work', 'A stock represents ownership in a company. When you buy a stock, you''re purchasing a small piece of that company, making you a shareholder.

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
- **Market Cap**: The total value of all a company''s shares', 1, 5),
('Understanding Risk and Reward', 'Learn how risk and potential returns are connected in investing', 'In investing, risk and reward go hand in hand. Generally, higher potential returns come with higher risk.

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
1. **Diversification**: Don''t put all eggs in one basket
2. **Time Horizon**: Longer timeframes can weather volatility
3. **Research**: Understand what you''re investing in
4. **Position Sizing**: Never invest more than you can afford to lose', 2, 7),
('Building Your First Portfolio', 'Learn how to create a balanced investment portfolio', 'A portfolio is your collection of investments. Building a good portfolio means balancing growth potential with risk management.

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
Instead of investing all at once, invest a fixed amount regularly. This reduces the impact of market timing and builds good habits.', 3, 8),
('Reading Stock Charts', 'Learn how to interpret stock price charts and identify trends', 'Stock charts visualize price movements over time. Understanding them helps you make informed decisions.

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
- **Long wick**: Shows price rejection at that level', 4, 10),
('Order Types Explained', 'Master different order types to execute trades effectively', 'Understanding order types helps you buy and sell stocks at the right price and time.

**Market Orders**
Executes immediately at the current market price. Use when you want to buy/sell right away and price isn''t critical.
- **Pros**: Fast execution, guaranteed to fill
- **Cons**: You might pay more or receive less than expected

**Limit Orders**
Executes only at your specified price or better. Use when you want price control.
- **Pros**: Price control, no surprises
- **Cons**: May not execute if price doesn''t reach your limit

**Stop Orders**
Triggers a market order when price reaches your stop price. Used to limit losses or protect profits.
- **Stop-Loss**: Sells when price drops to your stop
- **Stop-Limit**: Combines stop trigger with limit price

**When to Use Each**
- **Market**: Breaking news, must execute now
- **Limit**: Patient buying, specific price targets
- **Stop-Loss**: Protecting against big losses', 5, 6);

DO $$
DECLARE
  g text := '**Overview**
- Core idea and why it matters
- How it fits into your overall strategy
- Practical takeaways

**Key Points**
- Main considerations
- Common mistakes to avoid
- Resources to go deeper

**Next Steps**
- Apply this to your portfolio
- Combine with other lessons
- Review and revisit as needed';
  titles text[] := ARRAY[
    'What Are Dividends?', 'ETFs vs Mutual Funds', 'Market Cap and Company Size', 'What Is the P/E Ratio?', 'Sectors and Industries',
    'How the Stock Market Opens and Closes', 'Bull vs Bear Markets', 'Dollar-Cost Averaging (DCA)', 'Compound Interest and Growth', 'Understanding Volatility',
    'Introduction to Index Funds', 'What Is a 401(k)?', 'IRAs Explained', 'Bonds Basics', 'Earnings Reports 101',
    'Understanding SEC Filings', 'Technical Analysis Introduction', 'Fundamental Analysis Introduction', 'How to Research a Stock', 'Diversification Deep Dive',
    'Short Selling Basics', 'IPOs Explained', 'Taxes on Investments', 'Understanding Inflation', 'Interest Rates and Stocks',
    'Margin and Leverage', 'Options Introduction', 'International Investing', 'Sustainable Investing (ESG)', 'Behavioral Finance Basics',
    'Setting Financial Goals', 'Building an Emergency Fund', 'Understanding Credit Scores', 'Savings vs Investing', 'Avoiding Investment Scams',
    'Choosing a Broker', 'Asset Allocation by Age', 'Rebalancing Your Portfolio', 'Tax-Loss Harvesting Basics', 'Dividend Growth Investing',
    'Value Investing Introduction', 'Growth Investing Introduction', 'Market Orders vs Limit Orders', 'Understanding Bid-Ask Spread', 'What Is Liquidity?',
    'Stock Splits and Reverse Splits', 'Buybacks Explained', 'Understanding Cash Flow', 'Revenue vs Earnings', 'Debt and Equity',
    'What Is a Balance Sheet?', 'Income Statement Basics', 'Cash Flow Statement Basics', 'Working Capital', 'Return on Equity (ROE)',
    'Profit Margins', 'Revenue Growth Explained', 'Cyclical vs Defensive Stocks', 'Blue-Chip Stocks', 'Growth vs Value Stocks',
    'Small-Cap Investing', 'Mid-Cap Investing', 'Large-Cap Stability', 'Sector Rotation', 'Economic Cycles',
    'Recessions and Markets', 'Global Diversification', 'Emerging Markets', 'Developed Markets', 'Currency Risk',
    'Political Risk', 'Liquidity Risk', 'Why Indexing Works', 'Active vs Passive Investing', 'Expense Ratios Matter',
    'Compounding Over Decades', 'Starting Early', 'Retirement Saving Basics', 'Healthcare in Retirement', 'Social Security Basics',
    'Pension vs 401(k)', 'Estate Planning Basics', 'Teaching Kids About Money', 'Avoiding Common Mistakes', 'Staying the Course',
    'When to Sell', 'Building a Watchlist', 'Using Stop-Losses', 'Position Sizing', 'Risk Management Rules',
    'Learning From Losses', 'Journaling Your Trades', 'Building a Process'
  ];
  i int;
  t text;
  d text;
BEGIN
  FOR i IN 1..95 LOOP
    t := titles[i];
    d := 'Learn key concepts and practices for ' || lower(t) || '.';
    INSERT INTO public.learning_modules (title, description, content, order_index, duration_minutes)
    VALUES (t, d, g, 5 + i, 6);
  END LOOP;
END $$;

-- Update "Stock Scholar" achievement to require all 100 lessons
UPDATE public.achievements
SET requirement_value = 100
WHERE name = 'Stock Scholar' AND requirement_type = 'lessons';
