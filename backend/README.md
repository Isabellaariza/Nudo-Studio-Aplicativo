# Nudo Studio — Backend API

API REST construida con **Node.js + Express + PostgreSQL (Supabase)**.

## Estructura del proyecto

```
nudo-backend/
├── src/
│   ├── config/
│   │   └── db.js              # Conexión a Supabase
│   ├── controllers/
│   │   └── authController.js  # Lógica de autenticación
│   ├── middleware/
│   │   ├── auth.js            # Verificación JWT y roles
│   │   └── errorHandler.js    # Manejo global de errores
│   ├── routes/
│   │   └── auth.js            # Rutas de autenticación
│   └── index.js               # Punto de entrada del servidor
├── seed_admin.sql             # Script para crear usuario admin
├── .env.example               # Variables de entorno (plantilla)
└── package.json
```

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Edita el archivo .env con tus datos de Supabase

# 3. Crear usuario administrador en Supabase
# Ejecuta seed_admin.sql en el SQL Editor de Supabase

# 4. Iniciar en modo desarrollo
npm run dev
```

## Obtener DATABASE_URL de Supabase

1. Entra a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings → Database**
3. En la sección **Connection string**, selecciona **URI**
4. Copia la cadena y pégala en `DATABASE_URL` de tu `.env`
5. Reemplaza `[YOUR-PASSWORD]` con tu contraseña real

## Endpoints disponibles

### Autenticación (`/api/auth`)

| Método | Ruta                    | Acceso     | Descripción              |
|--------|-------------------------|------------|--------------------------|
| POST   | `/registro`             | Público    | Crear cuenta de cliente  |
| POST   | `/login`                | Público    | Iniciar sesión           |
| GET    | `/perfil`               | 🔒 Token   | Ver perfil propio        |
| PUT    | `/cambiar-contrasena`   | 🔒 Token   | Cambiar contraseña       |

### Health check
| Método | Ruta          | Descripción              |
|--------|---------------|--------------------------|
| GET    | `/api/health` | Verificar que corre      |

## Cómo usar el token en el frontend

Después del login, guarda el token y úsalo en cada petición:

```javascript
// Login
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ correo, contrasena })
});
const { token, usuario } = await res.json();

// Guardar token
localStorage.setItem('token', token);
localStorage.setItem('usuario', JSON.stringify(usuario));

// Usar en peticiones protegidas
const token = localStorage.getItem('token');
const perfil = await fetch('http://localhost:3000/api/auth/perfil', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Próximos módulos a construir

- [ ] Productos y categorías
- [ ] Insumos y categorías  
- [ ] Proveedores y compras
- [ ] Pedidos y ventas
- [ ] Talleres, programación y matrícula
- [ ] Abonos
- [ ] Producción
- [ ] Dashboard y reportes
