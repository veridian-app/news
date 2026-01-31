-- =====================================================
-- VERIDIAN: User Authentication & Tracking Schema
-- =====================================================
-- Run this in Supabase SQL Editor to set up auth tables
-- =====================================================

-- 1. Create user_profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. Add user_id column to news_likes (if not exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news_likes' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE news_likes ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_news_likes_auth_user ON news_likes(auth_user_id);
  END IF;
END $$;

-- 3. Add user_id column to poll_votes (if not exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'poll_votes' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE poll_votes ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_poll_votes_auth_user ON poll_votes(auth_user_id);
  END IF;
END $$;

-- 4. Create user_activity_log table for detailed tracking
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'like', 'unlike', 'comment', 'vote', 'view', 'share'
  target_type TEXT, -- 'news', 'poll', 'comment'
  target_id TEXT, -- news_id or poll_id
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for activity log
CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_target ON user_activity_log(target_type, target_id);

-- Enable RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_log (users can only see their own activity)
CREATE POLICY "Users can view own activity" 
  ON user_activity_log FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" 
  ON user_activity_log FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 5. Create analytics views for admin (optional - requires service role)
-- View: User engagement summary
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  up.id as user_id,
  up.email,
  up.display_name,
  up.created_at as registered_at,
  up.last_active_at,
  COUNT(DISTINCT nl.news_id) as total_likes,
  COUNT(DISTINCT pv.poll_id) as total_votes,
  COUNT(DISTINCT ual.id) as total_actions
FROM user_profiles up
LEFT JOIN news_likes nl ON nl.auth_user_id = up.id
LEFT JOIN poll_votes pv ON pv.auth_user_id = up.id
LEFT JOIN user_activity_log ual ON ual.user_id = up.id
GROUP BY up.id, up.email, up.display_name, up.created_at, up.last_active_at;

-- =====================================================
-- IMPORTANT: After running this script, you need to:
-- 1. Run: NOTIFY pgrst, 'reload schema';
-- 2. Wait 30 seconds for cache to clear
-- 3. Refresh Supabase types in your project
-- =====================================================

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
