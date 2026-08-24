// src/routes/clientes.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listarClientes, obtenerCliente, crearCliente, actualizarCliente, eliminarCliente } from '../controllers/personasController.js';

const router = Router();

router.get('/',      verificarToken, listarClientes);
router.get('/:id',   verificarToken, obtenerCliente);
router.post('/',     verificarToken, verificarRol('administrador', 'empleado'), crearCliente);
router.put('/:id',   verificarToken, verificarRol('administrador', 'empleado'), actualizarCliente);
router.delete('/:id',verificarToken, verificarRol('administrador'), eliminarCliente);

export default router;