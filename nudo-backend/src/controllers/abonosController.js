import pool from '../config/db.js';
import {
  enviarCorreoMatriculaConfirmada,
  enviarCorreoMatriculaCancelada,
} from '../config/email.js';

// Estados válidos de abono
// 'por_verificar' → cliente subió comprobante, espera revisión
// 'aprobado'      → primer pago verificado (puede tener saldo pendiente)
// 'completo'      → pagó el 100%
// 'rechazado'     → comprobante inválido
// 'cancelado'     → no completó el pago antes del taller

export async function misAbonos(req, res, next) {
  const id_usuario = req.usuario?.id;
  try {
    const result = await pool.query(`
      SELECT a.id_abono, a.monto_abono, a.saldo_pendiente, a.metodo_pago,
             a.estado, a.fecha_abono, a.vencimiento_pago, a.comprobante_pago, a.motivo_rechazo,
             a.id_matricula, a.id_taller,
             pt.nombre_taller AS taller,
             t.fecha AS fecha_taller, t.hora AS hora_taller,
             pt.precio
      FROM abonos a
      LEFT JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
      LEFT JOIN talleres t ON a.id_taller = t.id_talleres
      LEFT JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
      WHERE e.id_usuarios = $1
      ORDER BY a.fecha_abono DESC, a.id_abono DESC
    `, [id_usuario]);
    res.json({ abonos: result.rows });
  } catch (err) { next(err); }
}

export async function listarAbonos(req, res, next) {
  try {
    const { fecha } = req.query; // filtro opcional: ?fecha=2024-01-15
    let whereClause = '';
    const params = [];
    if (fecha) {
      params.push(fecha);
      whereClause = `WHERE a.fecha_abono::DATE = $1::DATE`;
    }
    const result = await pool.query(`
      SELECT a.id_abono, a.monto_abono, a.saldo_pendiente, a.metodo_pago,
             a.estado, a.fecha_abono, a.vencimiento_pago,
             a.id_matricula, a.id_estudiante, a.id_taller, a.comprobante_pago, a.motivo_rechazo,
             e.nombre_completo AS estudiante,
             e.email AS correo_estudiante,
             e.telefono AS celular_estudiante,
             pt.nombre_taller AS taller,
             (SELECT v.id_ventas FROM ventas v 
              WHERE v.producto ILIKE '%' || pt.nombre_taller || '%' 
                AND v.id_cliente = (SELECT id_cliente FROM clientes WHERE id_usuarios = e.id_usuarios LIMIT 1)
              ORDER BY v.fecha DESC LIMIT 1) AS id_venta_relacionada
      FROM abonos a
      LEFT JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
      LEFT JOIN talleres t ON a.id_taller = t.id_talleres
      LEFT JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
      ${whereClause}
      ORDER BY a.fecha_abono DESC, a.id_abono DESC
    `, params);
    res.json({ abonos: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
}

export async function crearAbono(req, res, next) {
  const { id_estudiante, id_taller, id_matricula, monto_abono, saldo_pendiente, metodo_pago, fecha_abono, comprobante_pago } = req.body;
  if (!id_estudiante || !monto_abono) return res.status(400).json({ mensaje: 'Estudiante y monto son obligatorios' });
  try {
    // Calcular vencimiento_pago automáticamente: fecha del taller - 1 día
    let vencimiento_pago = null;
    if (id_taller) {
      const tallerRes = await pool.query(
        `SELECT t.fecha FROM talleres t WHERE t.id_talleres = $1`, [id_taller]
      );
      if (tallerRes.rows.length && tallerRes.rows[0].fecha) {
        const fechaTaller = new Date(tallerRes.rows[0].fecha);
        fechaTaller.setDate(fechaTaller.getDate() - 1);
        vencimiento_pago = fechaTaller.toISOString().split('T')[0];
      }
    }

    const result = await pool.query(
      `INSERT INTO abonos (id_estudiante, id_taller, id_matricula, monto_abono, saldo_pendiente, metodo_pago, estado, fecha_abono, vencimiento_pago, comprobante_pago)
       VALUES ($1, $2, $3, $4, $5, $6, 'por_verificar', $7, $8, $9) RETURNING *`,
      [id_estudiante, id_taller || null, id_matricula || null, monto_abono, saldo_pendiente || 0,
       metodo_pago || 'Efectivo', fecha_abono || new Date().toISOString().split('T')[0],
       vencimiento_pago, comprobante_pago || null]
    );
    res.status(201).json({ mensaje: 'Abono registrado', abono: result.rows[0] });
  } catch (err) { next(err); }
}

export async function actualizarAbono(req, res, next) {
  const { estado, monto_abono, saldo_pendiente, metodo_pago } = req.body;
  try {
    const result = await pool.query(
      `UPDATE abonos SET
         estado          = COALESCE($1, estado),
         monto_abono     = COALESCE($2, monto_abono),
         saldo_pendiente = COALESCE($3, saldo_pendiente),
         metodo_pago     = COALESCE($4, metodo_pago)
       WHERE id_abono = $5 RETURNING *`,
      [estado, monto_abono, saldo_pendiente, metodo_pago, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Abono no encontrado' });
    res.json({ mensaje: 'Abono actualizado', abono: result.rows[0] });
  } catch (err) { next(err); }
}

export async function anularAbono(req, res, next) {
  try {
    const result = await pool.query(
      `UPDATE abonos SET estado = 'cancelado' WHERE id_abono = $1 RETURNING id_abono`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Abono no encontrado' });
    res.json({ mensaje: 'Abono cancelado' });
  } catch (err) { next(err); }
}

export async function rechazarAbono(req, res, next) {
  const { motivo } = req.body || {};
  try {
    const abonoRes = await pool.query(
      `SELECT a.id_abono, a.id_estudiante, a.id_taller,
              e.nombre_completo AS estudiante, e.email,
              pt.nombre_taller
       FROM abonos a
       LEFT JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
       LEFT JOIN talleres t ON a.id_taller = t.id_talleres
       LEFT JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
       WHERE a.id_abono = $1`, [req.params.id]
    );
    if (!abonoRes.rows.length) return res.status(404).json({ mensaje: 'Abono no encontrado' });
    const abono = abonoRes.rows[0];

    await pool.query(
      `UPDATE abonos SET estado = 'rechazado', motivo_rechazo = $2 WHERE id_abono = $1`,
      [req.params.id, motivo || null]
    );

    if (abono.email) {
      enviarCorreoMatriculaCancelada({
        email: abono.email,
        nombre: abono.estudiante || 'Cliente',
        taller: abono.nombre_taller || 'Taller',
        motivo: motivo || 'El comprobante de pago adjunto no es válido o no cumple los requisitos.',
      }).catch(() => {});
    }

    res.json({ mensaje: 'Abono rechazado' });
  } catch (err) { next(err); }
}

export async function aprobarAbono(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const abonoRes = await client.query(
      `SELECT a.*, t.id_talleres, t.id_programacion AS id_programacion_taller, pt.nombre_taller, pt.precio
       FROM abonos a
       LEFT JOIN talleres t ON a.id_taller = t.id_talleres
       LEFT JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
       WHERE a.id_abono = $1`, [req.params.id]
    );
    if (!abonoRes.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ mensaje: 'Abono no encontrado' }); }
    const abono = abonoRes.rows[0];

    if (abono.estado === 'aprobado' || abono.estado === 'completo') {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'Este abono ya fue aprobado' });
    }

    const id_estudiante = abono.id_estudiante;
    if (!id_estudiante) { await client.query('ROLLBACK'); return res.status(400).json({ mensaje: 'El abono no tiene estudiante asociado' }); }

    const tieneSaldo = Number(abono.saldo_pendiente) > 0;
    const nuevoEstadoAbono = tieneSaldo ? 'aprobado' : 'completo';

    // ── VALIDAR MÁXIMO 2 ABONOS POR TALLER ──────────────────────────────
    // Contamos abonos activos (aprobado/completo/por_verificar) excluyendo el actual
    const totalAbonosRes = await client.query(
      `SELECT COUNT(*) AS total FROM abonos
       WHERE id_estudiante = $1 AND id_taller = $2
         AND estado IN ('aprobado', 'completo')
         AND id_abono != $3`,
      [id_estudiante, abono.id_taller, abono.id_abono]
    );
    const abonosYaAprobados = Number(totalAbonosRes.rows[0].total);

    // Si ya hay 2 abonos aprobados/completos anteriores, rechazar
    if (abonosYaAprobados >= 2) {
      await client.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'Ya existen 2 abonos aprobados para este taller. No se permiten más.' });
    }

    // Número de este abono: el que se está aprobando es el (abonosYaAprobados + 1)
    const numeroAbono = abonosYaAprobados + 1; // 1 o 2
    const tipoAbono = numeroAbono === 1 ? 'Primer abono' : 'Segundo abono';

    // ── OBTENER DATOS DEL ESTUDIANTE PARA LA VENTA ─────────────────────
    const estudianteRes = await client.query(
      `SELECT e.nombre_completo, e.email,
              (SELECT id_cliente FROM clientes WHERE id_usuarios = e.id_usuarios LIMIT 1) AS id_cliente
       FROM estudiantes e WHERE e.id_estudiante = $1`, [id_estudiante]
    );
    const estudianteData = estudianteRes.rows[0] || {};

    // ── RAMA A: Pago de saldo (abono ya tiene matrícula vinculada) ────────
    // Este es siempre el segundo pago → número 2
    if (abono.id_matricula) {
      // Marcar este abono como completo
      await client.query(`UPDATE abonos SET estado = 'completo' WHERE id_abono = $1`, [req.params.id]);
      // Activar la matrícula
      await client.query(`UPDATE matricula SET estado = 'activo' WHERE id_matricula = $1`, [abono.id_matricula]);
      // Cerrar el primer abono (saldo → 0, estado → completo)
      await client.query(
        `UPDATE abonos SET saldo_pendiente = 0, estado = 'completo'
         WHERE id_estudiante = $1 AND id_taller = $2 AND estado = 'aprobado' AND saldo_pendiente > 0`,
        [id_estudiante, abono.id_taller]
      );

      // Generar venta independiente para este segundo pago
      await client.query(
        `INSERT INTO ventas (fecha, producto, cantidad, total, estado, id_cliente)
         VALUES (NOW(), $1, 1, $2, TRUE, $3)`,
        [
          `${tipoAbono} · ${abono.nombre_taller || 'Taller'} (Abono ${numeroAbono}/2)`,
          Number(abono.monto_abono) || 0,
          estudianteData.id_cliente || null,
        ]
      );

      await client.query('COMMIT');
      return res.json({ mensaje: 'Saldo aprobado, matrícula activada, venta registrada', id_matricula: abono.id_matricula });
    }

    // ── RAMA B: Primer pago (sin matrícula aún) ───────────────────────────
    // Marcar abono con estado correcto
    await client.query(`UPDATE abonos SET estado = $1 WHERE id_abono = $2`, [nuevoEstadoAbono, req.params.id]);

    // Verificar que no esté ya matriculado (evitar duplicados)
    const yaMatriculado = await client.query(
      `SELECT id_matricula FROM matricula WHERE id_estudiante = $1 AND id_programacion = $2`,
      [id_estudiante, abono.id_programacion_taller]
    );

    let id_matricula;
    if (yaMatriculado.rows.length) {
      id_matricula = yaMatriculado.rows[0].id_matricula;
    } else {
      // Crear matrícula: pendiente_pago si debe saldo, activo si pagó todo
      const estadoMatricula = tieneSaldo ? 'pendiente_pago' : 'activo';
      const matriculaRes = await client.query(
        `INSERT INTO matricula (id_estudiante, id_programacion, fecha_matricula, estado)
         VALUES ($1, $2, CURRENT_DATE, $3) RETURNING id_matricula`,
        [id_estudiante, abono.id_programacion_taller, estadoMatricula]
      );
      id_matricula = matriculaRes.rows[0].id_matricula;
      await client.query(`UPDATE abonos SET id_matricula = $1 WHERE id_abono = $2`, [id_matricula, req.params.id]);
    }

    // Generar venta independiente para este primer pago
    await client.query(
      `INSERT INTO ventas (fecha, producto, cantidad, total, estado, id_cliente)
       VALUES (NOW(), $1, 1, $2, TRUE, $3)`,
      [
        `${tipoAbono} · ${abono.nombre_taller || 'Taller'} (Abono ${numeroAbono}/2)`,
        Number(abono.monto_abono) || 0,
        estudianteData.id_cliente || null,
      ]
    );

    await client.query('COMMIT');

    // Correo de confirmación solo si el pago cubre el total (sin saldo pendiente)
    if (!tieneSaldo) {
      const emailRes = await pool.query(
        `SELECT e.nombre_completo, e.email, pt.nombre_taller, t.fecha, t.hora, pt.precio
         FROM estudiantes e
         LEFT JOIN talleres t ON t.id_talleres = $1
         LEFT JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
         WHERE e.id_estudiante = $2`,
        [abono.id_taller, abono.id_estudiante]
      );
      if (emailRes.rows.length && emailRes.rows[0].email) {
        const d = emailRes.rows[0];
        enviarCorreoMatriculaConfirmada({
          email: d.email,
          nombre: d.nombre_completo || 'Estudiante',
          taller: d.nombre_taller || 'Taller',
          fecha: d.fecha ? new Date(d.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
          hora: d.hora || null,
          precio: Number(d.precio) || 0,
        }).catch(() => {});
      }
    }

    res.json({
      mensaje: tieneSaldo
        ? 'Primer abono aprobado, matrícula creada con saldo pendiente, venta registrada'
        : 'Primer abono aprobado, matrícula activada y venta registrada',
      id_matricula
    });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
}

export async function resubirComprobanteAbono(req, res, next) {
  const { comprobante_pago } = req.body;
  if (!comprobante_pago) return res.status(400).json({ mensaje: 'URL del comprobante requerida' });
  try {
    const result = await pool.query(
      `UPDATE abonos SET comprobante_pago = $1, estado = 'por_verificar', motivo_rechazo = NULL WHERE id_abono = $2 RETURNING id_abono`,
      [comprobante_pago, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Abono no encontrado' });
    res.json({ mensaje: 'Comprobante actualizado, pendiente de revisión' });
  } catch (err) { next(err); }
}

export async function pagarSaldo(req, res, next) {
  const { id_taller, comprobante_pago, metodo_pago } = req.body;
  const id_usuario = req.usuario?.id;
  if (!id_taller || !comprobante_pago) return res.status(400).json({ mensaje: 'Taller y comprobante son obligatorios' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const estRes = await client.query(`SELECT id_estudiante FROM estudiantes WHERE id_usuarios = $1`, [id_usuario]);
    if (!estRes.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ mensaje: 'No tienes un perfil de estudiante' }); }
    const id_estudiante = estRes.rows[0].id_estudiante;

    // Buscar abono original aprobado con saldo pendiente
    const abonoRes = await client.query(
      `SELECT a.*, pt.precio, pt.nombre_taller
       FROM abonos a
       LEFT JOIN talleres t ON a.id_taller = t.id_talleres
       LEFT JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
       WHERE a.id_estudiante = $1 AND a.id_taller = $2 AND a.estado = 'aprobado' AND a.saldo_pendiente > 0
       ORDER BY a.id_abono DESC LIMIT 1`,
      [id_estudiante, id_taller]
    );
    if (!abonoRes.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ mensaje: 'No se encontró un abono aprobado con saldo pendiente para este taller' }); }
    const abono = abonoRes.rows[0];

    // Verificar que no haya ya un pago de saldo en revisión
    const saldoEnRevision = await client.query(
      `SELECT id_abono FROM abonos WHERE id_estudiante = $1 AND id_taller = $2 AND id_matricula = $3 AND estado = 'por_verificar'`,
      [id_estudiante, id_taller, abono.id_matricula]
    );
    if (saldoEnRevision.rows.length) { await client.query('ROLLBACK'); return res.status(409).json({ mensaje: 'Ya tienes un comprobante de saldo en revisión' }); }

    const nuevoAbono = await client.query(
      `INSERT INTO abonos (id_estudiante, id_taller, id_matricula, monto_abono, saldo_pendiente, metodo_pago, estado, fecha_abono, comprobante_pago)
       VALUES ($1, $2, $3, $4, 0, $5, 'por_verificar', CURRENT_DATE, $6) RETURNING *`,
      [id_estudiante, id_taller, abono.id_matricula, abono.saldo_pendiente, metodo_pago || 'Transferencia', comprobante_pago]
    );

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Pago del saldo registrado, pendiente de verificación', abono: nuevoAbono.rows[0] });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
}

export async function crearAbonoTaller(req, res, next) {
  const { id_taller, monto_abono, metodo_pago, comprobante_pago } = req.body;
  const id_usuario = req.usuario?.id;
  if (!id_taller || !monto_abono) return res.status(400).json({ mensaje: 'Taller y monto son obligatorios' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tallerRes = await client.query(
      `SELECT t.id_talleres, pt.nombre_taller, pt.precio, t.cupos,
              COUNT(m.id_matricula) AS inscritos
       FROM talleres t
       JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
       LEFT JOIN matricula m ON m.id_programacion = t.id_talleres
       WHERE t.id_talleres = $1 AND t.estado = TRUE
       GROUP BY t.id_talleres, pt.nombre_taller, pt.precio`, [id_taller]
    );
    if (!tallerRes.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ mensaje: 'Taller no encontrado' }); }
    const taller = tallerRes.rows[0];
    if (Number(taller.inscritos) >= Number(taller.cupos)) { await client.query('ROLLBACK'); return res.status(409).json({ mensaje: 'No hay cupos disponibles' }); }

    const precio = Number(taller.precio);
    const minimo = precio * 0.5;
    if (Number(monto_abono) < minimo) { await client.query('ROLLBACK'); return res.status(400).json({ mensaje: `El abono mínimo es $${minimo.toLocaleString()} COP (50%)` }); }

    let id_estudiante;
    const estRes = await client.query(`SELECT id_estudiante FROM estudiantes WHERE id_usuarios = $1`, [id_usuario]);
    if (estRes.rows.length) {
      id_estudiante = estRes.rows[0].id_estudiante;
    } else {
      const usuRes = await client.query(`SELECT nombre, email, telefono FROM usuarios WHERE id_usuarios = $1`, [id_usuario]);
      const u = usuRes.rows[0];
      const nuevo = await client.query(
        `INSERT INTO estudiantes (nombre_completo, email, telefono, id_usuarios, estado, monto_total, monto_pagado)
         VALUES ($1, $2, $3, $4, TRUE, $5, $6) RETURNING id_estudiante`,
        [u.nombre, u.email, u.telefono || null, id_usuario, precio, Number(monto_abono)]
      );
      id_estudiante = nuevo.rows[0].id_estudiante;
    }

    // Verificar que no tenga abono activo para este taller
    const abonoExiste = await client.query(
      `SELECT id_abono FROM abonos WHERE id_estudiante = $1 AND id_taller = $2 AND estado IN ('por_verificar', 'aprobado', 'completo')`,
      [id_estudiante, id_taller]
    );
    if (abonoExiste.rows.length) { await client.query('ROLLBACK'); return res.status(409).json({ mensaje: 'Ya tienes un abono registrado para este taller' }); }

    const saldo = precio - Number(monto_abono);

    // Calcular vencimiento_pago: fecha del taller - 1 día
    const tallerFechaRes = await client.query(
      `SELECT fecha FROM talleres WHERE id_talleres = $1`, [id_taller]
    );
    let vencimiento_pago = null;
    if (tallerFechaRes.rows.length && tallerFechaRes.rows[0].fecha) {
      const fTaller = new Date(tallerFechaRes.rows[0].fecha);
      fTaller.setDate(fTaller.getDate() - 1);
      vencimiento_pago = fTaller.toISOString().split('T')[0];
    }

    const result = await client.query(
      `INSERT INTO abonos (id_estudiante, id_taller, monto_abono, saldo_pendiente, metodo_pago, estado, fecha_abono, vencimiento_pago, comprobante_pago)
       VALUES ($1, $2, $3, $4, $5, 'por_verificar', CURRENT_DATE, $6, $7) RETURNING *`,
      [id_estudiante, id_taller, monto_abono, saldo < 0 ? 0 : saldo, metodo_pago || 'Transferencia', vencimiento_pago, comprobante_pago || null]
    );

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Abono registrado, pendiente de verificación', abono: result.rows[0] });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
}
