-- =============================================
-- MIGRAÇÃO: Ranking de Clientes + Fotos por Bloco
-- Execute este script no Supabase → SQL Editor
-- =============================================

-- 1. Tabela de Rankings
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

-- 2. Tabela de Entradas do Ranking
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

-- 3. Adicionar coluna slot_id à tabela photos (para uploads por bloco)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photos' AND column_name = 'slot_id') THEN
        ALTER TABLE public.photos ADD COLUMN slot_id text;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_photos_slot_id ON public.photos(slot_id);
    END IF;
END $$;

-- 4. Habilitar Row Level Security
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_entries ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso - Rankings
DROP POLICY IF EXISTS "Public read published rankings" ON public.rankings;
CREATE POLICY "Public read published rankings" ON public.rankings
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Auth full access rankings" ON public.rankings;
CREATE POLICY "Auth full access rankings" ON public.rankings
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Políticas de Acesso - Ranking Entries
DROP POLICY IF EXISTS "Public read ranking entries" ON public.ranking_entries;
CREATE POLICY "Public read ranking entries" ON public.ranking_entries
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.rankings r WHERE r.id = ranking_id AND r.status = 'published')
    );

DROP POLICY IF EXISTS "Auth full access ranking entries" ON public.ranking_entries;
CREATE POLICY "Auth full access ranking entries" ON public.ranking_entries
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_rankings_status_published ON public.rankings(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_entries_ranking_id ON public.ranking_entries(ranking_id, position);

-- 8. Trigger para atualizar updated_at automaticamente
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
