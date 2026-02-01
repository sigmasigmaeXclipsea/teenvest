-- Security Fixes Migration
-- Fixes multiple security issues identified by security scanner

-- ===========================================
-- FIX 1: profiles table - Starting balance exposure
-- Remove "Anyone can view public profiles" and create a safer policy
-- ===========================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Anyone can view public profiles" ON profiles;

-- Create a view that excludes starting_balance for public access
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT 
    user_id,
    display_name,
    avatar_url,
    username,
    profile_public,
    created_at
    -- Excludes: starting_balance, updated_at, id
  FROM public.profiles
  WHERE profile_public = true;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

-- ===========================================
-- FIX 2: quiz_questions - Create secure answer validation function
-- Hide correct_answer from direct queries
-- ===========================================

-- Create a view for quiz questions that excludes correct_answer
CREATE OR REPLACE VIEW public.quiz_questions_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    module_id,
    question,
    options,
    explanation,
    order_index,
    created_at
    -- Excludes: correct_answer
  FROM public.quiz_questions;

-- Grant access to the view
GRANT SELECT ON public.quiz_questions_public TO authenticated;
GRANT SELECT ON public.quiz_questions_public TO anon;

-- Create secure function to validate quiz answers
CREATE OR REPLACE FUNCTION public.validate_quiz_answer(
  p_question_id UUID,
  p_selected_answer INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_answer INTEGER;
  v_explanation TEXT;
  v_is_correct BOOLEAN;
BEGIN
  -- Get the correct answer (only accessible server-side)
  SELECT correct_answer, explanation 
  INTO v_correct_answer, v_explanation
  FROM quiz_questions
  WHERE id = p_question_id;
  
  IF v_correct_answer IS NULL THEN
    RETURN json_build_object(
      'error', 'Question not found'
    );
  END IF;
  
  v_is_correct := (p_selected_answer = v_correct_answer);
  
  RETURN json_build_object(
    'correct', v_is_correct,
    'correct_answer', v_correct_answer,
    'explanation', v_explanation
  );
END;
$$;

-- Drop the old permissive policy on quiz_questions
DROP POLICY IF EXISTS "Anyone can view quiz questions" ON quiz_questions;

-- Create restrictive policy - users can only access via the view or function
CREATE POLICY "Service role can access quiz questions"
ON quiz_questions
FOR SELECT
USING (auth.role() = 'service_role');

-- ===========================================
-- FIX 3: Leaderboard - Filter private profiles
-- Update get_leaderboard to respect profile_public setting
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, display_name text, total_value numeric, gain_percent numeric, rank bigint, profile_public boolean, is_current_user boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  RETURN QUERY
  WITH last_prices AS (
    SELECT DISTINCT ON (t.symbol)
      t.symbol,
      t.price
    FROM trades t
    ORDER BY t.symbol, t.created_at DESC
  ),
  user_holdings_value AS (
    SELECT 
      h.user_id,
      COALESCE(SUM(h.shares * lp.price), 0) as holdings_value
    FROM holdings h
    LEFT JOIN last_prices lp ON h.symbol = lp.symbol
    GROUP BY h.user_id
  ),
  ranked_users AS (
    SELECT 
      p.user_id,
      COALESCE(p.display_name, 'Anonymous') as display_name,
      (COALESCE(port.cash_balance, 10000) + COALESCE(uhv.holdings_value, 0)) as total_value,
      p.starting_balance,
      p.profile_public,
      ROW_NUMBER() OVER (
        ORDER BY 
          ((COALESCE(port.cash_balance, 10000) + COALESCE(uhv.holdings_value, 0) - p.starting_balance) / NULLIF(p.starting_balance, 0)) DESC,
          (COALESCE(port.cash_balance, 10000) + COALESCE(uhv.holdings_value, 0)) DESC
      ) as rank
    FROM profiles p
    LEFT JOIN portfolios port ON p.user_id = port.user_id
    LEFT JOIN user_holdings_value uhv ON p.user_id = uhv.user_id
    -- Only include public profiles in ranking (or the current user)
    WHERE p.profile_public = true OR p.user_id = current_user_id
  )
  SELECT 
    -- Only expose user_id for the current user, use NULL for others
    CASE WHEN ru.user_id = current_user_id THEN ru.user_id ELSE NULL END as user_id,
    -- Anonymize private profiles (shouldn't happen now, but safety check)
    CASE 
      WHEN ru.profile_public = false AND ru.user_id != current_user_id 
      THEN 'Private User'
      ELSE ru.display_name 
    END as display_name,
    ru.total_value,
    ROUND(((ru.total_value - ru.starting_balance) / NULLIF(ru.starting_balance, 0)) * 100, 2) as gain_percent,
    ru.rank,
    ru.profile_public,
    (ru.user_id = current_user_id) as is_current_user
  FROM ranked_users ru
  WHERE ru.rank <= 100
     OR ru.user_id = current_user_id
  ORDER BY ru.rank;
END;
$$;

-- ===========================================
-- FIX 4: Feedback table - Add input validation
-- ===========================================

-- Add email format validation (optional field, but validate if provided)
ALTER TABLE feedback 
ADD CONSTRAINT feedback_email_format 
  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add message length constraint to prevent abuse
ALTER TABLE feedback
ADD CONSTRAINT feedback_message_length
  CHECK (length(message) >= 10 AND length(message) <= 5000);

-- Add category validation
ALTER TABLE feedback
ADD CONSTRAINT feedback_category_valid
  CHECK (category IN ('bug', 'feature', 'general', 'other'));