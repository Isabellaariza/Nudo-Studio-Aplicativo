// src/routes/categoriasInsumos.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarCategoriasInsumos, crearCategoriaInsumo, actualizarCategoriaInsumo, eliminarCategoriaInsumo } from '../controllers/pendientesController.js';
const router = Router();
router.get('/',       verificarToken, listarCategoriasInsumos);
router.post('/',      verificarToken, verificarRol('administrador', 'empleado'), crearCategoriaInsumo);
router.put('/:id',    verificarToken, verificarRol('administrador', 'empleado'), actualizarCategoriaInsumo);
router.delete('/:id', verificarToken, verificarRol('administrador'), eliminarCategoriaInsumo);
export default router;