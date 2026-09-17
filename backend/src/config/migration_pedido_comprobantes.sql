-- ============================================================
-- MIGRACIÓN: Historial de comprobantes y devoluciones para PEDIDOS
-- Fecha: 2025
-- IMPORTANTE: Ejecutar una sola vez en producción
-- NO hace DROP, TRUNCATE ni ALTER destructivo
-- ============================================================

-- 1. Tabla de comprobantes de pedidos (equivalente a abono_comprobantes)
--    ON DELETE RESTRICT para proteger el historial histórico
CREATE TABLE IF NOT EXISTS pedido_comprobantes (
  id_comprobante  SERIAL PRIMARY KEY,
  id_pedidos      INTEGER NOT NULL REFERENCES pedidos(id_pedidos) ON DELETE RESTRICT,
  url             TEXT NOT NULL,
  subido_por      VARCHAR(20) DEFAULT 'cliente',  -- 'cliente' | 'admin'
  -- Estado en MAYÚSCULAS para coincidir con la convención de pedidos
  -- Valores: 'PAGO_POR_VERIFICAR' | 'RECHAZADO' | 'APROBADO'
  estado          VARCHAR(30) DEFAULT 'PAGO_POR_VERIFICAR',
  motivo_rechazo  TEXT,
  fecha_subida    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de devoluciones de pedidos (equivalente a abono_historial para excesos)
--    Guarda el comprobante de devolución que sube el admin (documento diferente al del cliente)
CREATE TABLE IF NOT EXISTS pedido_devoluciones (
  id_devolucion          SERIAL PRIMARY KEY,
  id_pedidos             INTEGER NOT NULL REFERENCES pedidos(id_pedidos) ON DELETE RESTRICT,
  monto_exceso           NUMERIC(12,2),
  comprobante_devolucion TEXT NOT NULL,
  nota                   TEXT,
  confirmado_en          TIMESTAMPTZ,   -- se llena cuando el cliente confirma
  creado_en              TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Migrar comprobantes existentes en pedidos.comprobante_pago a la nueva tabla
--    DECISIÓN DOCUMENTADA: Se usa pedidos.created_at como fecha aproximada de subida
--    porque no existe una columna específica de fecha de subida del comprobante.
--    El estado se mapea desde pedidos.estado:
--      - 'RECHAZADO'     → 'RECHAZADO'
--      - 'EN_PRODUCCION' → 'APROBADO'
--      - 'COMPLETADO'    → 'APROBADO'
--      - resto           → 'PAGO_POR_VERIFICAR'
INSERT INTO pedido_comprobantes (id_pedidos, url, subido_por, estado, fecha_subida)
SELECT
  id_pedidos,
  comprobante_pago,
  'cliente',
  CASE
    WHEN estado = 'RECHAZADO'     THEN 'RECHAZADO'
    WHEN estado = 'EN_PRODUCCION' THEN 'APROBADO'
    WHEN estado = 'COMPLETADO'    THEN 'APROBADO'
    ELSE 'PAGO_POR_VERIFICAR'
  END,
  COALESCE(created_at, NOW())
FROM pedidos
WHERE comprobante_pago IS NOT NULL
  AND comprobante_pago <> ''
ON CONFLICT DO NOTHING;
