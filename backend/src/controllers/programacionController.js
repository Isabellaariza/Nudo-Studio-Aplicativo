import pool from '../config/db.js';

export async function listarProgramacion(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT pt.id_programacion_taller, pt.nombre_taller, pt.nombre_instructor,
             pt.precio, pt.descripcion, pt.estado, pt.id_empleado,
             e.nombre_completo AS instructor_nombre,
             COUNT(DISTINCT m.id_insumo) AS total_materiales
      FROM programacion_talleres pt
      LEFT JOIN empleados e ON pt.id_empleado = e.id_empleado
      LEFT JOIN materiales m ON m.id_programacion_taller = pt.id_programacion_taller AND m.estado = TRUE
      GROUP BY pt.id_programacion_taller, e.nombre_completo
      ORDER BY pt.nombre_taller ASC
    `);
    res.json({ programaciones: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function crearProgramacion(req, res, next) {
  const { nombre_taller, nombre_instructor, precio, descripcion, id_empleado } = req.body;
  if (!nombre_taller) return res.status(400).json({ mensaje: 'El nombre del taller es obligatorio' });
  try {
    let instructor = nombre_instructor;
    if (id_empleado && !instructor) {
      const emp = await pool.query(`SELECT nombre_completo FROM empleados WHERE id_empleado = $1`, [id_empleado]);
      instructor = emp.rows[0]?.nombre_completo || '';
    }
    const result = await pool.query(
      `INSERT INTO programacion_talleres (nombre_taller, nombre_instructor, precio, descripcion, estado, id_empleado)
       VALUES ($1, $2, $3, $4, TRUE, $5) RETURNING *`,
      [nombre_taller, instructor || null, precio || 0, descripcion || null, id_empleado || null]
    );
    res.status(201).json({ mensaje: 'Programación creada', programacion: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarProgramacion(req, res, next) {
  const { nombre_taller, nombre_instructor, precio, descripcion, estado, id_empleado } = req.body;
  try {
    let instructor = nombre_instructor;
    if (id_empleado && !instructor) {
      const emp = await pool.query(`SELECT nombre_completo FROM empleados WHERE id_empleado = $1`, [id_empleado]);
      instructor = emp.rows[0]?.nombre_completo || '';
    }
    const result = await pool.query(
      `UPDATE programacion_talleres SET
         nombre_taller     = COALESCE($1, nombre_taller),
         nombre_instructor = COALESCE($2, nombre_instructor),
         precio            = COALESCE($3, precio),
         descripcion       = COALESCE($4, descripcion),
         estado            = COALESCE($5, estado),
         id_empleado       = COALESCE($6, id_empleado)
       WHERE id_programacion_taller = $7 RETURNING *`,
      [nombre_taller, instructor, precio, descripcion, estado, id_empleado || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Programación no encontrada' });
    res.json({ mensaje: 'Programación actualizada', programacion: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminarProgramacion(req, res, next) {
  try {
    const talleres = await pool.query(
      `SELECT id_talleres FROM talleres WHERE id_programacion = $1 LIMIT 1`, [req.params.id]
    );
    if (talleres.rows.length) return res.status(403).json({ mensaje: 'No se puede eliminar: tiene talleres publicados asociados' });
    await pool.query(`DELETE FROM programacion_talleres WHERE id_programacion_taller = $1`, [req.params.id]);
    res.json({ mensaje: 'Programación eliminada' });
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
      WHERE pt.id_empleado = $1 AND t.fecha = $2 AND t.estado = TRUE
    `;
    const params = [id_empleado, fecha];
    if (excluir_id) { q += ` AND t.id_talleres != $3`; params.push(excluir_id); }
    const result = await pool.query(q, params);
    res.json({ disponible: result.rows.length === 0, conflicto: result.rows[0] || null });
  } catch (err) { next(err); }
}
