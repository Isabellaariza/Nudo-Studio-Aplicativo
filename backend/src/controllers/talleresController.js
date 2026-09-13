import pool from '../config/db.js';

export async function listarTalleres(req, res, next) {
  try {
    const { buscar } = req.query;
    let query = `
      SELECT t.id_talleres, t.fecha, t.hora, t.lugar, t.estado, t.estado_sesion, t.id_programacion, t.id_empleado,
             pt.nombre_taller, pt.precio, pt.descripcion,
             pt.cupos,
             e.nombre_completo AS instructor_nombre,
             COUNT(m.id_matricula) FILTER (WHERE m.estado IN ('activa','pendiente_pago')) AS cupos_ocupados,
             STRING_AGG(DISTINCT mat.nombre_material, ', ' ORDER BY mat.nombre_material) AS materiales
      FROM talleres t
      JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
      LEFT JOIN empleados e ON t.id_empleado = e.id_empleado
      LEFT JOIN matricula m ON m.id_programacion = t.id_talleres
      LEFT JOIN materiales mat ON mat.id_programacion_taller = pt.id_programacion_taller AND mat.estado = TRUE
      WHERE 1=1
    `;
    const params = [];
    if (buscar) {
      params.push(`%${buscar}%`);
      query += ` AND (pt.nombre_taller ILIKE $1 OR e.nombre_completo ILIKE $1)`;
    }
    query += ' GROUP BY t.id_talleres, pt.id_programacion_taller, e.nombre_completo ORDER BY t.fecha ASC';
    const result = await pool.query(query, params);
    res.json({ talleres: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function listarInstructores(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id_empleado, nombre_completo, cargo
       FROM empleados
       WHERE LOWER(cargo) ILIKE '%instructor%'
       ORDER BY nombre_completo`
    );
    res.json({ instructores: result.rows });
  } catch (err) { next(err); }
}

export async function verificarDisponibilidad(req, res, next) {
  const { id_empleado, fecha, excluir_id } = req.query;
  if (!id_empleado || !fecha) return res.status(400).json({ mensaje: 'Empleado y fecha son requeridos' });
  try {
    let q = `
      SELECT t.id_talleres, pt.nombre_taller
      FROM talleres t
      JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
      WHERE t.id_empleado = $1 AND t.fecha = $2 AND t.estado = TRUE
    `;
    const params = [id_empleado, fecha];
    if (excluir_id) { q += ` AND t.id_talleres != $3`; params.push(excluir_id); }
    const result = await pool.query(q, params);
    res.json({ disponible: result.rows.length === 0, conflicto: result.rows[0] || null });
  } catch (err) { next(err); }
}

export async function crearTaller(req, res, next) {
  const { id_programacion, id_empleado, fecha, hora, lugar } = req.body;
  if (!id_programacion || !fecha) return res.status(400).json({ mensaje: 'La programación y la fecha son obligatorias' });
  if (!id_empleado) return res.status(400).json({ mensaje: 'El instructor es obligatorio' });
  try {
    const result = await pool.query(
      `INSERT INTO talleres (id_programacion, id_empleado, fecha, hora, lugar, estado, estado_sesion)
       VALUES ($1, $2, $3, $4, $5, TRUE, 'PROGRAMADO') RETURNING *`,
      [id_programacion, id_empleado, fecha, hora || null, lugar || null]
    );
    res.status(201).json({ mensaje: 'Taller publicado', taller: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarTaller(req, res, next) {
  const { fecha, hora, lugar, estado, id_empleado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE talleres SET
         fecha       = COALESCE($1, fecha),
         hora        = COALESCE($2, hora),
         lugar       = COALESCE($3, lugar),
         estado      = COALESCE($4, estado),
         id_empleado = COALESCE($5, id_empleado)
       WHERE id_talleres = $6 RETURNING *`,
      [fecha, hora || null, lugar || null, estado, id_empleado || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Taller no encontrado' });
    res.json({ mensaje: 'Taller actualizado', taller: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminarTaller(req, res, next) {
  try {
    const matriculas = await pool.query(
      `SELECT id_matricula FROM matricula WHERE id_programacion = $1 LIMIT 1`, [req.params.id]
    );
    if (matriculas.rows.length) return res.status(403).json({ mensaje: 'No se puede eliminar: tiene matrículas asociadas' });
    const result = await pool.query(`DELETE FROM talleres WHERE id_talleres = $1 RETURNING id_talleres`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Taller no encontrado' });
    res.json({ mensaje: 'Taller eliminado' });
  } catch (err) { next(err); }
}

export async function completarTaller(req, res, next) {
  const id = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tallerRes = await client.query(
      `SELECT t.estado_sesion, t.id_programacion FROM talleres t WHERE t.id_talleres = $1`, [id]
    );
    if (!tallerRes.rows.length) return res.status(404).json({ mensaje: 'Taller no encontrado' });
    if (tallerRes.rows[0].estado_sesion === 'COMPLETADO') {
      return res.status(409).json({ mensaje: 'Este taller ya fue completado' });
    }

    const id_programacion = tallerRes.rows[0].id_programacion;

    const materialesRes = await client.query(
      `SELECT m.id_insumo, m.cantidad, i.nombre, i.stock
       FROM materiales m
       JOIN insumos i ON m.id_insumo = i.id_insumos
       WHERE m.id_programacion_taller = $1 AND m.estado = TRUE AND m.id_insumo IS NOT NULL`,
      [id_programacion]
    );

    for (const mat of materialesRes.rows) {
      if (Number(mat.stock) < Number(mat.cantidad)) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          mensaje: `Stock insuficiente para "${mat.nombre}": disponible ${mat.stock}, requerido ${mat.cantidad}`
        });
      }
    }

    for (const mat of materialesRes.rows) {
      await client.query(`UPDATE insumos SET stock = stock - $1 WHERE id_insumos = $2`, [mat.cantidad, mat.id_insumo]);
    }

    await client.query(
      `UPDATE talleres SET estado_sesion = 'COMPLETADO', estado = FALSE WHERE id_talleres = $1`, [id]
    );

    const rolClienteRes = await client.query(`SELECT id_rol FROM roles WHERE LOWER(nombre) = 'cliente' LIMIT 1`);
    if (rolClienteRes.rows.length) {
      const id_rol_cliente = rolClienteRes.rows[0].id_rol;
      await client.query(`
        UPDATE usuarios u SET id_rol = $1
        FROM estudiantes est JOIN matricula m ON m.id_estudiante = est.id_estudiante
        WHERE m.id_programacion = $2 AND est.id_usuarios IS NOT NULL AND u.id_usuarios = est.id_usuarios
      `, [id_rol_cliente, id]);
      await client.query(`
        UPDATE clientes c SET id_rol = $1
        FROM estudiantes est JOIN matricula m ON m.id_estudiante = est.id_estudiante
        WHERE m.id_programacion = $2 AND est.id_usuarios IS NOT NULL AND c.id_usuarios = est.id_usuarios
      `, [id_rol_cliente, id]);
    }

    await client.query('COMMIT');
    res.json({ mensaje: 'Taller completado y stock descontado', materiales_descontados: materialesRes.rowCount });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}
