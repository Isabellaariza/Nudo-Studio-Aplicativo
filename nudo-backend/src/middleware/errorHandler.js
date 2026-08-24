// src/middleware/errorHandler.js

/**
 * Middleware global de errores.
 * Captura cualquier error lanzado con next(err) en los controllers.
 */
export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Error de validación de PostgreSQL (ej: campo duplicado)
  if (err.code === '23505') {
    return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos' });
  }

  // Error de llave foránea
  if (err.code === '23503') {
    return res.status(400).json({ mensaje: 'Referencia inválida a un registro relacionado' });
  }

  const status = err.status || 500;
  const mensaje = err.message || 'Error interno del servidor';

  res.status(status).json({ mensaje });
}
