import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

export async function listar(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT u.id_usuarios, u.nombre, u.tipo_documento, u.numero_documento,
             u.email, u.telefono, u.direccion, u.estado, u.id_rol,
             r.nombre AS rol
      FROM usuarios u
      LEFT JOIN roles r ON r.id_rol = u.id_rol
      ORDER BY u.id_usuarios DESC
    `);
    res.json({ usuarios: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function crear(req, res, next) {
  const { nombre, correo, contrasena, tipo_documento, numero_documento, telefono, direccion, id_rol } = req.body;
  if (!nombre || !correo || !contrasena) return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios' });
  try {
    const existe = await pool.query('SELECT id_usuarios FROM usuarios WHERE email = $1', [correo.toLowerCase()]);
    if (existe.rows.length > 0) return res.status(409).json({ mensaje: 'El correo ya está registrado' });
    const hash = await bcrypt.hash(contrasena, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, tipo_documento, numero_documento, email, telefono, direccion, contrasena_hash, estado, id_rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8) RETURNING id_usuarios, nombre, email`,
      [nombre, tipo_documento || null, numero_documento || null, correo.toLowerCase(), telefono || null, direccion || null, hash, id_rol || null]
    );
    res.status(201).json({ mensaje: 'Usuario creado', usuario: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizar(req, res, next) {
  const { nombre, tipo_documento, numero_documento, telefono, direccion, estado, id_rol } = req.body;
  try {
    // id_rol puede venir explícitamente como null para quitarlo, por eso no usamos COALESCE
    const fields = [
      'nombre           = COALESCE($1, nombre)',
      'tipo_documento   = COALESCE($2, tipo_documento)',
      'numero_documento = COALESCE($3, numero_documento)',
      'telefono         = COALESCE($4, telefono)',
      'direccion        = COALESCE($5, direccion)',
      'estado           = COALESCE($6, estado)',
    ];
    const params = [nombre, tipo_documento, numero_documento, telefono, direccion, estado];

    // Solo actualizar id_rol si viene en el body
    if ('id_rol' in req.body) {
      fields.push(`id_rol = $${params.length + 1}`);
      params.push(id_rol ?? null);
    }

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuarios = $${params.length} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario actualizado', usuario: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminar(req, res, next) {
  try {
    const verif = await pool.query(
      `SELECT u.id_usuarios FROM usuarios u
       LEFT JOIN clientes c ON c.id_usuarios = u.id_usuarios
       LEFT JOIN empleados e ON e.id_usuarios = u.id_usuarios
       LEFT JOIN roles r ON r.id_rol = COALESCE(c.id_rol, e.id_rol)
       WHERE u.id_usuarios = $1 AND r.nombre = 'administrador'`, [req.params.id]
    );
    if (verif.rows.length) return res.status(403).json({ mensaje: 'El administrador no puede ser eliminado' });
    const ventas = await pool.query(`SELECT id_ventas FROM ventas WHERE id_cliente IN (SELECT id_cliente FROM clientes WHERE id_usuarios = $1) LIMIT 1`, [req.params.id]);
    if (ventas.rows.length) return res.status(403).json({ mensaje: 'No se puede eliminar: el usuario tiene ventas registradas' });
    const matriculas = await pool.query(`SELECT m.id_matricula FROM matriculas m JOIN estudiantes e ON m.id_estudiante = e.id_estudiante WHERE e.id_usuarios = $1 LIMIT 1`, [req.params.id]);
    if (matriculas.rows.length) return res.status(403).json({ mensaje: 'No se puede eliminar: el usuario tiene matrículas en talleres' });
    await pool.query('DELETE FROM usuarios WHERE id_usuarios = $1', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) { next(err); }
}
