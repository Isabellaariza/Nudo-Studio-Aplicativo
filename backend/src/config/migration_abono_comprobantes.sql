-- Tabla para guardar TODOS los comprobantes enviados por un abono (nunca se pierden)
CREATE TABLE IF NOT EXISTS abono_comprobantes (
  id_comprobante  SERIAL PRIMARY KEY,
  id_abono        INTEGER NOT NULL REFERENCES abonos(id_abono) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  subido_por      VARCHAR(20) DEFAULT 'cliente',  -- 'cliente' | 'admin'
  fecha_subida    TIMESTAMPTZ DEFAULT NOW()
);

-- Garantizar la constraint UNIQUE también para tablas ya creadas sin ella.
-- IF NOT EXISTS evita error si la constraint ya existe (migración idempotente).
-- Si la tabla ya existe y contiene duplicados (mismo id_abono + url),
-- este ALTER fallará — lo cual es el comportamiento correcto: alerta
-- de que existen duplicados que deben resolverse antes de la constraint.
ALTER TABLE abono_comprobantes
  ADD CONSTRAINT IF NOT EXISTS uq_abono_comprobante UNIQUE (id_abono, url);

-- Tabla de historial/notas internas de un abono (para exceso, devoluciones, etc.)
CREATE TABLE IF NOT EXISTS abono_historial (
  id_historial  SERIAL PRIMARY KEY,
  id_abono      INTEGER NOT NULL REFERENCES abonos(id_abono) ON DELETE CASCADE,
  tipo          VARCHAR(50) NOT NULL,   -- 'exceso_detectado' | 'devolucion_registrada' | 'rechazo' | 'aprobacion'
  nota          TEXT,
  comprobante_devolucion TEXT,          -- URL del comprobante de devolución (solo para exceso)
  monto_exceso  NUMERIC(12,2),
  creado_en     TIMESTAMPTZ DEFAULT NOW()
);

-- Migrar comprobantes existentes en abonos.comprobante_pago a la nueva tabla
INSERT INTO abono_comprobantes (id_abono, url, subido_por, fecha_subida)
SELECT id_abono, comprobante_pago, 'cliente', fecha_abono
FROM abonos
WHERE comprobante_pago IS NOT NULL
  AND comprobante_pago <> ''
ON CONFLICT (id_abono, url) DO NOTHING;
