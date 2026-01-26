-- Add interactive lesson blocks to learning modules

ALTER TABLE public.learning_modules
ADD COLUMN IF NOT EXISTS interactive_blocks JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Seed a few example interactive blocks for early lessons
UPDATE public.learning_modules
SET interactive_blocks = jsonb_build_array(
  jsonb_build_object(
    'type', 'mini_quiz',
    'prompt', 'What does diversification help reduce?',
    'options', jsonb_build_array('Taxes', 'Risk', 'Time', 'Dividends'),
    'correctIndex', 1,
    'feedback', jsonb_build_object(
      'correct', 'Right. Diversification reduces risk by spreading exposure.',
      'incorrect', 'Not quite. Diversification reduces risk by spreading exposure.'
    )
  ),
  jsonb_build_object(
    'type', 'interactive_chart',
    'title', 'Compounding over time',
    'sliderLabel', 'Years invested',
    'sliderRange', jsonb_build_object('min', 1, 'max', 30, 'step', 1),
    'seriesFormula', 'compound'
  )
)
WHERE order_index = 1;

UPDATE public.learning_modules
SET interactive_blocks = jsonb_build_array(
  jsonb_build_object(
    'type', 'trade_sim',
    'symbol', 'AAPL',
    'startPrice', 150,
    'volatility', 0.02,
    'steps', 12
  )
)
WHERE order_index = 2;

UPDATE public.learning_modules
SET interactive_blocks = jsonb_build_array(
  jsonb_build_object(
    'type', 'mini_quiz',
    'prompt', 'Which order type executes immediately at the best available price?',
    'options', jsonb_build_array('Limit', 'Market', 'Stop', 'Trailing Stop'),
    'correctIndex', 1,
    'feedback', jsonb_build_object(
      'correct', 'Yes. Market orders execute immediately at the best price.',
      'incorrect', 'The correct answer is Market.'
    )
  )
)
WHERE order_index = 3;
