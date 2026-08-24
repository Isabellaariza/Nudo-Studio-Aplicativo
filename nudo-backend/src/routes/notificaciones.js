import { Router } from 'express';
import { obtenerNotificaciones } from '../controllers/notificacionesController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();
router.get('/', verificarToken, obtenerNotificaciones);
export default router;
