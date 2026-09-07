import pool from '../config/db.js';

// ══════════════════════════════════════════════════════════════
//  CLIENTES
// ══════════════════════════════════════════════════════════════
export async function listarClientes(req, res, next) {
  try {
    const { buscar } = req.query;
    // Clientes registrados en tabla clientes — trae direccion desde usuarios via JOIN
    let q1 = `
      SELECT c.id_cliente, c.nombre_completo, c.email, c.telefono,
             c.estado, c.id_usuarios, r.nombre AS rol,
             COALESCE(c.direccion, u.direccion) AS direccion,
             'cliente' AS origen
      FROM clientes c
      LEFT JOIN roles r ON c.id_rol = r.id_rol
      LEFT JOIN usuarios u ON u.id_usuarios = c.id_usuarios
    `;
    // Usuarios con rol cliente que aún no tienen fila en clientes
    let q2 = `
      SELECT NULL AS id_cliente, u.nombre AS nombre_completo, u.email, u.telefono,
             u.estado, u.id_usuarios, r.nombre AS rol,
             u.direccion AS direccion,
             'usuario' AS origen
      FROM usuarios u
      LEFT JOIN roles r ON r.id_rol = u.id_rol
      WHERE r.nombre ILIKE 'cliente'
        AND u.id_usuarios NOT IN (SELECT id_usuarios FROM clientes WHERE id_usuarios IS NOT NULL)
    `;
    const params = [];
    if (buscar) {
      params.push(`%${buscar}%`);
      q1 += ` WHERE (c.nombre_completo ILIKE $1 OR c.email ILIKE $1)`;
      q2 += ` AND (u.nombre ILIKE $1 OR u.email ILIKE $1)`;
    }
    const query = `(${q1}) UNION ALL (${q2}) ORDER BY id_cliente DESC NULLS LAST`;
    const result = await pool.query(query, params);
    res.json({ clientes: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function obtenerCliente(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT c.*, r.nombre AS rol FROM clientes c
       LEFT JOIN roles r ON c.id_rol = r.id_rol
       WHERE c.id_cliente = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json({ cliente: result.rows[0] });
  } catch (err) { next(err); }
}

export async function crearCliente(req, res, next) {
  const { nombre_completo, email, telefono, direccion } = req.body;
  if (!nombre_completo) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  try {
    const rolResult = await pool.query(`SELECT id_rol FROM roles WHERE nombre = 'cliente' LIMIT 1`);
    const id_rol = rolResult.rows[0]?.id_rol || null;
    const result = await pool.query(
      `INSERT INTO clientes (nombre_completo, email, telefono, direccion, estado, id_rol)
       VALUES ($1, $2, $3, $4, TRUE, $5) RETURNING *`,
      [nombre_completo, email, telefono, direccion, id_rol]
    );
    res.status(201).json({ mensaje: 'Cliente creado', cliente: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarCliente(req, res, next) {
  const { nombre_completo, email, telefono, direccion, estado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE clientes SET
         nombre_completo = COALESCE($1, nombre_completo),
         email           = COALESCE($2, email),
         telefono        = COALESCE($3, telefono),
         direccion       = $4,
         estado          = COALESCE($5, estado)
       WHERE id_cliente = $6 RETURNING *`,
      [nombre_completo, email, telefono, direccion ?? null, estado, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json({ mensaje: 'Cliente actualizado', cliente: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminarCliente(req, res, next) {
  try {
    const ventas = await pool.query(`SELECT id_ventas FROM ventas WHERE id_cliente = $1 LIMIT 1`, [req.params.id]);
    if (ventas.rows.length) return res.status(403).json({ mensaje: 'No se puede eliminar: el cliente tiene ventas registradas' });
    const pedidos = await pool.query(`SELECT id_pedidoss FROM pedidos WHERE id_cliente = $1 LIMIT 1`, [req.params.id]);
    if (pedidos.rows.length) return res.status(403).json({ mensaje: 'No se puede eliminar: el cliente tiene pedidos registrados' });
    await pool.query(`DELETE FROM clientes WHERE id_cliente = $1`, [req.params.id]);
    res.json({ mensaje: 'Cliente eliminado' });
  } catch (err) { next(err); }
}

// ══════════════════════════════════════════════════════════════
//  EMPLEADOS
// ══════════════════════════════════════════════════════════════
export async function listarEmpleados(req, res, next) {
  try {
    const { buscar } = req.query;
    let query = `
      SELECT e.id_empleado, e.nombre_completo, e.cargo, e.departamento,
             e.salario_mensual, e.tipo_contrato, e.fecha_inicio,
             e.tipo_sangre, e.eps, e.contacto_emergencia, e.alergias,
             e.email, e.telefono, e.direccion, e.tipo_documento, e.numero_documento,
             e.id_usuarios, r.nombre AS rol
      FROM empleados e
      LEFT JOIN roles r ON e.id_rol = r.id_rol
      WHERE 1=1
    `;
    const params = [];
    if (buscar) {
      params.push(`%${buscar}%`);
      query += ` AND (e.nombre_completo ILIKE $1 OR e.cargo ILIKE $1)`;
    }
    query += ' ORDER BY e.id_empleado DESC';
    const result = await pool.query(query, params);
    res.json({ empleados: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function obtenerEmpleado(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT e.*, r.nombre AS rol FROM empleados e
       LEFT JOIN roles r ON e.id_rol = r.id_rol
       WHERE e.id_empleado = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    res.json({ empleado: result.rows[0] });
  } catch (err) { next(err); }
}

export async function crearEmpleado(req, res, next) {
  const { nombre_completo, cargo, departamento, salario_mensual, tipo_contrato,
          fecha_inicio, tipo_sangre, eps, contacto_emergencia, alergias,
          email, telefono, direccion, tipo_documento, numero_documento, id_rol } = req.body;
  if (!nombre_completo) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  try {
    const result = await pool.query(
      `INSERT INTO empleados (nombre_completo, cargo, departamento, salario_mensual,
        tipo_contrato, fecha_inicio, tipo_sangre, eps, contacto_emergencia, alergias,
        email, telefono, direccion, tipo_documento, numero_documento, id_rol, id_usuarios)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [nombre_completo, cargo, departamento, salario_mensual, tipo_contrato,
       fecha_inicio, tipo_sangre, eps, contacto_emergencia, alergias,
       email || null, telefono || null, direccion || null, tipo_documento || null, numero_documento || null,
       id_rol || null, req.usuario.id]
    );
    res.status(201).json({ mensaje: 'Empleado creado', empleado: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarEmpleado(req, res, next) {
  const { nombre_completo, cargo, departamento, salario_mensual, tipo_contrato,
          fecha_inicio, tipo_sangre, eps, contacto_emergencia, alergias,
          email, telefono, direccion, tipo_documento, numero_documento, id_rol } = req.body;
  try {
    const result = await pool.query(
      `UPDATE empleados SET
         nombre_completo     = COALESCE($1, nombre_completo),
         cargo               = COALESCE($2, cargo),
         departamento        = COALESCE($3, departamento),
         salario_mensual     = COALESCE($4, salario_mensual),
         tipo_contrato       = COALESCE($5, tipo_contrato),
         fecha_inicio        = COALESCE($6, fecha_inicio),
         tipo_sangre         = COALESCE($7, tipo_sangre),
         eps                 = COALESCE($8, eps),
         contacto_emergencia = COALESCE($9, contacto_emergencia),
         alergias            = COALESCE($10, alergias),
         email               = COALESCE($11, email),
         telefono            = COALESCE($12, telefono),
         direccion           = COALESCE($13, direccion),
         tipo_documento      = COALESCE($14, tipo_documento),
         numero_documento    = COALESCE($15, numero_documento),
         id_rol              = $16
       WHERE id_empleado = $17 RETURNING *`,
      [nombre_completo, cargo, departamento, salario_mensual, tipo_contrato,
       fecha_inicio, tipo_sangre, eps, contacto_emergencia, alergias,
       email, telefono, direccion, tipo_documento, numero_documento,
       id_rol || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    res.json({ mensaje: 'Empleado actualizado', empleado: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminarEmpleado(req, res, next) {
  try {
    await pool.query(`DELETE FROM empleados WHERE id_empleado = $1`, [req.params.id]);
    res.json({ mensaje: 'Empleado eliminado' });
  } catch (err) { next(err); }
}
