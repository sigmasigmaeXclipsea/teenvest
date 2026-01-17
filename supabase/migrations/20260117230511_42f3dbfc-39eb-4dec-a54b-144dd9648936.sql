-- Insert learning modules with real content
INSERT INTO public.learning_modules (title, description, content, order_index, duration_minutes) VALUES
(
  'What is a Stock?',
  'Learn the basics of what stocks are and how they work',
  'A stock represents ownership in a company. When you buy a stock, you''re purchasing a small piece of that company, making you a shareholder.

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
- **Market Cap**: The total value of all a company''s shares',
  1,
  5
),
(
  'Understanding Risk and Reward',
  'Learn how risk and potential returns are connected in investing',
  'In investing, risk and reward go hand in hand. Generally, higher potential returns come with higher risk.

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
4. **Position Sizing**: Never invest more than you can afford to lose',
  2,
  7
),
(
  'Building Your First Portfolio',
  'Learn how to create a balanced investment portfolio',
  'A portfolio is your collection of investments. Building a good portfolio means balancing growth potential with risk management.

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
Instead of investing all at once, invest a fixed amount regularly. This reduces the impact of market timing and builds good habits.',
  3,
  8
),
(
  'Reading Stock Charts',
  'Learn how to interpret stock price charts and identify trends',
  'Stock charts visualize price movements over time. Understanding them helps you make informed decisions.

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
- **Long wick**: Shows price rejection at that level',
  4,
  10
),
(
  'Order Types Explained',
  'Master different order types to execute trades effectively',
  'Understanding order types helps you buy and sell stocks at the right price and time.

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
- **Stop-Loss**: Protecting against big losses',
  5,
  6
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can view quiz questions
CREATE POLICY "Anyone can view quiz questions"
ON public.quiz_questions
FOR SELECT
USING (true);

-- Create user quiz results table
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own quiz results
CREATE POLICY "Users can view their own quiz results"
ON public.quiz_results
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own quiz results
CREATE POLICY "Users can insert their own quiz results"
ON public.quiz_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own quiz results
CREATE POLICY "Users can update their own quiz results"
ON public.quiz_results
FOR UPDATE
USING (auth.uid() = user_id);