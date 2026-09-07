import pool from '../config/db.js';

// ── LISTAR DESCUENTOS ─────────────────────────────────────────────────────────
export async function listarDescuentos(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT d.id_descuento, d.id_producto, d.cantidad_minima, d.porcentaje,
             d.activo, d.created_at,
             p.nombre_producto AS producto, p.precio AS precio_producto,
             p.imagen_url AS imagen_producto
      FROM descuentos_producto d
      LEFT JOIN productos p ON d.id_producto = p.id_productos
      ORDER BY d.created_at DESC
    `);
    res.json({ descuentos: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

// ── OBTENER DESCUENTOS PARA UN PRODUCTO ESPECÍFICO (público) ─────────────────
export async function descuentosProducto(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT id_descuento, id_producto, cantidad_minima, porcentaje
      FROM descuentos_producto
      WHERE id_producto = $1 AND activo = TRUE
      ORDER BY cantidad_minima ASC
    `, [req.params.id_producto]);
    res.json({ descuentos: result.rows });
  } catch (err) { next(err); }
}

// ── OBTENER TODOS LOS DESCUENTOS ACTIVOS (público, para el carrito) ───────────
export async function descuentosActivos(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT d.id_descuento, d.id_producto, d.cantidad_minima, d.porcentaje,
             p.nombre_producto AS producto, p.precio AS precio_producto
      FROM descuentos_producto d
      LEFT JOIN productos p ON d.id_producto = p.id_productos
      WHERE d.activo = TRUE
      ORDER BY d.id_producto, d.cantidad_minima ASC
    `);
    res.json({ descuentos: result.rows });
  } catch (err) { next(err); }
}

// ── CREAR DESCUENTO ───────────────────────────────────────────────────────────
export async function crearDescuento(req, res, next) {
  const { id_producto, cantidad_minima, porcentaje, activo } = req.body;
  if (!id_producto) return res.status(400).json({ mensaje: 'El producto es obligatorio' });
  if (!cantidad_minima || Number(cantidad_minima) < 1) return res.status(400).json({ mensaje: 'La cantidad mínima debe ser al menos 1' });
  if (!porcentaje || Number(porcentaje) <= 0 || Number(porcentaje) > 100) return res.status(400).json({ mensaje: 'El porcentaje debe estar entre 1 y 100' });

  try {
    const result = await pool.query(
      `INSERT INTO descuentos_producto (id_producto, cantidad_minima, porcentaje, activo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_producto, cantidad_minima, porcentaje, activo !== false]
    );
    res.status(201).json({ mensaje: 'Descuento creado', descuento: result.rows[0] });
  } catch (err) { next(err); }
}

// ── ACTUALIZAR DESCUENTO ──────────────────────────────────────────────────────
export async function actualizarDescuento(req, res, next) {
  const { id_producto, cantidad_minima, porcentaje, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE descuentos_producto SET
         id_producto     = COALESCE($1, id_producto),
         cantidad_minima = COALESCE($2, cantidad_minima),
         porcentaje      = COALESCE($3, porcentaje),
         activo          = COALESCE($4, activo)
       WHERE id_descuento = $5 RETURNING *`,
      [id_producto, cantidad_minima, porcentaje, activo, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Descuento no encontrado' });
    res.json({ mensaje: 'Descuento actualizado', descuento: result.rows[0] });
  } catch (err) { next(err); }
}

// ── ELIMINAR DESCUENTO ────────────────────────────────────────────────────────
export async function eliminarDescuento(req, res, next) {
  try {
    const result = await pool.query(
      `DELETE FROM descuentos_producto WHERE id_descuento = $1 RETURNING id_descuento`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Descuento no encontrado' });
    res.json({ mensaje: 'Descuento eliminado' });
  } catch (err) { next(err); }
}
