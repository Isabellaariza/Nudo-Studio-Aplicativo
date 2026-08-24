import pool from '../config/db.js';

export async function listar(req, res, next) {
  try {
    const { buscar, id_categoria } = req.query;
    let query = `
      SELECT p.id_productos, p.nombre_producto, p.precio, p.stock,
             p.descripcion, p.id_categoria_prod, p.imagen_url,
             c.nombre AS categoria
      FROM productos p
      LEFT JOIN categoria_productos c ON p.id_categoria_prod = c.id_categoria_prod
      WHERE 1=1
    `;
    const params = [];
    if (buscar) {
      params.push(`%${buscar}%`);
      query += ` AND p.nombre_producto ILIKE $${params.length}`;
    }
    if (id_categoria) {
      params.push(id_categoria);
      query += ` AND p.id_categoria_prod = $${params.length}`;
    }
    query += ' ORDER BY p.id_productos DESC';
    const result = await pool.query(query, params);
    res.json({ productos: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function obtener(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categoria_productos c ON p.id_categoria_prod = c.id_categoria_prod
       WHERE p.id_productos = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Producto no encontrado' });
    res.json({ producto: result.rows[0] });
  } catch (err) { next(err); }
}

export async function crear(req, res, next) {
  const { nombre_producto, precio, stock, descripcion, id_categoria_prod, imagen_url } = req.body;
  if (!nombre_producto || !precio) return res.status(400).json({ mensaje: 'Nombre y precio son obligatorios' });
  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre_producto, precio, stock, descripcion, id_categoria_prod, imagen_url, id_usuarios)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre_producto, precio, stock || 0, descripcion, id_categoria_prod || null, imagen_url || null, req.usuario.id]
    );
    res.status(201).json({ mensaje: 'Producto creado', producto: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizar(req, res, next) {
  const { nombre_producto, precio, stock, descripcion, id_categoria_prod, imagen_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE productos SET
         nombre_producto   = COALESCE($1, nombre_producto),
         precio            = COALESCE($2, precio),
         stock             = COALESCE($3, stock),
         descripcion       = COALESCE($4, descripcion),
         id_categoria_prod = COALESCE($5, id_categoria_prod),
         imagen_url        = COALESCE($6, imagen_url)
       WHERE id_productos = $7 RETURNING *`,
      [nombre_producto, precio, stock, descripcion, id_categoria_prod, imagen_url, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto actualizado', producto: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminar(req, res, next) {
  try {
    const result = await pool.query(
      `DELETE FROM productos WHERE id_productos = $1 RETURNING id_productos`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) { next(err); }
}

export async function listarCategorias(req, res, next) {
  try {
    const result = await pool.query(`SELECT * FROM categoria_productos ORDER BY nombre`);
    res.json({ categorias: result.rows });
  } catch (err) { next(err); }
}

export async function crearCategoria(req, res, next) {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  try {
    const result = await pool.query(
      `INSERT INTO categoria_productos (nombre, descripcion) VALUES ($1, $2) RETURNING *`,
      [nombre, descripcion || null]
    );
    res.status(201).json({ mensaje: 'Categoría creada', categoria: result.rows[0] });
  } catch (err) { next(err); }
}
