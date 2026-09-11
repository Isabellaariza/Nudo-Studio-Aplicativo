// src/routes/roles.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarRoles, crearRol, actualizarRol, eliminarRol } from '../controllers/pendientesController.js';
const router = Router();
router.get('/',       verificarToken, listarRoles);
router.post('/',      verificarToken, verificarRol('administrador'), crearRol);
router.put('/:id',    verificarToken, verificarRol('administrador'), actualizarRol);
router.delete('/:id', verificarToken, verificarRol('administrador'), eliminarRol);
export default router;