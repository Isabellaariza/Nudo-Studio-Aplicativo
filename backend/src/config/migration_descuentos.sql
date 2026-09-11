-- Migración: tabla de descuentos por producto
-- Ejecutar una sola vez en la base de datos

CREATE TABLE IF NOT EXISTS descuentos_producto (
  id_descuento    SERIAL PRIMARY KEY,
  id_producto     INTEGER NOT NULL REFERENCES productos(id_productos) ON DELETE CASCADE,
  cantidad_minima INTEGER NOT NULL CHECK (cantidad_minima >= 1),
  porcentaje      NUMERIC(5,2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
  descripcion     TEXT,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índice para consultas rápidas por producto
CREATE INDEX IF NOT EXISTS idx_descuentos_producto ON descuentos_producto(id_producto, activo);

-- Ejemplo de datos iniciales (opcional, ajustar según productos reales)
-- INSERT INTO descuentos_producto (id_producto, cantidad_minima, porcentaje, descripcion)
-- VALUES (1, 10, 30, 'Descuento del 30% al comprar 10 o más unidades');
