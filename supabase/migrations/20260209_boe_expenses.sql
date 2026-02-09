-- =============================================================================
-- BOE Expenses Table - Almacena el gasto público extraído del BOE
-- =============================================================================

-- Tabla principal de gastos BOE
CREATE TABLE IF NOT EXISTS boe_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Fecha del BOE analizado
    boe_date DATE NOT NULL,
    boe_section TEXT, -- Sección del BOE (III, V, etc.)
    boe_url TEXT,     -- URL al documento original
    
    -- Datos extraídos por IA
    beneficiario TEXT NOT NULL,
    importe_total DECIMAL(15, 2),
    moneda TEXT DEFAULT 'EUR',
    organismo_pagador TEXT,
    tipo_adjudicacion TEXT, -- 'A dedo' | 'Concurso' | 'Subvención'
    resumen_veridian TEXT,  -- Máx 10 palabras, irónico pero veraz
    
    -- Texto original para auditoría
    texto_original TEXT,
    titulo_original TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices para búsquedas
    CONSTRAINT check_importe_positivo CHECK (importe_total >= 0)
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_boe_expenses_date ON boe_expenses(boe_date DESC);
CREATE INDEX IF NOT EXISTS idx_boe_expenses_importe ON boe_expenses(importe_total DESC);
CREATE INDEX IF NOT EXISTS idx_boe_expenses_beneficiario ON boe_expenses(beneficiario);
CREATE INDEX IF NOT EXISTS idx_boe_expenses_organismo ON boe_expenses(organismo_pagador);

-- Vista para estadísticas diarias
CREATE OR REPLACE VIEW boe_daily_stats AS
SELECT 
    boe_date,
    COUNT(*) as total_registros,
    SUM(importe_total) as gasto_total,
    AVG(importe_total) as gasto_promedio,
    MAX(importe_total) as gasto_maximo
FROM boe_expenses
GROUP BY boe_date
ORDER BY boe_date DESC;

-- Comentarios explicativos
COMMENT ON TABLE boe_expenses IS 'Gastos públicos extraídos del BOE mediante análisis automatizado';
COMMENT ON COLUMN boe_expenses.resumen_veridian IS 'Resumen en lenguaje ciudadano, máximo 10 palabras';
COMMENT ON COLUMN boe_expenses.tipo_adjudicacion IS 'A dedo, Concurso, Subvención, etc.';
