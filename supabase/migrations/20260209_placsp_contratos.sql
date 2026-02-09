-- Tabla para almacenar licitaciones de PLACSP
CREATE TABLE IF NOT EXISTS placsp_contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placsp_id TEXT UNIQUE NOT NULL, -- ID de licitación (URL o ID interno)
    titulo TEXT NOT NULL,
    organo_contratacion TEXT,
    fecha_publicacion TIMESTAMPTZ NOT NULL,
    importe DECIMAL(15,2), -- Puede ser nulo si no se detecta
    moneda TEXT DEFAULT 'EUR',
    estado TEXT, -- RES, PUB, ADJ...
    link_licitacion TEXT,
    resumen_veridian TEXT, -- Generado por IA
    contexto_detallado TEXT, -- Generado por IA
    raw_summary TEXT, -- Resumen original del XML
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_placsp_fecha ON placsp_contratos(fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_placsp_importe ON placsp_contratos(importe DESC);

-- Comentarios
COMMENT ON TABLE placsp_contratos IS 'Contratos y licitaciones de la Plataforma de Contratación del Sector Público';
