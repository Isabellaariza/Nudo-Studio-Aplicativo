// src/routes/usuarios.js
import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listar, crear, actualizar, eliminar } from '../controllers/usuariosController.js';

const router = Router();
router.get('/',       verificarToken, verificarRol('administrador'), listar);
router.post('/',      verificarToken, verificarRol('administrador'), crear);
router.put('/:id',    verificarToken, verificarRol('administrador'), actualizar);
router.delete('/:id', verificarToken, verificarRol('administrador'), eliminar);
export default router;