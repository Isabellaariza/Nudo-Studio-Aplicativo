import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listar, obtener, crear, actualizar, eliminar, listarCategorias, crearCategoria, listarMovimientos, registrarMovimiento } from '../controllers/insumosController.js';

const router = Router();

// Categorías
router.get('/categorias',       verificarToken, listarCategorias);
router.post('/categorias',      verificarToken, verificarRol('administrador', 'empleado'), crearCategoria);

// Insumos
router.get('/',                 verificarToken, listar);
router.get('/:id',              verificarToken, obtener);
router.post('/',                verificarToken, verificarRol('administrador', 'empleado'), crear);
router.put('/:id',              verificarToken, verificarRol('administrador', 'empleado'), actualizar);
router.delete('/:id',           verificarToken, verificarRol('administrador'), eliminar);

// Movimientos (kardex)
router.get('/:id/movimientos',  verificarToken, listarMovimientos);
router.post('/:id/movimientos', verificarToken, verificarRol('administrador', 'empleado'), registrarMovimiento);

export default router;