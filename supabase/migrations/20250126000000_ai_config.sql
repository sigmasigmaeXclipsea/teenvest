-- Create AI configuration table for storing API keys
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL UNIQUE,
  gemini_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- Create policy for reading AI config (authenticated users only)
CREATE POLICY "Users can view AI config" ON ai_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for updating AI config (service role only)
CREATE POLICY "Service can update AI config" ON ai_config
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default config for Gemini
INSERT INTO ai_config (service, gemini_api_key) 
  VALUES ('gemini', NULL)
  ON CONFLICT (service) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_config_updated_at 
  BEFORE UPDATE ON ai_config 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
