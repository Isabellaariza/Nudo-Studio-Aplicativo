// src/routes/ventas.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarVentas, obtenerVenta, crearVenta, actualizarEstadoVenta, anularVenta } from '../controllers/ventasController.js';

const router = Router();
router.get('/',        verificarToken, listarVentas);
router.get('/:id',     verificarToken, obtenerVenta);
router.post('/',       verificarToken, crearVenta);
router.put('/:id',     verificarToken, verificarRol('administrador'), actualizarEstadoVenta);
router.delete('/:id',  verificarToken, verificarRol('administrador'), anularVenta);
export default router;