// src/routes/estudiantes.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = Router();

router.get('/', verificarToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
             COUNT(m.id_matricula) AS total_matriculas
      FROM estudiantes e
      LEFT JOIN matricula m ON m.id_estudiante = e.id_estudiante
      GROUP BY e.id_estudiante
      ORDER BY e.id_estudiante DESC
    `);
    res.json({ estudiantes: result.rows, total: result.rowCount });
  } catch (err) { next(err); }
});

router.post('/', verificarToken, async (req, res, next) => {
  const { nombre_completo, email, telefono, fecha_nacimiento } = req.body;
  if (!nombre_completo) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
  try {
    const result = await pool.query(
      `INSERT INTO estudiantes (nombre_completo, email, telefono, fecha_nacimiento, monto_total, monto_pagado, estado)
       VALUES ($1, $2, $3, $4, 0, 0, TRUE) RETURNING *`,
      [nombre_completo, email || null, telefono || null, fecha_nacimiento || null]
    );
    res.status(201).json({ mensaje: 'Estudiante creado', estudiante: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', verificarToken, verificarRol('administrador', 'empleado'), async (req, res, next) => {
  const { nombre_completo, email, telefono, fecha_nacimiento, estado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE estudiantes SET
         nombre_completo  = COALESCE($1, nombre_completo),
         email            = COALESCE($2, email),
         telefono         = COALESCE($3, telefono),
         fecha_nacimiento = COALESCE($4, fecha_nacimiento),
         estado           = COALESCE($5, estado)
       WHERE id_estudiante = $6 RETURNING *`,
      [nombre_completo, email, telefono, fecha_nacimiento, estado, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ mensaje: 'Estudiante no encontrado' });
    res.json({ mensaje: 'Estudiante actualizado', estudiante: result.rows[0] });
  } catch (err) { next(err); }
});

export default router;
