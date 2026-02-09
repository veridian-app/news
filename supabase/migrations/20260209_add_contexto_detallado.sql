-- Añadir campo contexto_detallado a boe_expenses
ALTER TABLE boe_expenses 
ADD COLUMN IF NOT EXISTS contexto_detallado TEXT;

COMMENT ON COLUMN boe_expenses.contexto_detallado IS 'Explicación detallada de 2-3 frases sobre qué es el gasto, para qué sirve y por qué importa al ciudadano';
