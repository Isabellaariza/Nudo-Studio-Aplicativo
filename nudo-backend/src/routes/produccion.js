// src/routes/produccion.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarProduccion, crearProduccion, actualizarProduccion, completarPedidoProduccion, agregarProductosPedido, cancelarPedidoProduccion } from '../controllers/pendientesController.js';
const router = Router();
router.get('/',    verificarToken, listarProduccion);
router.post('/',   verificarToken, verificarRol('administrador', 'empleado'), crearProduccion);
router.put('/:id', verificarToken, verificarRol('administrador', 'empleado'), actualizarProduccion);
router.put('/pedidos/:id/completar', verificarToken, verificarRol('administrador', 'empleado'), completarPedidoProduccion);
router.put('/pedidos/:id/cancelar', verificarToken, verificarRol('administrador', 'empleado'), cancelarPedidoProduccion);
router.post('/pedidos/:id/agregar-productos', verificarToken, verificarRol('administrador', 'empleado'), agregarProductosPedido);
export default router;