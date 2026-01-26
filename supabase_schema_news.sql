-- Create the daily_news table
CREATE TABLE IF NOT EXISTS public.daily_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    source TEXT,
    url TEXT,
    image TEXT,
    -- Using text for array of related links or sources if needed, or just JSONB
    metadata JSONB DEFAULT '{}'::jsonb, 
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies (Row Level Security)
ALTER TABLE public.daily_news ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to everyone (anon and authenticated)
CREATE POLICY "Allow public read access"
ON public.daily_news
FOR SELECT
USING (true);

-- Policy: Allow insert access only to service role (backend/n8n)
CREATE POLICY "Allow service role insert"
ON public.daily_news
FOR INSERT
WITH CHECK (true);
