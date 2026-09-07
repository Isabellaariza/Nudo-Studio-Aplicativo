// src/routes/talleres.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarTalleres, crearTaller, actualizarTaller, eliminarTaller, listarInstructores, completarTaller } from '../controllers/talleresController.js';
import pool from '../config/db.js';
import { promoverAEstudiante } from '../config/rolHelper.js';

const router = Router();
router.get('/instructores', verificarToken, listarInstructores);
router.get('/',        listarTalleres);
router.post('/',       verificarToken, verificarRol('administrador', 'empleado'), crearTaller);
router.put('/:id/completar', verificarToken, verificarRol('administrador', 'empleado'), completarTaller);
router.put('/:id',     verificarToken, verificarRol('administrador', 'empleado'), actualizarTaller);
router.delete('/:id',  verificarToken, verificarRol('administrador'), eliminarTaller);

// Inscripción de cliente a taller
router.post('/:id/inscribirse', verificarToken, async (req, res, next) => {
  const id_taller = Number(req.params.id);
  const id_usuario = req.usuario.id;
  try {
    const tallerRes = await pool.query(
      `SELECT t.id_talleres, pt.nombre_taller, pt.precio,
              COUNT(m.id_matricula) AS inscritos
       FROM talleres t
       JOIN programacion_talleres pt ON t.id_programacion = pt.id_programacion_taller
       LEFT JOIN matricula m ON m.id_programacion = t.id_talleres
       WHERE t.id_talleres = $1 AND t.estado = TRUE
       GROUP BY t.id_talleres, pt.nombre_taller, pt.precio`, [id_taller]
    );
    if (!tallerRes.rows.length) return res.status(404).json({ mensaje: 'Taller no encontrado' });
    const { inscritos, precio, nombre_taller } = tallerRes.rows[0];

    let estRes = await pool.query(`SELECT id_estudiante FROM estudiantes WHERE id_usuarios = $1`, [id_usuario]);
    let id_estudiante;
    if (estRes.rows.length) {
      id_estudiante = estRes.rows[0].id_estudiante;
    } else {
      const usuRes = await pool.query(`SELECT nombre, email, telefono FROM usuarios WHERE id_usuarios = $1`, [id_usuario]);
      const u = usuRes.rows[0];
      const nuevo = await pool.query(
        `INSERT INTO estudiantes (nombre_completo, email, telefono, id_usuarios, estado, monto_total, monto_pagado)
         VALUES ($1, $2, $3, $4, true, $5, 0) RETURNING id_estudiante`,
        [u.nombre, u.email, u.telefono || null, id_usuario, precio]
      );
      id_estudiante = nuevo.rows[0].id_estudiante;
    }

    const existe = await pool.query(
      `SELECT id_matricula FROM matricula WHERE id_estudiante = $1 AND id_programacion = $2`,
      [id_estudiante, id_taller]
    );
    if (existe.rows.length) return res.status(409).json({ mensaje: 'Ya estás inscrito en este taller' });

    const result = await pool.query(
      `INSERT INTO matricula (id_estudiante, id_programacion, nombre_taller, fecha_matricula, estado)
       VALUES ($1, $2, $3, CURRENT_DATE, 'pendiente') RETURNING *`,
      [id_estudiante, id_taller, nombre_taller]
    );

    // Promover rol a 'estudiante' en usuarios y clientes
    await promoverAEstudiante(pool, id_estudiante);

    res.status(201).json({ mensaje: 'Inscripción registrada.', matricula: result.rows[0] });
  } catch (err) { next(err); }
});

export default router;