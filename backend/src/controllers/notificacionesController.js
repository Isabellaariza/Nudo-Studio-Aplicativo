import pool from '../config/db.js';

export async function obtenerNotificaciones(req, res, next) {
  try {
    const [pedidosRes, stockRes, matriculasRes, abonosRes] = await Promise.all([

      // Pedidos pendientes de verificar pago (últimos 30 días)
      pool.query(`
        SELECT id_pedidos, created_at, total,
               c.nombre_completo AS cliente
        FROM pedidos p
        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
        WHERE p.estado = 'PAGO_POR_VERIFICAR'
          AND p.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY p.created_at DESC
      `),

      // Insumos con stock crítico
      pool.query(`
        SELECT id_insumos, nombre,
               CAST(stock AS numeric) AS stock,
               stock_minimo
        FROM insumos
        WHERE CAST(stock AS numeric) < stock_minimo
          AND estado = TRUE
        ORDER BY (stock_minimo - CAST(stock AS numeric)) DESC
      `),

      // Matrículas nuevas (últimos 7 días)
      pool.query(`
        SELECT m.id_matricula, m.fecha_matricula AS created_at,
               e.nombre_completo AS estudiante,
               pt.nombre_taller AS taller
        FROM matricula m
        JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
        LEFT JOIN programacion_talleres pt ON m.id_programacion = pt.id_programacion_taller
        WHERE m.fecha_matricula >= NOW() - INTERVAL '7 days'
        ORDER BY m.fecha_matricula DESC
      `),

      // Abonos pendientes de aprobar (últimos 30 días)
      pool.query(`
        SELECT a.id_abono, a.fecha_abono, a.monto_abono,
               e.nombre_completo AS estudiante
        FROM abonos a
        JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
        WHERE a.estado = 'por_verificar'
          AND a.fecha_abono >= NOW() - INTERVAL '30 days'
        ORDER BY a.fecha_abono DESC
        LIMIT 10
      `),
    ]);

    const notificaciones = [];

    // Pedidos por verificar — uno por pedido
    for (const p of pedidosRes.rows) {
      notificaciones.push({
        id: `pedido_${p.id_pedidos}`,
        tipo: 'pedido',
        texto: `Pedido PED-${String(p.id_pedidos).padStart(4,'0')} de ${p.cliente || 'cliente'} por $${Number(p.total).toLocaleString('es-CO')} pendiente de verificación`,
        fecha: p.created_at,
        navegar: 'pedidos',
        color: '#10B981',
      });
    }

    // Stock crítico — una notificación por insumo
    for (const i of stockRes.rows) {
      notificaciones.push({
        id: `stock_${i.id_insumos}`,
        tipo: 'stock',
        texto: `Stock bajo: "${i.nombre}" — ${i.stock} unidades (mínimo: ${i.stock_minimo})`,
        fecha: new Date().toISOString(),
        navegar: 'stock',
        color: '#EF4444',
      });
    }

    // Matrículas nuevas — una por matrícula
    for (const m of matriculasRes.rows) {
      notificaciones.push({
        id: `matricula_${m.id_matricula}`,
        tipo: 'matricula',
        texto: `${m.estudiante} se inscribió en "${m.taller || 'taller'}"`,
        fecha: m.created_at,
        navegar: 'matricula',
        color: '#B8860B',
      });
    }

    // Abonos pendientes — uno por abono
    for (const a of abonosRes.rows) {
      notificaciones.push({
        id: `abono_${a.id_abono}`,
        tipo: 'abono',
        texto: `Abono de $${Number(a.monto_abono).toLocaleString('es-CO')} de ${a.estudiante} pendiente de revisión`,
        fecha: a.fecha_abono,
        navegar: 'abonos',
        color: '#F59E0B',
      });
    }

    // Ordenar por fecha más reciente
    notificaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    res.json({ notificaciones, total: notificaciones.length });
  } catch (err) { next(err); }
}
