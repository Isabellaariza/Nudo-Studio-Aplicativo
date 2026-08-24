// src/routes/categoriasProductos.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarCategoriasProductos, crearCategoriaProducto, actualizarCategoriaProducto, eliminarCategoriaProducto } from '../controllers/pendientesController.js';
const router = Router();
router.get('/',       verificarToken, listarCategoriasProductos);
router.post('/',      verificarToken, verificarRol('administrador', 'empleado'), crearCategoriaProducto);
router.put('/:id',    verificarToken, verificarRol('administrador', 'empleado'), actualizarCategoriaProducto);
router.delete('/:id', verificarToken, verificarRol('administrador'), eliminarCategoriaProducto);
export default router;