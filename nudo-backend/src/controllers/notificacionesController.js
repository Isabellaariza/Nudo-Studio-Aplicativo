import pool from '../config/db.js';

export async function obtenerNotificaciones(req, res, next) {
  try {
    const [pedidosRes, stockRes, clientesRes, matriculasRes, abonosRes] = await Promise.all([

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
        SELECT id_insumos, nombre, stock, stock_minimo
        FROM insumos
        WHERE CAST(stock AS numeric) < stock_minimo
        ORDER BY nombre
      `),

      // Clientes nuevos (últimos 7 días)
      pool.query(`
        SELECT id_cliente, nombre_completo
        FROM clientes
        WHERE estado = TRUE
        ORDER BY id_cliente DESC
        LIMIT 5
      `),

      // Matrículas nuevas (últimos 7 días)
      pool.query(`
        SELECT m.id_matricula, m.fecha_matricula AS created_at,
               e.nombre_completo AS estudiante,
               pt.nombre_taller AS taller
        FROM matricula m
        JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
        JOIN programacion_talleres pt ON m.id_programacion = pt.id_programacion_taller
        WHERE m.fecha_matricula >= NOW() - INTERVAL '7 days'
        ORDER BY m.fecha_matricula DESC
      `),

      // Abonos pendientes de aprobar
      pool.query(`
        SELECT a.id_abono, a.fecha_abono, a.valor,
               e.nombre_completo AS estudiante
        FROM abonos a
        JOIN matricula m ON a.id_matricula = m.id_matricula
        JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
        WHERE a.estado = 'activo'
          AND a.comprobante_url IS NOT NULL
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

    // Stock crítico — agrupado en una sola notificación
    if (stockRes.rows.length > 0) {
      const nombres = stockRes.rows.slice(0, 3).map(i => i.nombre).join(', ');
      const extra = stockRes.rows.length > 3 ? ` y ${stockRes.rows.length - 3} más` : '';
      notificaciones.push({
        id: 'stock_critico',
        tipo: 'stock',
        texto: `Stock crítico: ${nombres}${extra}`,
        fecha: new Date().toISOString(),
        navegar: 'stock',
        color: '#EF4444',
      });
    }

    // Clientes nuevos
    for (const c of clientesRes.rows) {
      notificaciones.push({
        id: `cliente_${c.id_cliente}`,
        tipo: 'cliente',
        texto: `Nuevo cliente registrado: ${c.nombre_completo}`,
        fecha: new Date().toISOString(),
        navegar: 'clientes',
        color: '#6366F1',
      });
    }

    // Matrículas nuevas — una por matrícula
    for (const m of matriculasRes.rows) {
      notificaciones.push({
        id: `matricula_${m.id_matricula}`,
        tipo: 'matricula',
        texto: `${m.estudiante} se inscribió en "${m.taller}"`,
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
        texto: `Abono de $${Number(a.valor).toLocaleString('es-CO')} de ${a.estudiante} pendiente de revisión`,
        fecha: a.fecha_abono,
        navegar: 'abonos',
        color: '#F59E0B',
      });
    }

    // Ordenar por fecha más reciente
    notificaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    res.json({ notificaciones });
  } catch (err) { next(err); }
}
