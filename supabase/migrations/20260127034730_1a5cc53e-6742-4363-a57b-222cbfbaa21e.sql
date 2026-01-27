-- Create garden_state table for storing XP and garden progress
CREATE TABLE public.garden_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.garden_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own garden state" 
ON public.garden_state 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own garden state" 
ON public.garden_state 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own garden state" 
ON public.garden_state 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_garden_state_updated_at
BEFORE UPDATE ON public.garden_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();