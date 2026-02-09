-- Tabla para almacenar subvenciones de BDNS
CREATE TABLE IF NOT EXISTS bdns_subvenciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bdns_id BIGINT UNIQUE NOT NULL, -- ID de BDNS
    codigo_concesion TEXT NOT NULL,
    fecha_concesion DATE NOT NULL,
    beneficiario TEXT NOT NULL,
    importe DECIMAL(15,2) NOT NULL,
    instrumento TEXT, -- Tipo de subvención
    convocatoria TEXT,
    numero_convocatoria TEXT,
    administracion TEXT, -- LOCAL, ESTATAL, AUTONOMICA
    departamento TEXT,
    organo TEXT,
    resumen_veridian TEXT, -- Resumen generado por IA
    contexto_detallado TEXT, -- Explicación del ciudadano
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_bdns_fecha ON bdns_subvenciones(fecha_concesion DESC);
CREATE INDEX IF NOT EXISTS idx_bdns_importe ON bdns_subvenciones(importe DESC);
CREATE INDEX IF NOT EXISTS idx_bdns_administracion ON bdns_subvenciones(administracion);

-- Comentarios
COMMENT ON TABLE bdns_subvenciones IS 'Subvenciones y ayudas públicas del BDNS (Base de Datos Nacional de Subvenciones)';
COMMENT ON COLUMN bdns_subvenciones.resumen_veridian IS 'Resumen corto en lenguaje ciudadano';
COMMENT ON COLUMN bdns_subvenciones.contexto_detallado IS 'Explicación de 2-3 frases sobre qué es y por qué importa';
