-- Add quiz_points column to garden_state for storing quiz rewards
-- This is separate from XP which is earned from reading lessons
ALTER TABLE public.garden_state 
ADD COLUMN quiz_points INTEGER NOT NULL DEFAULT 0;