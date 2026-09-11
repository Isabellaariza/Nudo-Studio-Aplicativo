// src/routes/dashboard.js
import { Router } from 'express';
import { verificarToken } from '../middleware/auth.js';
import { obtenerEstadisticas } from '../controllers/dashboardController.js';

const router = Router();
router.get('/', verificarToken, obtenerEstadisticas);
export default router;