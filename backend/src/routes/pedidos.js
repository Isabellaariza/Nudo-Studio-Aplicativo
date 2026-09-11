// src/routes/pedidos.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import upload from '../middleware/multer.js'; 
import { 
  listarPedidos, 
  obtenerPedido, 
  actualizarEstadoPedido, 
  cancelarPedido,
  resubirComprobante,
  verificarInsumosPedido,
  aprobarYEnviarAProduccion
} from '../controllers/ventasController.js';
import pool from '../config/db.js';

const router = Router();

router.get('/', verificarToken, listarPedidos);

router.get('/mis-pedidos', verificarToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT p.id_pedidos, p.fecha, p.estado, p.total, p.direccion_entrega,
             p.comprobante_pago, p.motivo_rechazo,
             COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'nombre', pr.nombre_producto,
                   'cantidad', d.cantidad,
                   'precio_unitario', d.precio_unitario,
                   'imagen_url', pr.imagen_url
                 )
               ) FILTER (WHERE d.id_producto IS NOT NULL),
               '[]'
             ) AS detalle
      FROM pedidos p
      JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN detalle_pedido d ON p.id_pedidos = d.id_pedidos
      LEFT JOIN productos pr ON d.id_producto = pr.id_productos
      WHERE c.id_usuarios = $1
      GROUP BY p.id_pedidos
      ORDER BY p.created_at DESC
    `, [req.usuario.id]);
    res.json({ pedidos: result.rows });
  } catch (err) { next(err); }
});

router.get('/:id', verificarToken, obtenerPedido);

// RUTA DEFINITIVA PARA CREAR PEDIDO (CON DETALLES)
router.post('/', verificarToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { productos, total, direccion_entrega, comprobante_pago, id_cliente: id_cliente_body } = req.body;
    
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: 'El carrito no puede estar vacío' });
    }

    // Si el admin manda id_cliente directamente, usarlo; si no, buscarlo por el usuario logueado
    let id_cliente;
    if (id_cliente_body) {
      id_cliente = id_cliente_body;
    } else {
      let clienteRes = await client.query(
        `SELECT id_cliente FROM clientes WHERE id_usuarios = $1`, [req.usuario.id]
      );
      if (!clienteRes.rows.length) {
        const usuarioRes = await client.query(
          `SELECT nombre, email, telefono FROM usuarios WHERE id_usuarios = $1`, [req.usuario.id]
        );
        if (!usuarioRes.rows.length) return res.status(400).json({ mensaje: 'Usuario no encontrado' });
        const u = usuarioRes.rows[0];
        const rolRes = await client.query(`SELECT id_rol FROM roles WHERE nombre ILIKE 'cliente' LIMIT 1`);
        const id_rol = rolRes.rows[0]?.id_rol || null;
        clienteRes = await client.query(
          `INSERT INTO clientes (nombre_completo, email, telefono, estado, id_rol, id_usuarios)
           VALUES ($1, $2, $3, TRUE, $4, $5) RETURNING id_cliente`,
          [u.nombre, u.email, u.telefono || null, id_rol, req.usuario.id]
        );
      }
      id_cliente = clienteRes.rows[0].id_cliente;
    }

    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (id_cliente, total, estado, direccion_entrega, fecha, created_at, comprobante_pago)
       VALUES ($1, $2, 'PAGO_POR_VERIFICAR', $3, CURRENT_DATE, NOW(), $4) RETURNING *`,
      [id_cliente, total || 0, direccion_entrega || null, comprobante_pago || null]
    );
    
    const nuevoPedido = pedidoResult.rows[0];

    for (const prod of productos) {
      await client.query(
        `INSERT INTO detalle_pedido (id_pedidos, id_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [nuevoPedido.id_pedidos, prod.id_producto, prod.cantidad, prod.precio_unitario || 0]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Pedido creado exitosamente', pedido: nuevoPedido });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.put('/:id', verificarToken, verificarRol('administrador', 'empleado'), actualizarEstadoPedido);
router.put('/:id/cancelar', verificarToken, cancelarPedido);

router.put('/:id/resubir-comprobante', verificarToken, resubirComprobante);
router.get('/:id/verificar-insumos', verificarToken, verificarInsumosPedido);
router.post('/:id/aprobar-produccion', verificarToken, verificarRol('administrador', 'empleado'), aprobarYEnviarAProduccion);

export default router;