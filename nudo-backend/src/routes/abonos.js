import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarAbonos, misAbonos, crearAbono, actualizarAbono, anularAbono, aprobarAbono, rechazarAbono, crearAbonoTaller, resubirComprobanteAbono, pagarSaldo } from '../controllers/abonosController.js';

const router = Router();
router.get('/',                        verificarToken, verificarRol('administrador', 'empleado'), listarAbonos);
router.get('/mis-abonos',              verificarToken, misAbonos);
router.post('/',                       verificarToken, verificarRol('administrador', 'empleado'), crearAbono);
router.post('/taller',                 verificarToken, crearAbonoTaller);
router.post('/taller/saldo',           verificarToken, pagarSaldo);
router.put('/:id/aprobar',             verificarToken, verificarRol('administrador', 'empleado'), aprobarAbono);
router.put('/:id/rechazar',            verificarToken, verificarRol('administrador', 'empleado'), rechazarAbono);
router.put('/:id/resubir-comprobante', verificarToken, resubirComprobanteAbono);
router.put('/:id',                     verificarToken, verificarRol('administrador', 'empleado'), actualizarAbono);
router.delete('/:id',                  verificarToken, verificarRol('administrador'), anularAbono);
export default router;
