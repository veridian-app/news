-- ==========================================
-- 1. WAITLIST USERS (Usuarios en lista de espera)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.waitlist_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referral_count INTEGER DEFAULT 0,
    referred_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. DAILY NEWS (Noticias diarias - Integración n8n)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.daily_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    source TEXT,
    url TEXT,
    image TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, 
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. NEWS LIKES (Likes de noticias)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.news_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- ID del usuario (puede ser anónimo string o UUID usuario auth)
    news_id TEXT NOT NULL, -- ID de la noticia (puede coincidir con daily_news.id o ser externo)
    news_title TEXT,
    news_source TEXT,
    news_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. USER PREFERENCES (Preferencias de usuario)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT,
    score INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. NEWS COMMENTS (Comentarios en noticias)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.news_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================
-- Habilitar seguridad en tablas relevantes
ALTER TABLE public.daily_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_users ENABLE ROW LEVEL SECURITY;

-- 1. LECTURA (Permitir lectura pública a la app)
CREATE POLICY "Public Read News" ON public.daily_news FOR SELECT USING (true);
CREATE POLICY "Public Read Likes" ON public.news_likes FOR SELECT USING (true);
CREATE POLICY "Public Read Prefs" ON public.user_preferences FOR SELECT USING (true);
CREATE POLICY "Public Read Comments" ON public.news_comments FOR SELECT USING (true);

-- 2. ESCRITURA (Permitir inserción/update desde la web)
-- Nota: En un entorno estricto, esto debería filtrarse por user_id, 
-- pero como usamos IDs anónimos en localStorage, permitimos insert general por ahora.
CREATE POLICY "Public Insert Likes" ON public.news_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Likes" ON public.news_likes FOR DELETE USING (true); -- Permitir quitar like

CREATE POLICY "Public Insert Prefs" ON public.user_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Prefs" ON public.user_preferences FOR UPDATE USING (true);

CREATE POLICY "Public Insert Waitlist" ON public.waitlist_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Comments" ON public.news_comments FOR INSERT WITH CHECK (true);

-- 3. SERVICE ROLE (Para n8n y script administrativos)
-- Los keys de servicio ("service_role") se saltan el RLS, pero definimos explícitamente para claridad.
CREATE POLICY "Service Role Full Access News" ON public.daily_news FOR ALL USING (true);

-- ==========================================
-- 6. STORAGE (Almacenamiento de imágenes)
-- ==========================================
-- Crear el bucket 'news-covers' si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('news-covers', 'news-covers', true) 
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública
CREATE POLICY "Public Read News Covers" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'news-covers');

-- Política de escritura para Service Role (API/n8n)
CREATE POLICY "Service Role Upload News Covers" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'news-covers');
