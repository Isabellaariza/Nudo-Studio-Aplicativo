import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import pool from '../config/db.js';
import { promoverAEstudiante, revertirACliente } from '../config/rolHelper.js';
import {
  enviarCorreoMatriculaConfirmada,
  enviarCorreoMatriculaCancelada,
} from '../config/email.js';

const router = Router();

// Matrículas del cliente logueado
router.get('/mis-matriculas', verificarToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT m.id_matricula, m.estado, m.fecha_matricula,
             pt.nombre_taller AS taller, pt.precio, pt.nombre_instructor AS instructor,
             t.fecha AS fecha_taller, t.hora
      FROM matricula m
      JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
      LEFT JOIN programacion_talleres pt ON m.id_programacion = pt.id_programacion_taller
      LEFT JOIN talleres t ON t.id_programacion = pt.id_programacion_taller
      WHERE e.id_usuarios = $1
      ORDER BY m.id_matricula DESC
    `, [req.usuario.id]);
    res.json({ matriculas: result.rows });
  } catch (err) { next(err); }
});

router.get('/', verificarToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT m.id_matricula, m.id_estudiante, m.id_programacion,
             m.fecha_matricula, m.estado,
             e.nombre_completo AS estudiante, e.email, e.telefono,
             e.monto_total, e.monto_pagado,
             pt.nombre_taller AS taller, pt.precio,
             pt.nombre_instructor AS instructor,
             t.fecha AS fecha_taller, t.hora, t.lugar
      FROM matricula m
      JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
      LEFT JOIN programacion_talleres pt ON m.id_programacion = pt.id_programacion_taller
      LEFT JOIN talleres t ON t.id_programacion = pt.id_programacion_taller
      ORDER BY m.id_matricula DESC
    `);
    res.json({ matriculas: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
});

router.post('/', verificarToken, async (req, res, next) => {
  const { id_estudiante, id_programacion } = req.body;
  if (!id_estudiante || !id_programacion) return res.status(400).json({ mensaje: 'Estudiante y programación son obligatorios' });
  try {
    // Verificar que no esté ya matriculado
    const existe = await pool.query(
      `SELECT id_matricula FROM matricula WHERE id_estudiante = $1 AND id_programacion = $2`,
      [id_estudiante, id_programacion]
    );
    if (existe.rows.length) return res.status(409).json({ mensaje: 'El estudiante ya está matriculado en esta programación' });

    // Verificar cupos disponibles (sin columna cupos — siempre hay lugar)
    // Si necesitas límite de cupos, agrégalo como campo en programacion_talleres

    // Obtener precio del taller
    const precio = await pool.query(
      `SELECT t.precio FROM programacion_talleres pt JOIN talleres t ON t.id_programacion = pt.id_programacion_taller WHERE pt.id_programacion_taller = $1`,
      [id_programacion]
    );
    const monto = precio.rows[0]?.precio || 0;

    const result = await pool.query(
      `INSERT INTO matricula (id_estudiante, id_programacion, fecha_matricula, estado)
       VALUES ($1, $2, CURRENT_DATE, 'activa') RETURNING *`,
      [id_estudiante, id_programacion]
    );

    // Actualizar monto_total en estudiante
    await pool.query(
      `UPDATE estudiantes SET monto_total = COALESCE(monto_total, 0) + $1 WHERE id_estudiante = $2`,
      [monto, id_estudiante]
    );

    // Promover rol a 'estudiante' en usuarios y clientes
    await promoverAEstudiante(pool, id_estudiante);

    res.status(201).json({ mensaje: 'Matrícula registrada', matricula: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', verificarToken, verificarRol('administrador', 'empleado'), async (req, res, next) => {
  const { estado, motivo } = req.body;
  try {
    // Obtener datos antes de actualizar
    const matRes = await pool.query(`
      SELECT m.id_matricula, m.id_estudiante, m.estado AS estado_anterior,
             e.nombre_completo AS estudiante, e.email,
             pt.nombre_taller, pt.precio,             t.fecha AS fecha_taller, t.hora
      FROM matricula m
      JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
      LEFT JOIN programacion_talleres pt ON m.id_programacion = pt.id_programacion_taller
      LEFT JOIN talleres t ON t.id_programacion = pt.id_programacion_taller
      WHERE m.id_matricula = $1`, [req.params.id]
    );
    if (!matRes.rows.length) return res.status(404).json({ mensaje: 'Matrícula no encontrada' });
    const mat = matRes.rows[0];

    const result = await pool.query(
      `UPDATE matricula SET estado = COALESCE($1, estado) WHERE id_matricula = $2 RETURNING *`,
      [estado, req.params.id]
    );

    // Si la matrícula se cancela o completa, verificar si el estudiante debe volver a 'cliente'
    if (estado === 'cancelada' || estado === 'completada') {
      await revertirACliente(pool, mat.id_estudiante);
    }
    // Si se reactiva, promover de nuevo a 'estudiante'
    if (estado === 'activa') {
      await promoverAEstudiante(pool, mat.id_estudiante);
    }

    // Enviar correo si cambió el estado y hay email
    if (mat.email && estado !== mat.estado_anterior) {
      const fecha = mat.fecha_taller ? new Date(mat.fecha_taller).toLocaleDateString('es-CO') : null;
      if (estado === 'activa') {
        enviarCorreoMatriculaConfirmada({ email: mat.email, nombre: mat.estudiante, taller: mat.nombre_taller, fecha, hora: mat.hora?.slice(0,5) || null, precio: mat.precio }).catch(() => {});
      } else if (estado === 'cancelada') {
        enviarCorreoMatriculaCancelada({ email: mat.email, nombre: mat.estudiante, taller: mat.nombre_taller, motivo: motivo || null }).catch(() => {});
      }
    }

    res.json({ mensaje: 'Matrícula actualizada', matricula: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', verificarToken, verificarRol('administrador'), async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM matricula WHERE id_matricula = $1`, [req.params.id]);
    res.json({ mensaje: 'Matrícula eliminada' });
  } catch (err) { next(err); }
});

export default router;
