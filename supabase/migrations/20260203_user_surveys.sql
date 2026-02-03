-- Create user_surveys table for storing demographic and interest data
-- This data is private and used only for personalization

CREATE TABLE IF NOT EXISTS user_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Demographics
  gender TEXT,
  age_range TEXT,
  profession TEXT,
  
  -- Interests (stored as array)
  interests TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One survey per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_surveys ENABLE ROW LEVEL SECURITY;

-- Users can only read their own survey
CREATE POLICY "Users can read own survey"
  ON user_surveys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own survey
CREATE POLICY "Users can insert own survey"
  ON user_surveys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own survey
CREATE POLICY "Users can update own survey"
  ON user_surveys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_surveys_user_id ON user_surveys(user_id);

-- Add comment for documentation
COMMENT ON TABLE user_surveys IS 'Stores private user demographic and interest data for personalization. Data is never shared publicly.';
