import { Router } from 'express';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { listar, obtener, crear, actualizar, eliminar, listarCategorias, crearCategoria } from '../controllers/productosController.js';

const router = Router();

// Categorías (públicas)
router.get('/categorias',       listarCategorias);
router.post('/categorias',      verificarToken, verificarRol('administrador', 'empleado'), crearCategoria);

// Productos
router.get('/',                  listar);
router.get('/:id',              verificarToken, obtener);
router.post('/',                verificarToken, verificarRol('administrador', 'empleado'), crear);
router.put('/:id',              verificarToken, verificarRol('administrador', 'empleado'), actualizar);
router.delete('/:id',           verificarToken, verificarRol('administrador'), eliminar);

export default router;