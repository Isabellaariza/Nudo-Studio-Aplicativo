import pool from '../config/db.js';

export async function listarMateriales(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT m.id_materiales, m.nombre_material, m.cantidad, m.costo_total,
             m.estado, m.unidad_medida, m.id_proveedor, m.id_programacion_taller, m.id_insumo,
             p.nombre_empresa AS proveedor,
             pt.nombre_taller,
             i.nombre AS insumo_nombre, i.stock AS insumo_stock
      FROM materiales m
      LEFT JOIN proveedores p ON m.id_proveedor = p.id_proveedor
      LEFT JOIN programacion_talleres pt ON m.id_programacion_taller = pt.id_programacion_taller
      LEFT JOIN insumos i ON m.id_insumo = i.id_insumos
      ORDER BY m.nombre_material ASC
    `);
    res.json({ materiales: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function listarInsumosParaMateriales(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT id_insumos, nombre, unidad_medida, precio, stock
      FROM insumos
      WHERE estado = TRUE
      ORDER BY nombre ASC
    `);
    res.json({ insumos: result.rows });
  } catch (err) { next(err); }
}

export async function crearMaterial(req, res, next) {
  const { nombre_material, cantidad, costo_total, unidad_medida, id_proveedor, id_programacion_taller, id_insumo } = req.body;
  if (!nombre_material) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  try {
    const result = await pool.query(
      `INSERT INTO materiales (nombre_material, cantidad, costo_total, estado, unidad_medida, id_proveedor, id_programacion_taller, id_insumo)
       VALUES ($1, $2, $3, TRUE, $4, $5, $6, $7) RETURNING *`,
      [nombre_material, cantidad || 0, costo_total || 0, unidad_medida || null, id_proveedor || null, id_programacion_taller || null, id_insumo || null]
    );
    res.status(201).json({ mensaje: 'Material creado', material: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarMaterial(req, res, next) {
  const { nombre_material, cantidad, costo_total, estado, unidad_medida, id_proveedor, id_programacion_taller, id_insumo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE materiales SET
         nombre_material        = COALESCE($1, nombre_material),
         cantidad               = COALESCE($2, cantidad),
         costo_total            = COALESCE($3, costo_total),
         estado                 = COALESCE($4, estado),
         unidad_medida          = COALESCE($5, unidad_medida),
         id_proveedor           = $6,
         id_programacion_taller = COALESCE($7, id_programacion_taller),
         id_insumo              = $8
       WHERE id_materiales = $9 RETURNING *`,
      [nombre_material, cantidad, costo_total, estado, unidad_medida, id_proveedor || null, id_programacion_taller, id_insumo || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Material no encontrado' });
    res.json({ mensaje: 'Material actualizado', material: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminarMaterial(req, res, next) {
  try {
    await pool.query(`UPDATE materiales SET estado = FALSE WHERE id_materiales = $1`, [req.params.id]);
    res.json({ mensaje: 'Material desactivado' });
  } catch (err) { next(err); }
}
