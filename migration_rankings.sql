-- =============================================
-- MIGRAÇÃO COMPLETA: Ranking + Fotos por Bloco
-- Execute este script no Supabase → SQL Editor
-- =============================================

-- 1. Tabela de Fotos (se não existir)
CREATE TABLE IF NOT EXISTS public.photos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    storage_path text NOT NULL,
    alt_text text,
    sort_order int DEFAULT 0,
    active boolean DEFAULT true,
    slot_id text,
    created_at timestamptz DEFAULT now()
);

-- Garantir índice único para slot_id (uploads por bloco)
CREATE UNIQUE INDEX IF NOT EXISTS idx_photos_slot_id ON public.photos(slot_id);

-- 2. Tabela de Rankings
CREATE TABLE IF NOT EXISTS public.rankings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    period_label text NOT NULL,
    period_start date,
    period_end date,
    source_file_name text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de Entradas do Ranking
CREATE TABLE IF NOT EXISTS public.ranking_entries (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ranking_id bigint NOT NULL REFERENCES public.rankings(id) ON DELETE CASCADE,
    position int NOT NULL CHECK (position > 0),
    customer_name text NOT NULL,
    phone_last_four text,
    order_count int NOT NULL DEFAULT 0,
    original_position int,
    manually_edited boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 4. Tabela de Promoções (se não existir)
CREATE TABLE IF NOT EXISTS public.promotions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    description text,
    button_text text,
    button_url text,
    start_date date,
    end_date date,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 5. Tabela de Métricas (se não existir)
CREATE TABLE IF NOT EXISTS public.page_views (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    path text,
    referrer text,
    user_agent text,
    viewed_at timestamptz DEFAULT now()
);

-- 6. Storage Bucket para imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Habilitar Row Level Security
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de Acesso - Photos
DROP POLICY IF EXISTS "Public read photos" ON public.photos;
CREATE POLICY "Public read photos" ON public.photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth write photos" ON public.photos;
CREATE POLICY "Auth write photos" ON public.photos FOR ALL USING (auth.role() = 'authenticated');

-- 9. Políticas de Acesso - Rankings
DROP POLICY IF EXISTS "Public read published rankings" ON public.rankings;
CREATE POLICY "Public read published rankings" ON public.rankings
    FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Auth full access rankings" ON public.rankings;
CREATE POLICY "Auth full access rankings" ON public.rankings
    FOR ALL USING (auth.role() = 'authenticated');

-- 10. Políticas de Acesso - Ranking Entries
DROP POLICY IF EXISTS "Public read ranking entries" ON public.ranking_entries;
CREATE POLICY "Public read ranking entries" ON public.ranking_entries
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.rankings r WHERE r.id = ranking_id AND r.status = 'published')
    );
DROP POLICY IF EXISTS "Auth full access ranking entries" ON public.ranking_entries;
CREATE POLICY "Auth full access ranking entries" ON public.ranking_entries
    FOR ALL USING (auth.role() = 'authenticated');

-- 11. Políticas de Acesso - Promotions
DROP POLICY IF EXISTS "Public read promos" ON public.promotions;
CREATE POLICY "Public read promos" ON public.promotions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth write promos" ON public.promotions;
CREATE POLICY "Auth write promos" ON public.promotions FOR ALL USING (auth.role() = 'authenticated');

-- 12. Políticas de Acesso - Page Views
DROP POLICY IF EXISTS "Public insert views" ON public.page_views;
CREATE POLICY "Public insert views" ON public.page_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Auth read views" ON public.page_views;
CREATE POLICY "Auth read views" ON public.page_views FOR SELECT USING (auth.role() = 'authenticated');

-- 13. Políticas de Acesso - Storage
DROP POLICY IF EXISTS "Public read images" ON storage.objects;
CREATE POLICY "Public read images" ON storage.objects FOR SELECT USING (bucket_id = 'site-images');
DROP POLICY IF EXISTS "Auth upload images" ON storage.objects;
CREATE POLICY "Auth upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-images' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete images" ON storage.objects;
CREATE POLICY "Auth delete images" ON storage.objects FOR DELETE USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');

-- 14. Índices para performance
CREATE INDEX IF NOT EXISTS idx_rankings_status_published ON public.rankings(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_entries_ranking_id ON public.ranking_entries(ranking_id, position);

-- 15. Trigger para updated_at em rankings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rankings_updated_at ON public.rankings;
CREATE TRIGGER trigger_rankings_updated_at
    BEFORE UPDATE ON public.rankings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
