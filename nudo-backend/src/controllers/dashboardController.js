// src/controllers/dashboardController.js
import pool from '../config/db.js';

export async function obtenerEstadisticas(req, res, next) {
  try {
    const [
      ventasRes, pedidosRes, productosRes, insumosRes,
      clientesRes, talleresHoyRes, matriculasRes, topProductosRes,
      ventasSemanaRes, ventasMensualRes, ventasAnualRes, abonosMesRes
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COALESCE(SUM(total), 0) AS monto FROM ventas WHERE estado = TRUE`),
      pool.query(`SELECT COUNT(*) AS total FROM pedidos WHERE estado = 'PAGO_POR_VERIFICAR'`),
      pool.query(`SELECT COUNT(*) AS total FROM productos`),
      pool.query(`SELECT COUNT(*) AS total FROM insumos WHERE CAST(stock AS numeric) < stock_minimo`),
      pool.query(`SELECT COUNT(*) AS total FROM clientes WHERE estado = TRUE`),

      pool.query(`
        SELECT t.id_talleres, p.nombre_taller AS taller,
               t.hora, t.estado,
               p.nombre_instructor AS instructor,
               COUNT(m.id_matricula) AS inscritos
        FROM talleres t
        JOIN programacion_talleres p ON t.id_programacion = p.id_programacion_taller
        LEFT JOIN matricula m ON m.id_programacion = t.id_talleres
        WHERE t.fecha = CURRENT_DATE AND t.estado = TRUE
        GROUP BY t.id_talleres, p.nombre_taller, p.nombre_instructor, t.hora, t.estado
        ORDER BY t.hora
      `),

      pool.query(`SELECT COUNT(*) AS total FROM matricula WHERE estado IN ('activa', 'activo', 'pendiente_pago')`),

      pool.query(`
        SELECT pr.nombre_producto AS nombre,
               SUM(dp.cantidad) AS ventas,
               COALESCE(SUM(dp.cantidad * dp.precio_unitario), 0) AS ingresos
        FROM ventas v
        JOIN pedidos p ON v.id_pedidos = p.id_pedidos
        JOIN detalle_pedido dp ON p.id_pedidos = dp.id_pedidos
        JOIN productos pr ON dp.id_producto = pr.id_productos
        WHERE v.estado = TRUE
          AND DATE_TRUNC('month', v.fecha) = DATE_TRUNC('month', NOW())
        GROUP BY pr.nombre_producto
        ORDER BY ventas DESC
        LIMIT 5
      `),

      pool.query(`
        SELECT DATE(fecha) AS fecha,
               COUNT(*) AS num_ventas,
               COALESCE(SUM(total), 0) AS total
        FROM ventas
        WHERE fecha >= NOW() - INTERVAL '7 days' AND estado = TRUE
        GROUP BY DATE(fecha)
        ORDER BY fecha ASC
      `),

      pool.query(`
        SELECT DATE(fecha) AS fecha,
               COUNT(*) AS num_ventas,
               COALESCE(SUM(total), 0) AS total
        FROM ventas
        WHERE fecha >= NOW() - INTERVAL '30 days' AND estado = TRUE
        GROUP BY DATE(fecha)
        ORDER BY fecha ASC
      `),

      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', fecha), 'YYYY-MM') AS mes,
               COUNT(*) AS num_ventas,
               COALESCE(SUM(total), 0) AS total
        FROM ventas
        WHERE fecha >= NOW() - INTERVAL '12 months' AND estado = TRUE
        GROUP BY DATE_TRUNC('month', fecha)
        ORDER BY DATE_TRUNC('month', fecha) ASC
      `),

      // Ingresos de abonos aprobados/completos del mes actual
      pool.query(`
        SELECT COALESCE(SUM(monto_abono), 0) AS monto
        FROM abonos
        WHERE estado IN ('aprobado', 'completo')
          AND DATE_TRUNC('month', fecha_abono) = DATE_TRUNC('month', NOW())
      `),
    ]);

    const topMax = topProductosRes.rows[0]?.ventas || 1;

    res.json({
      resumen: {
        total_ventas:         Number(ventasRes.rows[0]?.total || 0),
        monto_ventas:         Number(ventasRes.rows[0]?.monto || 0),
        monto_abonos_mes:     Number(abonosMesRes.rows[0]?.monto || 0),
        ingresos_mes:         Number(ventasRes.rows[0]?.monto || 0) + Number(abonosMesRes.rows[0]?.monto || 0),
        pedidos_pendientes:   Number(pedidosRes.rows[0]?.total || 0),
        total_productos:      Number(productosRes.rows[0]?.total || 0),
        stock_critico:        Number(insumosRes.rows[0]?.total || 0),
        total_clientes:       Number(clientesRes.rows[0]?.total || 0),
        matriculas_activas:   Number(matriculasRes.rows[0]?.total || 0),
      },
      talleres_hoy: talleresHoyRes.rows.map(t => ({
        taller:            t.taller,
        hora_inicio:       t.hora,
        hora_fin:          '',
        cupos_disponibles: null,
        inscritos:         Number(t.inscritos),
        instructor:        t.instructor,
        estado:            t.estado ? 'Programado' : 'Inactivo',
      })),
      top_productos: topProductosRes.rows.map(p => ({
        nombre:     p.nombre,
        ventas:     Number(p.ventas),
        ingresos:   Number(p.ingresos),
        porcentaje: Math.round((Number(p.ventas) / Number(topMax)) * 100),
      })),
      ventas_semana: ventasSemanaRes.rows.map(v => ({
        fecha:      v.fecha,
        num_ventas: Number(v.num_ventas),
        total:      Number(v.total),
      })),
      ventas_mensual: ventasMensualRes.rows.map(v => ({
        fecha:      v.fecha,
        num_ventas: Number(v.num_ventas),
        total:      Number(v.total),
      })),
      ventas_anual: ventasAnualRes.rows.map(v => ({
        mes:        v.mes,
        num_ventas: Number(v.num_ventas),
        total:      Number(v.total),
      })),
    });
  } catch (err) { next(err); }
}
