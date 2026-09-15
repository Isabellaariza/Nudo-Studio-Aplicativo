// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, correo, rol, pv, iat, exp }

    // Verificar que la contraseña no haya cambiado desde que se emitió el token
    const result = await pool.query(
      'SELECT password_version FROM usuarios WHERE id_usuarios = $1 AND estado = TRUE',
      [payload.id]
    );
    if (!result.rows.length) return res.status(401).json({ mensaje: 'Usuario no encontrado o inactivo' });
    const pvActual = result.rows[0].password_version || 0;
    if ((payload.pv || 0) < pvActual) {
      return res.status(401).json({ mensaje: 'Sesión expirada: la contraseña fue cambiada en otro dispositivo' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

/**
 * Restringe el acceso a uno o más roles.
 * Uso: verificarRol('administrador') o verificarRol('administrador', 'empleado')
 */
export function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`,
      });
    }

    next();
  };
}
