// src/controllers/comprasController.js
import pool from '../config/db.js';

// ══════════════════════════════════════════════════════════════
//  PROVEEDORES
// ══════════════════════════════════════════════════════════════

export async function listarProveedores(req, res, next) {
    try {
    const { buscar, estado } = req.query;
    let query = `
        SELECT p.*, COUNT(c.id_compras) AS total_compras,
                MAX(c.fecha_compra) AS ultima_compra
        FROM proveedores p
        LEFT JOIN compras c ON p.id_proveedor = c.id_proveedor
        WHERE 1=1
    `;
    const params = [];
    if (buscar) {
        params.push(`%${buscar}%`);
        query += ` AND (p.nombre_empresa ILIKE $${params.length} OR p.nit ILIKE $${params.length} OR p.email ILIKE $${params.length})`;
    }
    if (estado !== undefined && estado !== '') {
        params.push(estado === 'true');
        query += ` AND p.estado = $${params.length}`;
    }
    query += ' GROUP BY p.id_proveedor ORDER BY p.id_proveedor DESC';
    const result = await pool.query(query, params);
    res.json({ proveedores: result.rows, total: result.rowCount });
    } catch (err) { next(err); }
}

export async function obtenerProveedor(req, res, next) {
    try {
    const result = await pool.query(
        `SELECT p.*, COUNT(c.id_compras) AS total_compras,
                COALESCE(SUM(c.total), 0) AS total_gastado,
                MAX(c.fecha_compra) AS ultima_compra
        FROM proveedores p
        LEFT JOIN compras c ON p.id_proveedor = c.id_proveedor
        WHERE p.id_proveedor = $1
        GROUP BY p.id_proveedor`,
        [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
    res.json({ proveedor: result.rows[0] });
    } catch (err) { next(err); }
}

export async function crearProveedor(req, res, next) {
    const { nombre_empresa, nit, telefono, email, direccion } = req.body;
    if (!nombre_empresa) return res.status(400).json({ mensaje: 'El nombre de la empresa es obligatorio' });
    try {
    const result = await pool.query(
        `INSERT INTO proveedores (nombre_empresa, nit, telefono, email, direccion, estado)
        VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING *`,
        [nombre_empresa, nit || null, telefono || null, email || null, direccion || null]
    );
    res.status(201).json({ mensaje: 'Proveedor registrado', proveedor: result.rows[0] });
    } catch (err) { next(err); }
}

export async function actualizarProveedor(req, res, next) {
    const { nombre_empresa, nit, telefono, email, direccion, estado } = req.body;
    try {
    const result = await pool.query(
        `UPDATE proveedores SET
            nombre_empresa = COALESCE($1, nombre_empresa),
            nit            = COALESCE($2, nit),
            telefono       = COALESCE($3, telefono),
            email          = COALESCE($4, email),
            direccion      = COALESCE($5, direccion),
            estado         = COALESCE($6, estado)
        WHERE id_proveedor = $7 RETURNING *`,
        [nombre_empresa, nit, telefono, email, direccion, estado, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
    res.json({ mensaje: 'Proveedor actualizado', proveedor: result.rows[0] });
    } catch (err) { next(err); }
}

export async function eliminarProveedor(req, res, next) {
    try {
    const compras = await pool.query(`SELECT id_compras FROM compras WHERE id_proveedor = $1 LIMIT 1`, [req.params.id]);
    if (compras.rows.length) return res.status(403).json({ mensaje: 'No se puede eliminar: el proveedor tiene compras registradas' });
    await pool.query(`DELETE FROM proveedores WHERE id_proveedor = $1`, [req.params.id]);
    res.json({ mensaje: 'Proveedor eliminado' });
    } catch (err) { next(err); }
}

export async function listarProductosComprados(req, res, next) {
    try {
    const result = await pool.query(`
        SELECT dc.id_detalle, dc.nombre_producto, dc.precio_unitario,
               c.fecha_compra, c.id_compras,
               p.nombre_empresa AS proveedor, p.id_proveedor
        FROM detalle_compras dc
        JOIN compras c ON dc.id_compras = c.id_compras
        LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
        WHERE c.estado = TRUE
        ORDER BY c.fecha_compra DESC, dc.nombre_producto ASC
    `);
    res.json({ productos: result.rows });
    } catch (err) { next(err); }
}


export async function listarCompras(req, res, next) {
    try {
    const { buscar, estado } = req.query;
    let query = `
        SELECT c.id_compras, c.fecha_compra, c.total, c.estado, c.registro_compra, c.factura_url,
               p.nombre_empresa AS proveedor, p.id_proveedor
        FROM compras c
        LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
        WHERE 1=1
    `;
    const params = [];
    if (buscar) {
        params.push(`%${buscar}%`);
        query += ` AND (p.nombre_empresa ILIKE $${params.length} OR c.registro_compra ILIKE $${params.length})`;
    }
    if (estado !== undefined && estado !== '') {
        params.push(estado === 'true');
        query += ` AND c.estado = $${params.length}`;
    }
    query += ' ORDER BY c.fecha_compra DESC';
    const result = await pool.query(query, params);

    // Cargar detalles de cada compra
    const ids = result.rows.map(r => r.id_compras);
    let detalles = [];
    if (ids.length) {
      const det = await pool.query(
        `SELECT * FROM detalle_compras WHERE id_compras = ANY($1)`, [ids]
      );
      detalles = det.rows;
    }
    const compras = result.rows.map(c => ({
      ...c,
      productos: detalles.filter(d => d.id_compras === c.id_compras),
    }));

    res.json({ compras, total: result.rowCount });
    } catch (err) { next(err); }
}

export async function obtenerCompra(req, res, next) {
    try {
    const result = await pool.query(
        `SELECT c.*, p.nombre_empresa AS proveedor
        FROM compras c
        LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
        WHERE c.id_compras = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Compra no encontrada' });
    res.json({ compra: result.rows[0] });
    } catch (err) { next(err); }
}

export async function crearCompra(req, res, next) {
    const { id_proveedor, fecha_compra, total, registro_compra, factura_url, productos } = req.body;
    if (!id_proveedor || !total) return res.status(400).json({ mensaje: 'Proveedor y total son obligatorios' });
    const client = await pool.connect();
    try {
    await client.query('BEGIN');
    const result = await client.query(
        `INSERT INTO compras (id_proveedor, fecha_compra, total, estado, registro_compra, factura_url)
         VALUES ($1, $2, $3, TRUE, $4, $5) RETURNING *`,
        [id_proveedor, fecha_compra || new Date(), total, registro_compra || null, factura_url || null]
    );
    const compra = result.rows[0];
    if (Array.isArray(productos) && productos.length) {
      for (const p of productos) {
        await client.query(
          `INSERT INTO detalle_compras (id_compras, nombre_producto, cantidad, precio_unitario) VALUES ($1,$2,$3,$4)`,
          [compra.id_compras, p.nombre_producto, p.cantidad, p.precio_unitario]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Compra registrada', compra });
    } catch (err) { await client.query('ROLLBACK'); next(err); }
    finally { client.release(); }
}

export async function actualizarEstadoCompra(req, res, next) {
    const { estado, total, registro_compra, fecha_compra, id_proveedor, factura_url, productos } = req.body;
    const client = await pool.connect();
    try {
    await client.query('BEGIN');
    const result = await client.query(
        `UPDATE compras SET
            estado          = COALESCE($1, estado),
            total           = COALESCE($2, total),
            registro_compra = COALESCE($3, registro_compra),
            fecha_compra    = COALESCE($4, fecha_compra),
            id_proveedor    = COALESCE($5, id_proveedor),
            factura_url     = COALESCE($6, factura_url)
        WHERE id_compras = $7 RETURNING *`,
        [estado, total, registro_compra, fecha_compra, id_proveedor, factura_url, req.params.id]
    );
    if (!result.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ mensaje: 'Compra no encontrada' }); }
    if (Array.isArray(productos)) {
      await client.query(`DELETE FROM detalle_compras WHERE id_compras = $1`, [req.params.id]);
      for (const p of productos) {
        await client.query(
          `INSERT INTO detalle_compras (id_compras, nombre_producto, cantidad, precio_unitario) VALUES ($1,$2,$3,$4)`,
          [req.params.id, p.nombre_producto, p.cantidad, p.precio_unitario]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ mensaje: 'Compra actualizada', compra: result.rows[0] });
    } catch (err) { await client.query('ROLLBACK'); next(err); }
    finally { client.release(); }
}

export async function anularCompra(req, res, next) {
    try {
    const result = await pool.query(
        `UPDATE compras SET estado = FALSE WHERE id_compras = $1 RETURNING id_compras`,
        [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Compra no encontrada' });
    res.json({ mensaje: 'Compra anulada' });
    } catch (err) { next(err); }
}