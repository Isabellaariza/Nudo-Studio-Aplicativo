// src/routes/programacion.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarProgramacion, crearProgramacion, actualizarProgramacion, eliminarProgramacion } from '../controllers/programacionController.js';

const router = Router();
router.get('/',       verificarToken, listarProgramacion);
router.post('/',      verificarToken, verificarRol('administrador', 'empleado'), crearProgramacion);
router.put('/:id',    verificarToken, verificarRol('administrador', 'empleado'), actualizarProgramacion);
router.delete('/:id', verificarToken, verificarRol('administrador'), eliminarProgramacion);
export default router;
