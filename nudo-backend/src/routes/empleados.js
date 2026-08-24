// src/routes/empleados.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarEmpleados, obtenerEmpleado, crearEmpleado, actualizarEmpleado, eliminarEmpleado } from '../controllers/personasController.js';

const router = Router();

router.get('/',      verificarToken, listarEmpleados);
router.get('/:id',   verificarToken, obtenerEmpleado);
router.post('/',     verificarToken, verificarRol('administrador'), crearEmpleado);
router.put('/:id',   verificarToken, verificarRol('administrador'), actualizarEmpleado);
router.delete('/:id',verificarToken, verificarRol('administrador'), eliminarEmpleado);

export default router;