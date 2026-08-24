// src/routes/proveedores.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarProveedores, obtenerProveedor, crearProveedor, actualizarProveedor, eliminarProveedor } from '../controllers/comprasController.js';

const router = Router();
router.get('/',       verificarToken, listarProveedores);
router.get('/:id',    verificarToken, obtenerProveedor);
router.post('/',      verificarToken, verificarRol('administrador', 'empleado'), crearProveedor);
router.put('/:id',    verificarToken, verificarRol('administrador', 'empleado'), actualizarProveedor);
router.delete('/:id', verificarToken, verificarRol('administrador'), eliminarProveedor);
export default router;