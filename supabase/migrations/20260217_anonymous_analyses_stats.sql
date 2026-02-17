-- Anonymous analysis statistics for Oraculus
-- Tracks aggregated analysis data without storing user content

CREATE TABLE IF NOT EXISTS anonymous_analyses_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  objectivity_score NUMERIC,
  sources_count INTEGER DEFAULT 0,
  biases_detected_count INTEGER DEFAULT 0,
  avg_source_confidence NUMERIC,
  sources_with_high_confidence INTEGER DEFAULT 0,
  sources_with_medium_confidence INTEGER DEFAULT 0,
  sources_with_low_confidence INTEGER DEFAULT 0,
  article_domain TEXT,
  article_url TEXT,
  -- Individual bias flags
  has_selection_bias BOOLEAN DEFAULT FALSE,
  has_misrepresentation BOOLEAN DEFAULT FALSE,
  has_loaded_language BOOLEAN DEFAULT FALSE,
  has_false_experts BOOLEAN DEFAULT FALSE,
  has_confirmation_bias BOOLEAN DEFAULT FALSE,
  has_framing BOOLEAN DEFAULT FALSE,
  has_omission BOOLEAN DEFAULT FALSE,
  has_appeal_to_emotion BOOLEAN DEFAULT FALSE,
  has_sensationalism BOOLEAN DEFAULT FALSE,
  has_false_equivalence BOOLEAN DEFAULT FALSE,
  has_agenda_setting BOOLEAN DEFAULT FALSE,
  has_hasty_generalization BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_analyses_stats_date ON anonymous_analyses_stats (analysis_date);

-- Index for domain-based queries
CREATE INDEX IF NOT EXISTS idx_analyses_stats_domain ON anonymous_analyses_stats (article_domain);

-- RLS: allow inserts from service role only (stats are saved server-side)
ALTER TABLE anonymous_analyses_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert stats" ON anonymous_analyses_stats
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can read stats" ON anonymous_analyses_stats
  FOR SELECT TO service_role USING (true);
