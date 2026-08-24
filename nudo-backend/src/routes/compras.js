// src/routes/compras.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarCompras, obtenerCompra, crearCompra, actualizarEstadoCompra, anularCompra, listarProductosComprados } from '../controllers/comprasController.js';

const router = Router();
router.get('/productos-comprados', verificarToken, listarProductosComprados);
router.get('/',        verificarToken, listarCompras);
router.get('/:id',     verificarToken, obtenerCompra);
router.post('/',       verificarToken, verificarRol('administrador', 'empleado'), crearCompra);
router.put('/:id',     verificarToken, verificarRol('administrador', 'empleado'), actualizarEstadoCompra);
router.delete('/:id',  verificarToken, verificarRol('administrador'), anularCompra);
export default router;