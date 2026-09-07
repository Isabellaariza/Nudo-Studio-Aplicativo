import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import {
  listarDescuentos,
  descuentosProducto,
  descuentosActivos,
  crearDescuento,
  actualizarDescuento,
  eliminarDescuento,
} from '../controllers/descuentosController.js';

const router = Router();

// Públicas (el carrito las necesita sin auth)
router.get('/activos', descuentosActivos);
router.get('/producto/:id_producto', descuentosProducto);

// Protegidas (solo admin)
router.get('/', verificarToken, verificarRol('administrador'), listarDescuentos);
router.post('/', verificarToken, verificarRol('administrador'), crearDescuento);
router.put('/:id', verificarToken, verificarRol('administrador'), actualizarDescuento);
router.delete('/:id', verificarToken, verificarRol('administrador'), eliminarDescuento);

export default router;
