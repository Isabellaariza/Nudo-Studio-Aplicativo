// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import './config/db.js';
import { iniciarCron } from './config/cron.js';
import authRoutes            from './routes/auth.js';
import usuariosRoutes        from './routes/usuarios.js';
import rolesRoutes           from './routes/roles.js';
import productosRoutes       from './routes/productos.js';
import insumosRoutes         from './routes/insumos.js';
import categoriasProductos   from './routes/categoriasProductos.js';
import categoriasInsumos     from './routes/categoriasInsumos.js';
import clientesRoutes        from './routes/clientes.js';
import empleadosRoutes       from './routes/empleados.js';
import proveedoresRoutes     from './routes/proveedores.js';
import comprasRoutes         from './routes/compras.js';
import pedidosRoutes         from './routes/pedidos.js';
import ventasRoutes          from './routes/ventas.js';
import abonosRoutes          from './routes/abonos.js';
import talleresRoutes        from './routes/talleres.js';
import programacionRoutes    from './routes/programacion.js';
import estudiantesRoutes     from './routes/estudiantes.js';
import matriculasRoutes      from './routes/matriculas.js';
import materialesRoutes      from './routes/materiales.js';
import produccionRoutes      from './routes/produccion.js';
import dashboardRoutes       from './routes/dashboard.js';
import notificacionesRoutes  from './routes/notificaciones.js';
import descuentosRoutes      from './routes/descuentos.js';
import { errorHandler }      from './middleware/errorHandler.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ estado: 'ok', mensaje: 'Nudo Studio API 🪢' }));

app.use('/api/auth',                  authRoutes);
app.use('/api/usuarios',              usuariosRoutes);
app.use('/api/roles',                 rolesRoutes);
app.use('/api/productos',             productosRoutes);
app.use('/api/insumos',               insumosRoutes);
app.use('/api/categorias-productos',  categoriasProductos);
app.use('/api/categorias-insumos',    categoriasInsumos);
app.use('/api/clientes',              clientesRoutes);
app.use('/api/empleados',             empleadosRoutes);
app.use('/api/proveedores',           proveedoresRoutes);
app.use('/api/compras',               comprasRoutes);
app.use('/api/pedidos',               pedidosRoutes);
app.use('/api/ventas',                ventasRoutes);
app.use('/api/abonos',                abonosRoutes);
app.use('/api/talleres',              talleresRoutes);
app.use('/api/programacion',          programacionRoutes);
app.use('/api/estudiantes',           estudiantesRoutes);
app.use('/api/matriculas',            matriculasRoutes);
app.use('/api/materiales',            materialesRoutes);
app.use('/api/produccion',            produccionRoutes);
app.use('/api/dashboard',             dashboardRoutes);
app.use('/api/notificaciones',        notificacionesRoutes);
app.use('/api/descuentos',            descuentosRoutes);

app.use((req, res) => res.status(404).json({ mensaje: `Ruta ${req.method} ${req.path} no encontrada` }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  iniciarCron();
});