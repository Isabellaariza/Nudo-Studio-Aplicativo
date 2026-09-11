// src/routes/ventas.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarVentas, obtenerVenta, actualizarEstadoVenta, anularVenta } from '../controllers/ventasController.js';

const router = Router();
router.get('/',        verificarToken, listarVentas);
router.get('/:id',     verificarToken, obtenerVenta);
router.post('/',       verificarToken, verificarRol('administrador', 'empleado'), (_req, res) => {
  return res.status(405).json({
    mensaje: 'Las ventas no se crean de forma directa. Se generan automáticamente al aprobar el comprobante de un pedido.',
  });
});
router.put('/:id',     verificarToken, verificarRol('administrador'), actualizarEstadoVenta);
router.delete('/:id',  verificarToken, verificarRol('administrador'), anularVenta);
export default router;