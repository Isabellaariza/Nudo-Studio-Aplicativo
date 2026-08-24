// src/middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * Verifica que el token JWT sea válido.
 * Adjunta req.usuario con { id, correo, rol } para uso en controllers.
 */
export function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, correo, rol, iat, exp }
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
