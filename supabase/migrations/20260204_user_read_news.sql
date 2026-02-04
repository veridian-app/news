-- Create user_read_news table for tracking read news
-- Optimized for quick lookups and sorting

CREATE TABLE IF NOT EXISTS user_read_news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  news_id TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(user_id, news_id)
);

-- Enable RLS
ALTER TABLE user_read_news ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can read own read_news"
  ON user_read_news
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own read news
CREATE POLICY "Users can insert own read_news"
  ON user_read_news
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own read news (to mark as unread)
CREATE POLICY "Users can delete own read_news"
  ON user_read_news
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_read_news_user_id ON user_read_news(user_id);

-- Composite index for checking if a specific news is read by user
CREATE INDEX IF NOT EXISTS idx_user_read_news_user_news ON user_read_news(user_id, news_id);
