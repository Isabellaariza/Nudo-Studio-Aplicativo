// src/controllers/insumosController.js
import pool from '../config/db.js';

export async function listar(req, res, next) {
  try {
    const { buscar, id_categoria_insu } = req.query;
    let query = `
      SELECT i.id_insumos, i.nombre, i.unidad_medida,
             i.precio::numeric, i.stock::integer, i.stock_minimo, i.stock_maximo,
             i.estado, i.id_categoria_insu, i.id_proveedor,
             c.nombre AS categoria,
             p.nombre_empresa AS proveedor
      FROM insumos i
      JOIN categoria_insumos c ON i.id_categoria_insu = c.id_categoria_insu
      LEFT JOIN proveedores p ON i.id_proveedor = p.id_proveedor
      WHERE 1=1
    `;
    const params = [];
    if (buscar) {
      params.push(`%${buscar}%`);
      query += ` AND (i.nombre ILIKE $${params.length} OR c.nombre ILIKE $${params.length})`;
    }
    if (id_categoria_insu) {
      params.push(id_categoria_insu);
      query += ` AND i.id_categoria_insu = $${params.length}`;
    }
    query += ' ORDER BY i.nombre ASC NULLS LAST, i.id_insumos ASC';
    const result = await pool.query(query, params);
    res.json({ insumos: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function obtener(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT i.*, c.nombre AS categoria, p.nombre_empresa AS proveedor
       FROM insumos i
       JOIN categoria_insumos c ON i.id_categoria_insu = c.id_categoria_insu
       LEFT JOIN proveedores p ON i.id_proveedor = p.id_proveedor
       WHERE i.id_insumos = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Insumo no encontrado' });
    res.json({ insumo: result.rows[0] });
  } catch (err) { next(err); }
}

export async function crear(req, res, next) {
  const { nombre, unidad_medida, precio, stock, stock_minimo, stock_maximo, id_categoria_insu, id_proveedor } = req.body;
  if (!nombre || !id_categoria_insu) return res.status(400).json({ mensaje: 'Nombre y categoría son obligatorios' });
  try {
    const result = await pool.query(
      `INSERT INTO insumos (nombre, unidad_medida, precio, stock, stock_minimo, stock_maximo, id_categoria_insu, id_proveedor, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE) RETURNING *`,
      [nombre, unidad_medida || null, precio || 0, stock || 0, stock_minimo || 0, stock_maximo || 0, id_categoria_insu, id_proveedor || null]
    );
    res.status(201).json({ mensaje: 'Insumo creado', insumo: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizar(req, res, next) {
  const { nombre, unidad_medida, precio, stock, stock_minimo, stock_maximo, id_categoria_insu, id_proveedor, estado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE insumos SET
         nombre          = COALESCE($1, nombre),
         unidad_medida   = COALESCE($2, unidad_medida),
         precio          = COALESCE($3, precio),
         stock           = COALESCE($4::varchar, stock),
         stock_minimo    = COALESCE($5, stock_minimo),
         stock_maximo    = COALESCE($6, stock_maximo),
         id_categoria_insu = COALESCE($7, id_categoria_insu),
         id_proveedor    = COALESCE($8, id_proveedor),
         estado          = COALESCE($9, estado)
       WHERE id_insumos = $10 RETURNING *`,
      [nombre, unidad_medida, precio, stock != null ? String(stock) : null, stock_minimo, stock_maximo, id_categoria_insu, id_proveedor, estado, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Insumo no encontrado' });
    res.json({ mensaje: 'Insumo actualizado', insumo: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminar(req, res, next) {
  try {
    const result = await pool.query(`DELETE FROM insumos WHERE id_insumos = $1 RETURNING id_insumos`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Insumo no encontrado' });
    res.json({ mensaje: 'Insumo eliminado' });
  } catch (err) { next(err); }
}

export async function listarMovimientos(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT m.*, u.nombre AS usuario_nombre
       FROM movimientos_insumos m
       LEFT JOIN usuarios u ON m.id_usuario = u.id_usuarios
       WHERE m.id_insumo = $1
       ORDER BY m.fecha DESC`,
      [req.params.id]
    );
    res.json({ movimientos: result.rows });
  } catch (err) { next(err); }
}

export async function registrarMovimiento(req, res, next) {
  const { tipo, cantidad, motivo, observacion } = req.body;
  const id_insumo = req.params.id;
  if (!tipo || !cantidad) return res.status(400).json({ mensaje: 'tipo y cantidad son obligatorios' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insumoRes = await client.query(`SELECT stock FROM insumos WHERE id_insumos = $1 FOR UPDATE`, [id_insumo]);
    if (!insumoRes.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ mensaje: 'Insumo no encontrado' }); }
    const stock_anterior = Number(insumoRes.rows[0].stock);
    const stock_nuevo = tipo === 'ENTRADA' ? stock_anterior + Number(cantidad) : stock_anterior - Number(cantidad);
    if (stock_nuevo < 0) { await client.query('ROLLBACK'); return res.status(400).json({ mensaje: 'Stock insuficiente' }); }
    await client.query(`UPDATE insumos SET stock = $1 WHERE id_insumos = $2`, [String(stock_nuevo), id_insumo]);
    const result = await client.query(
      `INSERT INTO movimientos_insumos (id_insumo, tipo, cantidad, motivo, observacion, stock_anterior, stock_nuevo, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id_insumo, tipo, cantidad, motivo || null, observacion || null, stock_anterior, stock_nuevo, req.user?.id || null]
    );
    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Movimiento registrado', movimiento: result.rows[0] });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
}

export async function listarCategorias(req, res, next) {
  try {
    const result = await pool.query(`SELECT * FROM categoria_insumos WHERE estado = TRUE ORDER BY nombre`);
    res.json({ categorias: result.rows });
  } catch (err) { next(err); }
}

export async function crearCategoria(req, res, next) {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  try {
    const result = await pool.query(
      `INSERT INTO categoria_insumos (nombre, descripcion) VALUES ($1, $2) RETURNING *`,
      [nombre, descripcion]
    );
    res.status(201).json({ mensaje: 'Categoría creada', categoria: result.rows[0] });
  } catch (err) { next(err); }
}
