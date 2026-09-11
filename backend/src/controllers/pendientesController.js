import { enviarCorreoPedidoCompletado } from '../config/email.js';
import pool from '../config/db.js';

// ══════════════════════════════════════════════════════════════
//  ROLES Y PERMISOS
// ══════════════════════════════════════════════════════════════

// src/controllers/pendientesController.js

export async function listarRoles(req, res, next) {
  try {
    const result = await pool.query(`SELECT * FROM roles ORDER BY id_rol`);
    res.json(result.rows);
  } catch (err) { next(err); }
}

export async function eliminarRol(req, res, next) {
  try {
    const verif = await pool.query(`SELECT nombre FROM roles WHERE id_rol = $1`, [req.params.id]);
    if (!verif.rows.length) return res.status(404).json({ mensaje: 'Rol no encontrado' });
    if (verif.rows[0].nombre.toLowerCase() === 'administrador')
      return res.status(403).json({ mensaje: 'El rol Administrador no puede eliminarse' });
    await pool.query(`DELETE FROM roles WHERE id_rol = $1`, [req.params.id]);
    res.json({ mensaje: 'Rol eliminado' });
  } catch (err) { next(err); }
}

export async function crearRol(req, res, next) {
  const { nombre, descripcion, permisos } = req.body;
  if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  
  try {
    const result = await pool.query(
      `INSERT INTO roles (nombre, permisos, estado) 
       VALUES ($1, $2, true) RETURNING *`,
      [nombre.toLowerCase(), permisos || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
}

export async function actualizarRol(req, res, next) {
  const { nombre, permisos, activo } = req.body;
  try {
    // 🛡️ Candado Backend: Verificar si es el administrador antes de alterar algo
    const verif = await pool.query(`SELECT nombre FROM roles WHERE id_rol = $1`, [req.params.id]);
    if (verif.rows.length && verif.rows[0].nombre.toLowerCase() === 'administrador') {
      const permisosAdmin = ['Configuración', 'Usuarios', 'Compras', 'Producción', 'Talleres', 'Ventas'];
      const result = await pool.query(
        `UPDATE roles 
         SET permisos = $1, 
             estado = true 
         WHERE id_rol = $2 RETURNING *`,
        [permisosAdmin, req.params.id]
      );
      return res.json(result.rows[0]);
    }

    // Lógica normal para los demás roles usando 'nombre' y 'estado'
    const result = await pool.query(
      `UPDATE roles 
       SET nombre = COALESCE($1, nombre), 
           permisos = COALESCE($2, permisos), 
           estado = COALESCE($3, estado) 
       WHERE id_rol = $4 RETURNING *`,
      [nombre, permisos, activo, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Rol no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

// ══════════════════════════════════════════════════════════════
//  CATEGORÍAS DE PRODUCTOS
// ══════════════════════════════════════════════════════════════

export async function listarCategoriasProductos(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT c.id_categoria_prod, c.nombre, c.descripcion, c.estado,
              COUNT(p.id_productos) AS total_productos
       FROM categoria_productos c
       LEFT JOIN productos p ON c.id_categoria_prod = p.id_categoria_prod
       GROUP BY c.id_categoria_prod ORDER BY c.nombre`
    );
    res.json({ categorias: result.rows });
  } catch (err) { next(err); }
}

export async function crearCategoriaProducto(req, res, next) {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  try {
    const existe = await pool.query(`SELECT id_categoria_prod FROM categoria_productos WHERE LOWER(nombre) = LOWER($1)`, [nombre]);
    if (existe.rows.length) return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre' });
    const result = await pool.query(
      `INSERT INTO categoria_productos (nombre, descripcion, estado) VALUES ($1, $2, TRUE) RETURNING *`,
      [nombre, descripcion || null]
    );
    res.status(201).json({ mensaje: 'Categoría creada', categoria: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarCategoriaProducto(req, res, next) {
  const { nombre, descripcion, estado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE categoria_productos SET
         nombre      = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         estado      = COALESCE($3, estado)
       WHERE id_categoria_prod = $4 RETURNING *`,
      [nombre, descripcion, estado, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    res.json({ mensaje: 'Categoría actualizada', categoria: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminarCategoriaProducto(req, res, next) {
  try {
    const productos = await pool.query(`SELECT id_productos FROM productos WHERE id_categoria_prod = $1 LIMIT 1`, [req.params.id]);
    if (productos.rows.length) return res.status(403).json({ mensaje: 'No se puede eliminar: la categoría tiene productos asociados' });
    await pool.query(`DELETE FROM categoria_productos WHERE id_categoria_prod = $1`, [req.params.id]);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (err) { next(err); }
}

// ══════════════════════════════════════════════════════════════
//  CATEGORÍAS DE INSUMOS
// ══════════════════════════════════════════════════════════════

export async function listarCategoriasInsumos(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id_categoria_insu, nombre, descripcion, estado,
              (SELECT COUNT(*) FROM insumos i WHERE i.id_categoria_insu = c.id_categoria_insu) AS total_insumos
       FROM categoria_insumos c
       ORDER BY nombre`
    );
    res.json({ categorias: result.rows });
  } catch (err) { next(err); }
}

export async function crearCategoriaInsumo(req, res, next) {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  try {
    const existe = await pool.query(`SELECT id_categoria_insu FROM categoria_insumos WHERE LOWER(nombre) = LOWER($1)`, [nombre]);
    if (existe.rows.length) return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre' });
    const result = await pool.query(
      `INSERT INTO categoria_insumos (nombre, descripcion, estado) VALUES ($1, $2, TRUE) RETURNING *`,
      [nombre, descripcion || null]
    );
    res.status(201).json({ mensaje: 'Categoría creada', categoria: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarCategoriaInsumo(req, res, next) {
  const { nombre, descripcion, estado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE categoria_insumos SET
         nombre      = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         estado      = COALESCE($3, estado)
       WHERE id_categoria_insu = $4 RETURNING *`,
      [nombre, descripcion, estado, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    res.json({ mensaje: 'Categoría actualizada', categoria: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminarCategoriaInsumo(req, res, next) {
  try {
    const insumos = await pool.query(`SELECT id_insumos FROM insumos WHERE id_categoria_insu = $1 LIMIT 1`, [req.params.id]);
    if (insumos.rows.length) return res.status(403).json({ mensaje: 'No se puede eliminar: la categoría tiene insumos asociados' });
    await pool.query(`DELETE FROM categoria_insumos WHERE id_categoria_insu = $1`, [req.params.id]);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (err) { next(err); }
}

// ══════════════════════════════════════════════════════════════
//  PRODUCCIÓN
// ══════════════════════════════════════════════════════════════

export async function listarProduccion(req, res, next) {
  try {
    const manualRes = await pool.query(`
      SELECT 
        CONCAT('manual_', pr.id_produccion) AS id_global,
        pr.id_produccion,
        NULL AS id_pedidos,
        pr.fecha_produccion,
        pr.fecha_entrega,
        pr.estado,
        pr.cantidad,
        pr.observaciones,
        p.nombre_producto AS producto,
        p.id_productos,
        'Manual' AS tipo_origen
      FROM produccion pr
      LEFT JOIN productos p ON pr.id_productos = p.id_productos
      ORDER BY pr.fecha_produccion DESC
    `);

    const pedidosRes = await pool.query(`
      SELECT 
        CONCAT('pedido_', p.id_pedidos) AS id_global,
        NULL AS id_produccion,
        p.id_pedidos,
        p.created_at AS fecha_produccion,
        p.fecha_entrega,
        CASE 
          WHEN p.estado = 'EN_PRODUCCION' THEN 'en_proceso'
          WHEN p.estado = 'COMPLETADO' THEN 'completado'
          ELSE 'cancelado'
        END AS estado,
        p.total,
        c.nombre_completo AS cliente,
        c.email AS cliente_email,
        STRING_AGG(CONCAT(pr2.nombre_producto, ' (', d.cantidad::INT, ')'), ', ') AS producto,
        NULL AS id_productos,
        'Pedido' AS tipo_origen
      FROM pedidos p
      JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN detalle_pedido d ON p.id_pedidos = d.id_pedidos
      LEFT JOIN productos pr2 ON d.id_producto = pr2.id_productos
      WHERE p.estado IN ('EN_PRODUCCION', 'COMPLETADO')
      GROUP BY p.id_pedidos, c.nombre_completo, c.email
      ORDER BY p.created_at DESC
    `);

    res.json({ 
      ordenes: manualRes.rows,
      pedidos: pedidosRes.rows,
      total: manualRes.rowCount + pedidosRes.rowCount
    });

  } catch (err) { next(err); }
}

export async function crearProduccion(req, res, next) {
  const { fecha_produccion, id_usuarios, id_productos, cantidad, motivo, observaciones, insumos } = req.body;
  
  if (!id_productos) return res.status(400).json({ mensaje: 'El producto es obligatorio' });
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resultProduccion = await client.query(
      `INSERT INTO produccion (fecha_produccion, estado, id_usuarios, id_productos, cantidad, observaciones)
       VALUES ($1, 'en_proceso', $2, $3, $4, $5) RETURNING *`,
      [fecha_produccion || new Date(), id_usuarios || null, id_productos, cantidad || 1, observaciones || motivo || null]
    );
    
    const nuevaProduccion = resultProduccion.rows[0];
    const id_produccion = nuevaProduccion.id_produccion;

    if (insumos && insumos.length > 0) {
      for (const item of insumos) {
        const { id_insumo, cantidad: cantidadGasta } = item;
        await client.query(
          `INSERT INTO produccion_insumos (id_produccion, id_insumos, cantidad_gastada)
           VALUES ($1, $2, $3)`,
          [id_produccion, id_insumo, cantidadGasta]
        );
        const stockRes = await client.query(`SELECT stock::numeric AS stock FROM insumos WHERE id_insumos = $1`, [id_insumo]);
        const stock_anterior = Number(stockRes.rows[0]?.stock || 0);
        const stock_nuevo = stock_anterior - Number(cantidadGasta);
        await client.query(
          `UPDATE insumos SET stock = $1::varchar WHERE id_insumos = $2`,
          [stock_nuevo, id_insumo]
        );
        await client.query(
          `INSERT INTO movimientos_insumos (id_insumo, tipo, cantidad, motivo, stock_anterior, stock_nuevo)
           VALUES ($1, 'SALIDA', $2, $3, $4, $5)`,
          [id_insumo, cantidadGasta, observaciones || motivo || 'Producción manual', stock_anterior, stock_nuevo]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ 
      mensaje: 'Orden de producción creada e insumos descontados con éxito', 
      produccion: nuevaProduccion 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function actualizarProduccion(req, res, next) {
  const { estado, fecha_produccion, id_usuarios, id_productos, cantidad, productos } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let result;
    if (estado === 'completado') {
      result = await client.query(
        `UPDATE produccion SET
           estado           = 'completado',
           fecha_entrega    = NOW(),
           fecha_produccion = COALESCE($1, fecha_produccion),
           id_usuarios      = COALESCE($2, id_usuarios),
           id_productos     = COALESCE($3, id_productos),
           cantidad         = COALESCE($4, cantidad)
         WHERE id_produccion = $5 RETURNING *`,
        [fecha_produccion, id_usuarios, id_productos, cantidad, req.params.id]
      );
      if (!result.rows.length) throw new Error('Orden no encontrada');

      // Si vienen productos seleccionados en el modal, sumar su stock
      if (productos && productos.length > 0) {
        for (const p of productos) {
          await client.query(
            `UPDATE productos SET stock = COALESCE(stock::numeric, 0) + $1 WHERE id_productos = $2`,
            [p.cantidad, p.id_producto]
          );
        }
      } else {
        // Fallback: sumar stock del producto de la orden
        const orden = result.rows[0];
        if (orden.id_productos && orden.cantidad) {
          await client.query(
            `UPDATE productos SET stock = COALESCE(stock::numeric, 0) + $1 WHERE id_productos = $2`,
            [orden.cantidad, orden.id_productos]
          );
        }
      }
    } else {
      result = await client.query(
        `UPDATE produccion SET
           estado           = COALESCE($1, estado),
           fecha_produccion = COALESCE($2, fecha_produccion),
           id_usuarios      = COALESCE($3, id_usuarios),
           id_productos     = COALESCE($4, id_productos),
           cantidad         = COALESCE($5, cantidad)
         WHERE id_produccion = $6 RETURNING *`,
        [estado, fecha_produccion, id_usuarios, id_productos, cantidad, req.params.id]
      );
      if (!result.rows.length) throw new Error('Orden no encontrada');
    }

    await client.query('COMMIT');
    res.json({ mensaje: 'Orden actualizada', produccion: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// Cancelar un pedido que está en producción (regresa a RECHAZADO)
export async function cancelarPedidoProduccion(req, res, next) {
  try {
    const result = await pool.query(
      `UPDATE pedidos SET estado = 'RECHAZADO' WHERE id_pedidos = $1 AND estado = 'EN_PRODUCCION' RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Pedido no encontrado o no está en producción' });
    res.json({ mensaje: 'Pedido cancelado de producción', pedido: result.rows[0] });
  } catch (err) { next(err); }
}

// Completar un pedido desde producción (marca pedido como COMPLETADO, sin tocar stock)
export async function completarPedidoProduccion(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE pedidos SET estado = 'COMPLETADO', fecha_entrega = NOW() WHERE id_pedidos = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) throw new Error('Pedido no encontrado');
    await client.query('COMMIT');

    const pedidoInfo = await pool.query(
      `SELECT c.nombre_completo AS cliente, c.email,
              STRING_AGG(CONCAT(pr.nombre_producto, ' (', d.cantidad::INT, ')'), ', ') AS producto
       FROM pedidos p
       JOIN clientes c ON p.id_cliente = c.id_cliente
       LEFT JOIN detalle_pedido d ON p.id_pedidos = d.id_pedidos
       LEFT JOIN productos pr ON d.id_producto = pr.id_productos
       WHERE p.id_pedidos = $1 GROUP BY c.nombre_completo, c.email`, [req.params.id]
    );
    if (pedidoInfo.rows.length && pedidoInfo.rows[0].email) {
      const { cliente, email, producto } = pedidoInfo.rows[0];
      enviarCorreoPedidoCompletado({
        email, nombre: cliente,
        numeroPedido: `PED-${String(req.params.id).padStart(4,'0')}`,
        producto: producto || 'Productos de Macramé'
      }).catch(() => {});
    }
    res.json({ mensaje: 'Pedido completado', pedido: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// Agregar productos terminados a un pedido en producción
export async function agregarProductosPedido(req, res, next) {
  const { id } = req.params;
  const { productos } = req.body;
  if (!productos || !productos.length) return res.status(400).json({ mensaje: 'Debes enviar al menos un producto' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE pedidos SET estado = 'COMPLETADO', fecha_entrega = NOW() WHERE id_pedidos = $1 RETURNING *`,
      [id]
    );
    if (!result.rows.length) throw new Error('Pedido no encontrado');

    // Descontar stock de productos terminados
    for (const p of productos) {
      await client.query(
        `UPDATE productos SET stock = COALESCE(stock::numeric, 0) - $1 WHERE id_productos = $2`,
        [p.cantidad, p.id_producto]
      );
    }

    // La venta ya fue registrada al aprobar el comprobante (EN_PRODUCCION).
    // Produccion NO genera una segunda venta.
    await client.query('COMMIT');

    const pedidoInfo = await pool.query(
      `SELECT c.nombre_completo AS cliente, c.email,
              STRING_AGG(CONCAT(pr.nombre_producto, ' (', d.cantidad::INT, ')'), ', ') AS producto
       FROM pedidos p
       JOIN clientes c ON p.id_cliente = c.id_cliente
       LEFT JOIN detalle_pedido d ON p.id_pedidos = d.id_pedidos
       LEFT JOIN productos pr ON d.id_producto = pr.id_productos
       WHERE p.id_pedidos = $1 GROUP BY c.nombre_completo, c.email`, [id]
    );
    if (pedidoInfo.rows.length && pedidoInfo.rows[0].email) {
      const { cliente, email, producto } = pedidoInfo.rows[0];
      enviarCorreoPedidoCompletado({
        email, nombre: cliente,
        numeroPedido: `PED-${String(id).padStart(4,'0')}`,
        producto: producto || 'Productos de Macramé'
      }).catch(() => {});
    }
    res.json({ mensaje: 'Pedido completado', pedido: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ══════════════════════════════════════════════════════════════
//  MATERIALES DE TALLERES
// ══════════════════════════════════════════════════════════════

export async function listarMateriales(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT tm.*, t.nombre AS taller
       FROM taller_materiales tm
       JOIN talleres t ON tm.id_taller = t.id_taller
       WHERE tm.estado = TRUE
       ORDER BY t.nombre, tm.nombre_material`
    );
    res.json({ materiales: result.rows });
  } catch (err) { next(err); }
}

export async function crearMaterial(req, res, next) {
  const { id_taller, nombre_material, cantidad, unidad_medida, incluido_precio } = req.body;
  if (!id_taller || !nombre_material) return res.status(400).json({ mensaje: 'Taller y material son obligatorios' });
  try {
    const result = await pool.query(
      `INSERT INTO taller_materiales (id_taller, nombre_material, cantidad, unidad_medida, incluido_precio)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id_taller, nombre_material, cantidad || 1, unidad_medida || 'unidad', incluido_precio ?? true]
    );
    res.status(201).json({ mensaje: 'Material agregado', material: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarMaterial(req, res, next) {
  const { nombre_material, cantidad, unidad_medida, incluido_precio, estado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE taller_materiales SET nombre_material = COALESCE($1, nombre_material), cantidad = COALESCE($2, cantidad), unidad_medida = COALESCE($3, unidad_medida), incluido_precio = COALESCE($4, incluido_precio), estado = COALESCE($5, estado) WHERE id_material = $6 RETURNING *`,
      [nombre_material, cantidad, unidad_medida, incluido_precio, estado, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Material no encontrado' });
    res.json({ mensaje: 'Material actualizado', material: result.rows[0] });
  } catch (err) { next(err); }
}

export async function eliminarMaterial(req, res, next) {
  try {
    await pool.query(`UPDATE taller_materiales SET estado = FALSE WHERE id_material = $1`, [req.params.id]);
    res.json({ mensaje: 'Material eliminado' });
  } catch (err) { next(err); }
}


// ══════════════════════════════════════════════════════════════
//  ABONOS
// ══════════════════════════════════════════════════════════════

export async function listarAbonos(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT a.*, m.valor_total, m.porcentaje_pagado,
              CONCAT(est.nombre, ' ', COALESCE(est.apellido, '')) AS estudiante,
              tal.nombre AS taller
       FROM abonos a
       JOIN matricula m ON a.id_matricula = m.id_matricula
       JOIN estudiantes est ON m.id_estudiante = est.id_estudiante
       JOIN programacion_talleres pt ON m.id_programacion = pt.id_programacion_taller
       JOIN talleres tal ON pt.id_taller = tal.id_talleres
       WHERE a.estado = 'activo'
       ORDER BY a.fecha_abono DESC`
    );
    res.json({ abonos: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function crearAbono(req, res, next) {
  const { id_matricula, valor, metodo_pago, comprobante_url, observaciones } = req.body;
  if (!id_matricula || !valor) return res.status(400).json({ mensaje: 'Matrícula y valor son obligatorios' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Registrar abono
    const abono = await client.query(
      `INSERT INTO abonos (id_matricula, valor, metodo_pago, comprobante_url, observaciones)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id_matricula, valor, metodo_pago || 'transferencia', comprobante_url || null, observaciones]
    );

    // Actualizar porcentaje pagado en matrícula
    const matricula = await client.query(
        `SELECT valor_total, porcentaje_pagado FROM matricula WHERE id_matricula = $1`, [id_matricula]
    );
    const { valor_total, porcentaje_pagado } = matricula.rows[0];

    // Calcular total pagado
    const totalPagadoRes = await client.query(
        `SELECT COALESCE(SUM(valor), 0) AS total FROM abonos WHERE id_matricula = $1 AND estado = 'activo'`, [id_matricula]
    );
    const totalPagado = Number(totalPagadoRes.rows[0].total);
    const nuevoPorcentaje = Math.min(100, Math.round((totalPagado / Number(valor_total)) * 100));
    const nuevoEstado = nuevoPorcentaje >= 100 ? 'pagado' : 'inscrito';

    await client.query(
        `UPDATE matricula SET porcentaje_pagado = $1, estado = $2 WHERE id_matricula = $3`,
        [nuevoPorcentaje, nuevoEstado, id_matricula]
    );

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Abono registrado', abono: abono.rows[0], porcentaje_pagado: nuevoPorcentaje });
    } catch (err) { await client.query('ROLLBACK'); next(err); }
    finally { client.release(); }
}

export async function anularAbono(req, res, next) {
    try {
    await pool.query(`UPDATE abonos SET estado = 'anulado' WHERE id_abono = $1`, [req.params.id]);
    res.json({ mensaje: 'Abono anulado' });
    } catch (err) { next(err); }
}

// ══════════════════════════════════════════════════════════════
//  INTEGRACIÓN DE PEDIDOS A PRODUCCIÓN (NUDO STUDIO)
// ══════════════════════════════════════════════════════════════

/**
 * 1. Verifica si hay insumos suficientes para los productos de un pedido.
 */
export async function verificarInsumosPedido(req, res, next) {
  const { id } = req.params; // ID del pedido

  try {
    // Buscamos los insumos requeridos por los productos del pedido y su stock actual
    const queryInsumos = `
      SELECT 
        i.id_insumos,
        i.nombre AS insumo,
        i.stock AS stock_actual,
        (dp.cantidad * pi.cantidad_requerida) AS cantidad_necesaria
      FROM detalle_pedido dp
      JOIN productos p ON dp.id_producto = p.id_productos
      JOIN producto_insumos pi ON p.id_productos = pi.id_productos
      JOIN insumos i ON pi.id_insumos = i.id_insumos
      WHERE dp.id_pedidos = $1
    `;
    
    const result = await pool.query(queryInsumos, [id]);
    
    // Evaluamos si alguno no tiene suficiente stock
    const analisis = result.rows.map(row => ({
      ...row,
      suficiente: Number(row.stock_actual) >= Number(row.cantidad_necesaria)
    }));

    const sinStock = analisis.filter(ins => !ins.suficiente);

    res.json({
      viable: sinStock.length === 0,
      insumos: analisis,
      faltantes: sinStock
    });

  } catch (err) {
    next(err);
  }
}

/**
 * 2. Aprueba el pedido, descuenta los insumos del inventario y lo envía a producción.
 */
export async function aprobarYEnviarAProduccion(req, res, next) {
  const { id } = req.params; // ID del pedido
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // A. Obtener los insumos necesarios para este pedido
    const queryInsumos = `
      SELECT 
        i.id_insumos,
        i.nombre AS insumo,
        i.stock AS stock_actual,
        (dp.cantidad * pi.cantidad_requerida) AS cantidad_necesaria,
        dp.id_producto,
        dp.cantidad AS cantidad_producto
      FROM detalle_pedido dp
      JOIN productos p ON dp.id_producto = p.id_productos
      JOIN producto_insumos pi ON p.id_productos = pi.id_productos
      JOIN insumos i ON pi.id_insumos = i.id_insumos
      WHERE dp.id_pedidos = $1
    `;
    const insumosRes = await client.query(queryInsumos, [id]);

    // B. Doble verificación de stock (seguridad en el Backend)
    for (const item of insumosRes.rows) {
      if (Number(item.stock_actual) < Number(item.cantidad_necesaria)) {
        throw new Error(`Stock insuficiente para el insumo: ${item.insumo}`);
      }
    }

    // C. Descontar stock del inventario y registrar en kardex
    for (const item of insumosRes.rows) {
      const stock_anterior = Number(item.stock_actual);
      const stock_nuevo = stock_anterior - Number(item.cantidad_necesaria);
      await client.query(
        `UPDATE insumos SET stock = stock - $1 WHERE id_insumos = $2`,
        [item.cantidad_necesaria, item.id_insumos]
      );
      await client.query(
        `INSERT INTO movimientos_insumos (id_insumo, tipo, cantidad, motivo, stock_anterior, stock_nuevo)
         VALUES ($1, 'SALIDA', $2, $3, $4, $5)`,
        [item.id_insumos, item.cantidad_necesaria, `Producción pedido PED-${String(id).padStart(4,'0')}`, stock_anterior, stock_nuevo]
      );
    }

    // D. Cambiar el estado del pedido a 'EN_PRODUCCION'
    const pedidoActualizado = await client.query(
      `UPDATE pedidos 
       SET estado = 'EN_PRODUCCION' 
       WHERE id_pedidos = $1 RETURNING *`,
      [id]
    );

    if (pedidoActualizado.rows.length === 0) {
      throw new Error('El pedido no fue encontrado');
    }

    // E. Registrar la orden de producción de manera automática
    // Agrupamos por producto para insertar en la tabla 'produccion'
    const productosAgrupados = insumosRes.rows.reduce((acc, curr) => {
      if (!acc[curr.id_producto]) {
        acc[curr.id_producto] = {
          id_producto: curr.id_producto,
          cantidad: curr.cantidad_producto
        };
      }
      return acc;
    }, {});

    for (const key in productosAgrupados) {
      const prod = productosAgrupados[key];
      
      // Insertamos el registro en la tabla de producción
      const prodInsert = await client.query(
        `INSERT INTO produccion (fecha_produccion, estado, id_productos, cantidad)
         VALUES ($1, 'en_proceso', $2, $3) RETURNING id_produccion`,
        [new Date(), prod.id_producto, prod.cantidad]
      );

      const idProduccion = prodInsert.rows[0].id_produccion;

      // Asociamos los insumos descontados a esta orden de producción en la tabla intermedia
      const insumosDeEsteProducto = insumosRes.rows.filter(item => item.id_producto === prod.id_producto);
      for (const insumo of insumosDeEsteProducto) {
        await client.query(
          `INSERT INTO produccion_insumos (id_produccion, id_insumos, cantidad_gastada)
           VALUES ($1, $2, $3)`,
          [idProduccion, insumo.id_insumos, insumo.cantidad_necesaria]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      mensaje: 'Pedido aprobado, stock descontado y enviado a producción con éxito.'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ mensaje: err.message });
  } finally {
    client.release();
  }
}