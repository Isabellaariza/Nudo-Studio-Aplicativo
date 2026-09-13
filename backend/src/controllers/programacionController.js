import pool from '../config/db.js';

export async function listarProgramacion(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT pt.id_programacion_taller, pt.nombre_taller,
             pt.precio, pt.descripcion, pt.estado,
             COUNT(DISTINCT m.id_insumo) AS total_materiales
      FROM programacion_talleres pt
      LEFT JOIN materiales m ON m.id_programacion_taller = pt.id_programacion_taller AND m.estado = TRUE
      GROUP BY pt.id_programacion_taller
      ORDER BY pt.nombre_taller ASC
    `);
    res.json({ programaciones: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function crearProgramacion(req, res, next) {
  const { nombre_taller, precio, descripcion } = req.body;
  if (!nombre_taller) return res.status(400).json({ mensaje: 'El nombre del taller es obligatorio' });
  try {
    const result = await pool.query(
      `INSERT INTO programacion_talleres (nombre_taller, precio, descripcion, estado)
       VALUES ($1, $2, $3, TRUE) RETURNING *`,
      [nombre_taller, precio || 0, descripcion || null]
    );
    res.status(201).json({ mensaje: 'Programación creada', programacion: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarProgramacion(req, res, next) {
  const { nombre_taller, precio, descripcion, estado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE programacion_talleres SET
         nombre_taller = COALESCE($1, nombre_taller),
         precio        = COALESCE($2, precio),
         descripcion   = COALESCE($3, descripcion),
         estado        = COALESCE($4, estado)
       WHERE id_programacion_taller = $5 RETURNING *`,
      [nombre_taller, precio, descripcion, estado, req.params.id]
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
