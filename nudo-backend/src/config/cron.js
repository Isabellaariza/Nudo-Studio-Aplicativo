/**
 * cron.js — Tareas programadas de Nudo Studio
 *
 * Requiere: npm install node-cron
 * Se ejecutan en el servidor sin dependencia de llamadas externas.
 *
 * Tareas:
 *  1. Diario a las 07:00 → cancelar abonos cuyo vencimiento_pago < HOY
 *     y el saldo_pendiente > 0 (no pagó a tiempo). Sin devolución.
 *  2. Diario a las 09:00 → recordatorio de vencimiento a los que vencen HOY.
 */

import cron from 'node-cron';
import pool from './db.js';
import { revertirACliente } from './rolHelper.js';
import {
  enviarCorreoVencimientoPago,
  enviarCorreoAbonoCancelado,
} from './email.js';

// ── HELPER: formatear fecha a español ────────────────────────────────────────
function fmtFecha(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── TAREA 1: cancelar abonos vencidos (07:00 cada día) ───────────────────────
export function iniciarCancelacionVencidos() {
  cron.schedule('0 7 * * *', async () => {
    console.log('⏰ [CRON] Cancelando abonos vencidos...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Abonos aprobados con saldo > 0 cuyo vencimiento ya pasó (< hoy a medianoche)
      const vencidos = await client.query(`
        SELECT a.id_abono, a.id_estudiante, a.id_taller, a.id_matricula,
               a.monto_abono, a.saldo_pendiente,
               e.nombre_completo, e.email,
               pt.nombre_taller,
               t.fecha AS fecha_taller
        FROM abonos a
        JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
        LEFT JOIN talleres t ON a.id_taller = t.id_talleres
        LEFT JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
        WHERE a.estado = 'aprobado'
          AND a.saldo_pendiente > 0
          AND a.vencimiento_pago IS NOT NULL
          AND a.vencimiento_pago < CURRENT_DATE
      `);

      console.log(`   → ${vencidos.rows.length} abono(s) vencido(s) encontrado(s)`);

      for (const abono of vencidos.rows) {
        // 1. Cancelar el abono
        await client.query(
          `UPDATE abonos SET estado = 'cancelado' WHERE id_abono = $1`,
          [abono.id_abono]
        );

        // 2. Cancelar la matrícula vinculada
        if (abono.id_matricula) {
          await client.query(
            `UPDATE matricula SET estado = 'cancelada' WHERE id_matricula = $1`,
            [abono.id_matricula]
          );
        }

        // 3. Revertir rol a 'cliente' si no tiene otras matrículas activas
        await revertirACliente(client, abono.id_estudiante);

        // 4. Enviar correo de cancelación (sin devolución)
        if (abono.email) {
          enviarCorreoAbonoCancelado({
            email: abono.email,
            nombre: abono.nombre_completo || 'Estudiante',
            taller: abono.nombre_taller || 'Taller',
            fechaTaller: fmtFecha(abono.fecha_taller),
            monto: abono.monto_abono,
          }).catch(err => console.error('   ✗ Correo cancelación:', err.message));
        }

        console.log(`   ✓ Abono #${abono.id_abono} cancelado (${abono.nombre_completo})`);
      }

      await client.query('COMMIT');
      console.log('✅ [CRON] Cancelación de vencidos completada');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ [CRON] Error en cancelación de vencidos:', err.message);
    } finally {
      client.release();
    }
  }, { timezone: 'America/Bogota' });
}

// ── TAREA 2: recordatorio de vencimiento (09:00 cada día) ────────────────────
export function iniciarRecordatorioVencimiento() {
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ [CRON] Enviando recordatorios de vencimiento...');
    try {
      // Abonos aprobados con saldo > 0 que vencen HOY
      const hoy = await pool.query(`
        SELECT a.id_abono, a.saldo_pendiente, a.vencimiento_pago,
               e.nombre_completo, e.email,
               pt.nombre_taller,
               t.fecha AS fecha_taller
        FROM abonos a
        JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
        LEFT JOIN talleres t ON a.id_taller = t.id_talleres
        LEFT JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
        WHERE a.estado = 'aprobado'
          AND a.saldo_pendiente > 0
          AND a.vencimiento_pago::DATE = CURRENT_DATE
      `);

      console.log(`   → ${hoy.rows.length} recordatorio(s) a enviar`);

      for (const abono of hoy.rows) {
        if (!abono.email) continue;
        enviarCorreoVencimientoPago({
          email: abono.email,
          nombre: abono.nombre_completo || 'Estudiante',
          taller: abono.nombre_taller || 'Taller',
          fechaTaller: fmtFecha(abono.fecha_taller),
          saldo: abono.saldo_pendiente,
          vencimiento: fmtFecha(abono.vencimiento_pago),
        }).catch(err => console.error('   ✗ Correo recordatorio:', err.message));
        console.log(`   ✓ Recordatorio enviado a ${abono.email}`);
      }

      console.log('✅ [CRON] Recordatorios enviados');
    } catch (err) {
      console.error('❌ [CRON] Error en recordatorios:', err.message);
    }
  }, { timezone: 'America/Bogota' });
}

// ── Iniciar todas las tareas ──────────────────────────────────────────────────
export function iniciarCron() {
  iniciarCancelacionVencidos();
  iniciarRecordatorioVencimiento();
  console.log('📅 Cron jobs activos: cancelación vencidos (07:00) y recordatorios (09:00) — Bogotá');
}
