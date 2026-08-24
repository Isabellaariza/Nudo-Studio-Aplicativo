import pool from '../config/db.js';
import {
  enviarCorreoPedidoEnProceso,
  enviarCorreoPedidoCancelado,
  enviarCorreoPedidoEnProduccion,
  enviarCorreoPedidoCompletado,
} from '../config/email.js';


// HELPER: registrar venta automáticamente al completar un pedido
async function registrarVentaDesdePedido(client, id_pedidos) {
  const pedidoRes = await client.query(
    `SELECT p.id_cliente, p.total, p.id_empleado,
            STRING_AGG(CONCAT(pr.nombre_producto, ' (', d.cantidad::INT, ')'), ', ') AS producto,
            SUM(d.cantidad) AS cantidad_total
     FROM pedidos p
     LEFT JOIN detalle_pedido d ON p.id_pedidos = d.id_pedidos
     LEFT JOIN productos pr ON d.id_producto = pr.id_productos
     WHERE p.id_pedidos = $1
     GROUP BY p.id_cliente, p.total, p.id_empleado`,
    [id_pedidos]
  );
  if (!pedidoRes.rows.length) return;
  const { id_cliente, total, id_empleado, producto, cantidad_total } = pedidoRes.rows[0];
  // Evitar duplicados: solo insertar si no existe ya una venta para este pedido
  const existe = await client.query(`SELECT id_ventas FROM ventas WHERE id_pedidos = $1`, [id_pedidos]);
  if (existe.rows.length) return;
  await client.query(
    `INSERT INTO ventas (fecha, producto, cantidad, total, estado, id_cliente, id_empleado, id_pedidos)
     VALUES (NOW(), $1, $2, $3, TRUE, $4, $5, $6)`,
    [producto || 'Producto', cantidad_total || 1, total || 0, id_cliente, id_empleado || null, id_pedidos]
  );
}

// LISTAR VENTAS
export async function listarVentas(req, res, next) {
  try {
    const { buscar } = req.query;
    let query = `
      SELECT v.id_ventas, v.fecha, v.producto, v.cantidad, v.total, v.estado,
             c.nombre_completo AS cliente, c.id_cliente,
             e.nombre_completo AS empleado
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN empleados e ON v.id_empleado = e.id_empleado
      WHERE 1=1
    `;
    const params = [];
    if (buscar) {
      params.push(`%${buscar}%`);
      query += ` AND (c.nombre_completo ILIKE $1 OR v.producto ILIKE $1)`;
    }
    query += ' ORDER BY v.fecha DESC';
    const result = await pool.query(query, params);
    res.json({ ventas: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

// OBTENER UNA VENTA
export async function obtenerVenta(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT v.*, c.nombre_completo AS cliente
       FROM ventas v LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
       WHERE v.id_ventas = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Venta no encontrada' });
    res.json({ venta: result.rows[0] });
  } catch (err) { next(err); }
}

// CREAR VENTA
export async function crearVenta(req, res, next) {
  // 1. Recibimos los datos del frontend (ahora esperamos 'items' en vez de un solo string 'producto')
  const { id_cliente, items, total, id_empleado, direccion_entrega } = req.body;

  // Validamos que el cliente exista y que el carrito tenga productos
  if (!id_cliente) return res.status(400).json({ mensaje: 'El cliente es obligatorio' });
  if (!items || items.length === 0) return res.status(400).json({ mensaje: 'El carrito no puede estar vacío' });

  // Necesitamos un cliente específico del pool para poder usar transacciones (BEGIN, COMMIT, ROLLBACK)
  const client = await pool.connect();

  try {
    // Iniciamos la transacción
    await client.query('BEGIN');

    // 2. Insertamos la cabecera en la tabla pedidos/ventas
    // NOTA: Ajusté 'estado' para que guarde 'PAGO_POR_VERIFICAR' en vez de TRUE
    const queryPedido = `
      INSERT INTO pedidos (id_cliente, total, estado, id_empleado, direccion_entrega, fecha)
      VALUES ($1, $2, 'PAGO_POR_VERIFICAR', $3, $4, NOW()) 
      RETURNING id_pedidoss
    `;
    
    const pedidoRes = await client.query(queryPedido, [
      id_cliente, 
      total || 0, 
      id_empleado || null,
      direccion_entrega || null
    ]);
    
    // Obtenemos el ID del pedido que se acaba de crear automáticamente
    const idNuevoPedido = pedidoRes.rows[0].id_pedidoss;

    // 3. Insertamos cada producto del carrito en la tabla detalle_pedido
    const queryDetalle = `
      INSERT INTO detalle_pedido (id_pedidos, id_producto, cantidad, precio_unitario) 
      VALUES ($1, $2, $3, $4)
    `;

    // Recorremos los productos que vienen del frontend y los guardamos uno por uno
    for (const item of items) {
      await client.query(queryDetalle, [
        idNuevoPedido, 
        item.id_producto, // Asegúrate de que el frontend mande este campo como id_producto (número)
        item.cantidad, 
        item.precio_unitario // El precio unitario del producto en ese momento
      ]);
    }

    // Si todo salió bien en el bucle, confirmamos y guardamos todo permanentemente
    await client.query('COMMIT');

    res.status(201).json({ 
      mensaje: 'Pedido y detalles registrados exitosamente', 
      id_pedidos: idNuevoPedido 
    });

  } catch (err) {
    // Si algo falla (ej. un ID de producto no existe), cancelamos todo para no dejar datos corruptos
    await client.query('ROLLBACK');
    next(err);
  } finally {
    // Al final, cerramos y liberamos la conexión del cliente para que no se quede bloqueada
    client.release();
  }
}

// ACTUALIZAR ESTADO VENTA
export async function actualizarEstadoVenta(req, res, next) {
  const { estado } = req.body;
  let estadoBool;
  if (typeof estado === 'boolean') estadoBool = estado;
  else estadoBool = estado === 'Completada' || estado === 'Enviada' || estado === 'Pendiente';
  try {
    const result = await pool.query(
      `UPDATE ventas SET estado = $1 WHERE id_ventas = $2 RETURNING *`,
      [estadoBool, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Venta no encontrada' });
    res.json({ mensaje: 'Venta actualizada', venta: result.rows[0] });
  } catch (err) { next(err); }
}

// ANULAR VENTA
export async function anularVenta(req, res, next) {
  try {
    const result = await pool.query(
      `UPDATE ventas SET estado = FALSE WHERE id_ventas = $1 RETURNING id_ventas`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Venta no encontrada' });
    res.json({ mensaje: 'Venta anulada' });
  } catch (err) { next(err); }
}

// ==========================================
//          MÓDULO DE PEDIDOS
// ==========================================

// LISTAR PEDIDOS (CON STRING_AGG PARA DETALLES MULTI-PRODUCTO)
export async function listarPedidos(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT p.id_pedidos, p.fecha, p.estado, p.total, p.direccion_entrega, p.created_at, p.comprobante_pago,
             c.nombre_completo AS cliente, c.email AS cliente_email, c.telefono AS cliente_telefono,
             e.nombre_completo AS empleado,
             STRING_AGG(CONCAT(pr.nombre_producto, ' (', d.cantidad::INT, ')'), ', ') AS producto,
             JSON_AGG(JSON_BUILD_OBJECT(
               'nombre', pr.nombre_producto,
               'cantidad', d.cantidad,
               'precio_unitario', d.precio_unitario
             ) ORDER BY pr.nombre_producto) AS detalle
      FROM pedidos p
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN empleados e ON p.id_empleado = e.id_empleado
      LEFT JOIN detalle_pedido d ON p.id_pedidos = d.id_pedidos
      LEFT JOIN productos pr ON d.id_producto = pr.id_productos
      GROUP BY p.id_pedidos, c.nombre_completo, c.email, c.telefono, e.nombre_completo
      ORDER BY p.created_at DESC
    `);
    res.json({ pedidos: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

// OBTENER UN PEDIDO EN DETALLE
export async function obtenerPedido(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nombre_completo AS cliente, c.email AS cliente_email, c.telefono AS cliente_telefono,
             e.nombre_completo AS empleado
      FROM pedidos p
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN empleados e ON p.id_empleado = e.id_empleado
      WHERE p.id_pedidos = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    res.json({ pedido: result.rows[0] });
  } catch (err) { next(err); }
}

// ACTUALIZAR ESTADO DEL PEDIDO (APROBAR PAGO -> PRODUCCIÓN / RECHAZAR PAGO)
export async function actualizarEstadoPedido(req, res, next) {
  let { estado, motivo } = req.body; // 'PAGADO' (o 'EN_PRODUCCION') o 'RECHAZADO'
  
  try {
    const id_pedidos = req.params.id;

    // Estados válidos: EN_PRODUCCION, RECHAZADO, COMPLETADO
    const estadoFinal = estado;

    const pedidoRes = await pool.query(
      `SELECT p.id_pedidos, p.total, p.comprobante_pago, c.nombre_completo AS cliente, c.email AS cliente_email,
              STRING_AGG(CONCAT(pr.nombre_producto, ' (', d.cantidad::INT, ')'), ', ') AS producto
       FROM pedidos p 
       LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
       LEFT JOIN detalle_pedido d ON p.id_pedidos = d.id_pedidos
       LEFT JOIN productos pr ON d.id_producto = pr.id_productos
       WHERE p.id_pedidos = $1
       GROUP BY p.id_pedidos, c.nombre_completo, c.email`, [id_pedidos]
    );
    if (!pedidoRes.rows.length) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    const pedido = pedidoRes.rows[0];

    const result = await pool.query(
      `UPDATE pedidos 
       SET estado = $1, 
           motivo_rechazo = $2 
       WHERE id_pedidos = $3 RETURNING *`,
      [
        estadoFinal,
        estadoFinal === 'RECHAZADO' ? (motivo || 'El comprobante de pago adjunto no es válido.') : null,
        id_pedidos
      ]
    );

    // Registrar venta automáticamente al completar
    if (estadoFinal === 'COMPLETADO') {
      const client = await pool.connect();
      try { await registrarVentaDesdePedido(client, id_pedidos); }
      finally { client.release(); }
    }

    if (pedido.cliente_email) {
      const numero = `PED-${String(pedido.id_pedidos).padStart(4, '0')}`;
      if (estadoFinal === 'EN_PRODUCCION') {
        enviarCorreoPedidoEnProduccion({ 
          email: pedido.cliente_email, nombre: pedido.cliente, 
          numeroPedido: numero, producto: pedido.producto || 'Productos de Macramé'
        }).catch(() => {});
      } else if (estadoFinal === 'RECHAZADO') {
        enviarCorreoPedidoCancelado({ 
          email: pedido.cliente_email, nombre: pedido.cliente, 
          numeroPedido: numero, producto: pedido.producto || 'Productos de Macramé',
          motivo: motivo || 'El comprobante de pago adjunto no es válido.'
        }).catch(() => {});
      } else if (estadoFinal === 'COMPLETADO') {
        enviarCorreoPedidoCompletado({
          email: pedido.cliente_email, nombre: pedido.cliente,
          numeroPedido: numero, producto: pedido.producto || 'Productos de Macramé'
        }).catch(() => {});
      }
    }

    res.json({ mensaje: `Pedido actualizado a ${estado}`, pedido: result.rows[0] });
  } catch (err) { next(err); }
}

// CANCELAR PEDIDO ADMISTRATIVAMENTE
export async function cancelarPedido(req, res, next) {
  const { motivo } = req.body || {};
  try {
    const pedidoRes = await pool.query(
      `SELECT p.id_pedidos, c.nombre_completo AS cliente, c.email AS cliente_email,
              STRING_AGG(CONCAT(pr.nombre_producto, ' (', d.cantidad::INT, ')'), ', ') AS producto
       FROM pedidos p 
       LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
       LEFT JOIN detalle_pedido d ON p.id_pedidos = d.id_pedidos
       LEFT JOIN productos pr ON d.id_producto = pr.id_productos
       WHERE p.id_pedidos = $1
       GROUP BY p.id_pedidos, c.nombre_completo, c.email`, [req.params.id]
    );
    if (!pedidoRes.rows.length) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    const pedido = pedidoRes.rows[0];

    await pool.query(`UPDATE pedidos SET estado = 'RECHAZADO', motivo_rechazo = $1 WHERE id_pedidos = $2`, [motivo || 'Pedido cancelado por la administración.', req.params.id]);

    if (pedido.cliente_email) {
      const numero = `PED-${String(pedido.id_pedidos).padStart(4, '0')}`;
      enviarCorreoPedidoCancelado({ 
        email: pedido.cliente_email, 
        nombre: pedido.cliente, 
        numeroPedido: numero, 
        producto: pedido.producto || 'Productos de Macramé', 
        motivo: motivo || 'Pedido cancelado por la administración.' 
      }).catch(() => {});
    }

    res.json({ mensaje: 'Pedido cancelado' });
  } catch (err) { next(err); }
}

// RE-SUBIR COMPROBANTE DE PAGO (DESDE EL PERFIL DEL CLIENTE)
export async function resubirComprobante(req, res, next) {
  try {
    const id_pedidos = req.params.id;
    const { comprobante_pago } = req.body; // Recibimos la URL de Cloudinary

    if (!comprobante_pago) {
      return res.status(400).json({ mensaje: 'La URL del comprobante es requerida' });
    }

    const pedidoCheck = await pool.query('SELECT * FROM pedidos WHERE id_pedidos = $1', [id_pedidos]);
    if (!pedidoCheck.rows.length) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const result = await pool.query(
      `UPDATE pedidos 
       SET estado = 'PAGO_POR_VERIFICAR', 
           comprobante_pago = $1, 
           motivo_rechazo = NULL 
       WHERE id_pedidos = $2 
       RETURNING *`,
      [comprobante_pago, id_pedidos]
    );

    res.json({ 
      mensaje: 'Comprobante re-subido con éxito. El pedido vuelve a estar en revisión.', 
      pedido: result.rows[0] 
    });

  } catch (err) { 
    next(err); 
  }
}

// ══════════════════════════════════════════════════════════════
//  VERIFICACIÓN Y PROCESAMIENTO DE PEDIDOS A PRODUCCIÓN
// ══════════════════════════════════════════════════════════════

// 1. Endpoint para verificar si hay insumos suficientes para un pedido completo
export async function verificarInsumosPedido(req, res, next) {
  const id_pedidos = req.params.id;

  try {
    // Consultamos los insumos requeridos multiplicando las prendas pedidas por su ficha técnica
    const query = `
      SELECT 
        i.id_insumos,
        i.nombre AS insumo,
        i.unidad_medida,
        i.stock AS stock_disponible,
        SUM(dp.cantidad * pi.cantidad_requerida) AS cantidad_requerida,
        (i.stock >= SUM(dp.cantidad * pi.cantidad_requerida)) AS tiene_stock
      FROM detalle_pedido dp
      JOIN producto_insumos pi ON dp.id_producto = pi.id_producto
      JOIN insumos i ON pi.id_insumo = i.id_insumos
      WHERE dp.id_pedidos = $1
      GROUP BY i.id_insumos, i.nombre, i.unidad_medida, i.stock;
    `;
    
    const result = await pool.query(query, [id_pedidos]);

    // Determinamos si el pedido completo es viable para producir de inmediato
    const viable = result.rows.every(row => row.tiene_stock);

    res.json({
      id_pedidos,
      viable,
      insumos_analisis: result.rows
    });

  } catch (err) { next(err); }
}

// 2. Transacción para aprobar el pedido, mandarlo a producción y descontar el stock
export async function aprobarYEnviarAProduccion(req, res, next) {
  const id_pedidos = req.params.id;
  const { id_usuarios, fecha_entrega, observaciones } = req.body;

  const client = await pool.connect();

  try {
    // Iniciamos la transacción SQL
    await client.query('BEGIN');

    // A. Cambiar el estado del pedido a 'EN_PRODUCCION'
    const updatePedido = await client.query(
      `UPDATE pedidos SET estado = 'EN_PRODUCCION' WHERE id_pedidos = $1 RETURNING *`,
      [id_pedidos]
    );
    if (!updatePedido.rows.length) {
      throw new Error('El pedido no existe o no pudo ser actualizado.');
    }

    // B. Obtener los insumos requeridos para este pedido en base a la ficha técnica
    const insumosReq = await client.query(`
      SELECT 
        pi.id_insumo,
        SUM(dp.cantidad * pi.cantidad_requerida) AS cantidad_total
      FROM detalle_pedido dp
      JOIN producto_insumos pi ON dp.id_producto = pi.id_producto
      WHERE dp.id_pedidos = $1
      GROUP BY pi.id_insumo
    `, [id_pedidos]);

    // C. Crear la orden de producción automática (tipo Origen: Pedido)
    // Nota: Guardamos observaciones que identifiquen que viene de un pedido automático
    const insertProduccion = await client.query(
      `INSERT INTO produccion (fecha_produccion, fecha_entrega, estado, id_usuarios, id_productos, cantidad)
       VALUES (NOW(), $1, 'en_proceso', $2, NULL, 1) RETURNING id_produccion`,
      [fecha_entrega || null, id_usuarios || null]
    );
    const id_produccion = insertProduccion.rows[0].id_produccion;

    // D. Registrar el gasto de insumos y descontar el stock del almacén
    for (const item of insumosReq.rows) {
      const { id_insumo, cantidad_total } = item;

      // Registrar consumo en la tabla intermedia de producción
      await client.query(
        `INSERT INTO produccion_insumos (id_produccion, id_insumos, cantidad_gastada)
         VALUES ($1, $2, $3)`,
        [id_produccion, id_insumo, cantidad_total]
      );

      // Descontar del inventario de insumos
      await client.query(
        `UPDATE insumos 
         SET stock = stock - $1 
         WHERE id_insumos = $2`,
        [cantidad_total, id_insumo]
      );
    }

    // Si todas las consultas fueron exitosas, confirmamos los cambios
    await client.query('COMMIT');

    res.json({
      mensaje: 'Pedido aprobado, orden de producción generada e insumos descontados con éxito.',
      id_pedidos,
      id_produccion
    });

  } catch (err) {
    // Si algo falla, deshacemos todos los cambios realizados en esta solicitud
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}