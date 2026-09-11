-- Migración: agregar columna direccion a la tabla clientes
-- Ejecutar una sola vez contra la base de datos de producción/desarrollo

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS direccion TEXT;
