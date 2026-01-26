-- Create garden_updates table for admin-managed garden money/XP updates
CREATE TABLE IF NOT EXISTS garden_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  money INTEGER,
  xp INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE garden_updates ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage garden updates
CREATE POLICY "Admins can manage garden updates" ON garden_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_garden_updates_user_email ON garden_updates(user_email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_garden_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_garden_updates_updated_at 
  BEFORE UPDATE ON garden_updates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_garden_updates_updated_at();
