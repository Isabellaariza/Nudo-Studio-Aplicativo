// src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../config/db.js';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id_usuarios, correo: usuario.email, rol: usuario.nombre_rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

export async function login(req, res, next) {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena)
    return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });

  try {
    // Buscar usuario — el rol directo en usuarios tiene prioridad sobre clientes/empleados
    const result = await pool.query(
      `SELECT u.id_usuarios, u.nombre, u.email, u.estado, u.contrasena_hash,
              COALESCE(ru.nombre, rc.nombre, re.nombre, 'administrador') AS nombre_rol,
              COALESCE(ru.id_rol, rc.id_rol, re.id_rol) AS id_rol,
              COALESCE(ru.permisos, rc.permisos, re.permisos, '{}') AS permisos
       FROM usuarios u
       LEFT JOIN clientes c ON c.id_usuarios = u.id_usuarios
       LEFT JOIN empleados e ON e.id_usuarios = u.id_usuarios
       LEFT JOIN roles rc ON rc.id_rol = c.id_rol
       LEFT JOIN roles re ON re.id_rol = e.id_rol
       LEFT JOIN roles ru ON ru.id_rol = u.id_rol
       WHERE u.email = $1`,
      [correo.toLowerCase()]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ mensaje: 'Este correo no está registrado. Por favor regístrate primero.' });

    const usuario = result.rows[0];

    if (!usuario.estado)
      return res.status(403).json({ mensaje: 'Cuenta desactivada. Contacta al administrador' });

    const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!passwordValida)
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });

    const token = generarToken(usuario);

    console.log('LOGIN DEBUG:', { nombre_rol: usuario.nombre_rol, id_rol: usuario.id_rol, email: usuario.email });

    res.json({
      mensaje: `¡Bienvenido/a ${usuario.nombre}!`,
      token,
      usuario: {
        id: usuario.id_usuarios,
        nombre: usuario.nombre,
        correo: usuario.email,
        rol: usuario.nombre_rol,
        permisos: usuario.permisos || [],
      },
    });
  } catch (err) { next(err); }
}

export async function registro(req, res, next) {
  const { nombre, correo, contrasena, telefono, direccion, tipo_documento, numero_documento } = req.body;
  if (!nombre || !correo || !contrasena || !telefono || !direccion || !numero_documento)
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });

  try {
    const existe = await pool.query(
      `SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER($1)
       UNION
       SELECT 1 FROM clientes WHERE LOWER(email) = LOWER($1)`,
      [correo.toLowerCase()]
    );
    if (existe.rows.length > 0)
      return res.status(409).json({ mensaje: 'Este correo ya tiene una cuenta registrada. Inicia sesion.' });

    const rolResult = await pool.query(
      "SELECT id_rol FROM roles WHERE nombre = 'cliente' AND estado = TRUE LIMIT 1"
    );
    if (rolResult.rows.length === 0)
      return res.status(500).json({ mensaje: 'Rol cliente no configurado' });

    const hash = await bcrypt.hash(contrasena, 10);

    const nuevoUsuario = await pool.query(
      `INSERT INTO usuarios (nombre, email, contrasena_hash, telefono, direccion, tipo_documento, numero_documento, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) RETURNING id_usuarios, nombre, email`,
      [nombre, correo.toLowerCase(), hash, telefono || null, direccion || null, tipo_documento || null, numero_documento || null]
    );

    await pool.query(
      `INSERT INTO clientes (nombre_completo, email, telefono, estado, id_usuarios, id_rol)
       VALUES ($1, $2, $3, TRUE, $4, $5)`,
      [nombre, correo.toLowerCase(), telefono || null,
       nuevoUsuario.rows[0].id_usuarios, rolResult.rows[0].id_rol]
    );

    res.status(201).json({
      mensaje: '¡Cuenta creada exitosamente!',
      usuario: {
        id: nuevoUsuario.rows[0].id_usuarios,
        nombre: nuevoUsuario.rows[0].nombre,
        correo: nuevoUsuario.rows[0].email,
      },
    });
  } catch (err) { next(err); }
}

export async function perfil(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT u.id_usuarios, u.nombre, u.email, u.telefono, u.direccion,
              u.tipo_documento, u.numero_documento, u.fecha_creacion,
              r.nombre AS rol
       FROM usuarios u
       LEFT JOIN clientes c ON c.id_usuarios = u.id_usuarios
       LEFT JOIN empleados e ON e.id_usuarios = u.id_usuarios
       LEFT JOIN roles r ON r.id_rol = COALESCE(c.id_rol, e.id_rol)
       WHERE u.id_usuarios = $1`,
      [req.usuario.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ usuario: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarPerfil(req, res, next) {
  const { nombre, telefono, direccion, tipo_documento, numero_documento, password } = req.body;
  try {
    const result = await pool.query(
      `UPDATE usuarios SET
         nombre           = COALESCE($1, nombre),
         telefono         = COALESCE($2, telefono),
         direccion        = COALESCE($3, direccion),
         tipo_documento   = COALESCE($4, tipo_documento),
         numero_documento = COALESCE($5, numero_documento)
       WHERE id_usuarios = $6
       RETURNING id_usuarios, nombre, email, telefono, direccion, tipo_documento, numero_documento, fecha_creacion`,
      [nombre || null, telefono || null, direccion || null, tipo_documento || null, numero_documento || null, req.usuario.id]
    );
    if (nombre) {
      await pool.query(
        'UPDATE clientes SET nombre_completo = $1, telefono = COALESCE($2, telefono) WHERE id_usuarios = $3',
        [nombre, telefono || null, req.usuario.id]
      );
    }
    if (password) {
      const current = await pool.query('SELECT contrasena_hash FROM usuarios WHERE id_usuarios = $1', [req.usuario.id]);
      const esMisma = await bcrypt.compare(password, current.rows[0].contrasena_hash);
      if (esMisma)
        return res.status(400).json({ mensaje: 'La nueva contrasena no puede ser igual a la actual' });
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE usuarios SET contrasena_hash = $1 WHERE id_usuarios = $2', [hash, req.usuario.id]);
    }
    res.json({ mensaje: 'Perfil actualizado', usuario: result.rows[0] });
  } catch (err) { next(err); }
}

export async function cambiarContrasena(req, res, next) {
  const { contrasenaActual, contrasenaNueva } = req.body;
  if (!contrasenaActual || !contrasenaNueva)
    return res.status(400).json({ mensaje: 'Ambas contrasenas son obligatorias' });
  if (contrasenaNueva.length < 10)
    return res.status(400).json({ mensaje: 'La nueva contrasena debe tener minimo 10 caracteres' });
  if (!/(?=.*[0-9])(?=.*[A-Z])(?=.*[_\-@$#%&/!?.*+^=])/.test(contrasenaNueva))
    return res.status(400).json({ mensaje: 'La contrasena no cumple los requisitos de seguridad' });
  try {
    const result = await pool.query(
      'SELECT contrasena_hash FROM usuarios WHERE id_usuarios = $1',
      [req.usuario.id]
    );
    const valida = await bcrypt.compare(contrasenaActual, result.rows[0].contrasena_hash);
    if (!valida)
      return res.status(401).json({ mensaje: 'La contrasena actual es incorrecta' });
    const nuevoHash = await bcrypt.hash(contrasenaNueva, 10);
    await pool.query(
      'UPDATE usuarios SET contrasena_hash = $1 WHERE id_usuarios = $2',
      [nuevoHash, req.usuario.id]
    );
    res.json({ mensaje: 'Contrasena actualizada exitosamente' });
  } catch (err) { next(err); }
}

export async function solicitarRecuperacion(req, res, next) {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ mensaje: 'El correo es obligatorio' });

  try {
    const result = await pool.query(
      'SELECT id_usuarios, nombre FROM usuarios WHERE email = $1 AND estado = TRUE',
      [correo.toLowerCase()]
    );
    if (result.rows.length === 0)
      return res.json({ mensaje: 'Si el correo está registrado, podrás continuar.' });

    const usuario = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      'UPDATE usuarios SET reset_token = $1, reset_token_expira = $2 WHERE id_usuarios = $3',
      [token, expira, usuario.id_usuarios]
    );

    res.json({
      mensaje: 'Token generado correctamente.',
      token
    });
  } catch (err) { next(err); }
}

export async function resetearContrasena(req, res, next) {
  const { token, contrasenaNueva } = req.body;
  if (!token || !contrasenaNueva)
    return res.status(400).json({ mensaje: 'Token y nueva contrasena son obligatorios' });
  if (contrasenaNueva.length < 10)
    return res.status(400).json({ mensaje: 'La contrasena debe tener minimo 10 caracteres' });
  if (!/(?=.*[0-9])(?=.*[A-Z])(?=.*[_\-@$#%&/!?.*+^=])/.test(contrasenaNueva))
    return res.status(400).json({ mensaje: 'La contrasena debe tener al menos 1 numero, 1 mayuscula y 1 signo especial' });

  try {
    const result = await pool.query(
      `SELECT id_usuarios, contrasena_hash FROM usuarios
       WHERE reset_token = $1 AND reset_token_expira > NOW() AND estado = TRUE`,
      [token]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ mensaje: 'El enlace no es valido o ya expiro' });

    const esMisma = await bcrypt.compare(contrasenaNueva, result.rows[0].contrasena_hash);
    if (esMisma)
      return res.status(400).json({ mensaje: 'La nueva contrasena no puede ser igual a la actual' });

    const hash = await bcrypt.hash(contrasenaNueva, 10);
    await pool.query(
      'UPDATE usuarios SET contrasena_hash = $1, reset_token = NULL, reset_token_expira = NULL WHERE id_usuarios = $2',
      [hash, result.rows[0].id_usuarios]
    );

    res.json({ mensaje: 'Contrasena actualizada correctamente. Ya puedes iniciar sesion.' });
  } catch (err) { next(err); }
}
