// src/routes/materiales.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarMateriales, listarMaterialesPorProgramacion, listarInsumosParaMateriales, crearMaterial, actualizarMaterial, eliminarMaterial } from '../controllers/materialesController.js';

const router = Router();
router.get('/insumos',                    verificarToken, listarInsumosParaMateriales);
router.get('/por-programacion/:id',       verificarToken, listarMaterialesPorProgramacion);
router.get('/',                           verificarToken, listarMateriales);
router.post('/',      verificarToken, verificarRol('administrador', 'empleado'), crearMaterial);
router.put('/:id',    verificarToken, verificarRol('administrador', 'empleado'), actualizarMaterial);
router.delete('/:id', verificarToken, verificarRol('administrador', 'empleado'), eliminarMaterial);
export default router;
