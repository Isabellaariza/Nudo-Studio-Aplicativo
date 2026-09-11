// src/routes/auth.js
import { Router } from 'express';
import { registro, login, perfil, actualizarPerfil, cambiarContrasena, solicitarRecuperacion, resetearContrasena } from '../controllers/authController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();

// Rutas públicas
router.post('/registro', registro);
router.post('/login', login);
router.post('/recuperar-contrasena', solicitarRecuperacion);
router.post('/reset-contrasena', resetearContrasena);

// Rutas protegidas (requieren token)
router.get('/perfil',             verificarToken, perfil);
router.put('/perfil',             verificarToken, actualizarPerfil);
router.put('/cambiar-contrasena', verificarToken, cambiarContrasena);

export default router;
